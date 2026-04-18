/**
 * Migration safety checker.
 *
 * Scans SQL migration files for dangerous patterns that break backward
 * compatibility during rolling deployments (old + new code running
 * simultaneously against the same database).
 *
 * Run manually:   npx tsx scripts/check-migrations.ts
 * Run in CI:      npx tsx scripts/check-migrations.ts --ci
 * Check specific: npx tsx scripts/check-migrations.ts drizzle/migrations/0001_xyz.sql
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const MIGRATIONS_DIR = './drizzle/migrations';

interface Violation {
	file: string;
	line: number;
	rule: string;
	severity: 'error' | 'warning';
	message: string;
	suggestion: string;
}

const RULES: {
	pattern: RegExp;
	rule: string;
	severity: 'error' | 'warning';
	message: string;
	suggestion: string;
}[] = [
	{
		pattern: /\bDROP\s+TABLE\b/i,
		rule: 'no-drop-table',
		severity: 'error',
		message: 'DROP TABLE removes data permanently and breaks old code still referencing the table.',
		suggestion:
			'Use expand/contract: (1) stop writing to the table, (2) deploy, (3) drop in a later migration.'
	},
	{
		pattern: /\bDROP\s+COLUMN\b/i,
		rule: 'no-drop-column',
		severity: 'error',
		message: 'DROP COLUMN removes data and breaks old code still reading/writing the column.',
		suggestion:
			'Use expand/contract: (1) stop using the column in code, (2) deploy, (3) drop in a later migration.'
	},
	{
		pattern: /\bALTER\s+TABLE\b.*\bRENAME\s+COLUMN\b/i,
		rule: 'no-rename-column',
		severity: 'error',
		message: 'RENAME COLUMN breaks old code that references the old column name.',
		suggestion:
			'Use expand/contract: (1) add new column, (2) backfill, (3) deploy code using new column, (4) drop old column later.'
	},
	{
		pattern: /\bALTER\s+TABLE\b.*\bRENAME\s+TO\b/i,
		rule: 'no-rename-table',
		severity: 'error',
		message: 'RENAME TABLE breaks old code that references the old table name.',
		suggestion:
			'Use expand/contract: (1) create new table, (2) migrate data, (3) deploy code using new table, (4) drop old table later.'
	},
	{
		pattern: /\bSET\s+NOT\s+NULL\b/i,
		rule: 'no-add-not-null',
		severity: 'error',
		message:
			'Adding NOT NULL to an existing column will fail if NULLs exist and breaks old code that inserts NULLs.',
		suggestion:
			'(1) Add a DEFAULT value first, (2) backfill existing NULLs, (3) then add NOT NULL in a later migration.'
	},
	{
		pattern: /\bALTER\s+TABLE\b.*\bADD\b(?!.*\bDEFAULT\b).*\bNOT\s+NULL\b/i,
		rule: 'no-add-column-not-null-without-default',
		severity: 'error',
		message: 'Adding a NOT NULL column without a DEFAULT will fail on tables with existing rows.',
		suggestion: 'Add the column as nullable or with a DEFAULT value.'
	},
	{
		pattern: /\bDROP\s+INDEX\b(?!\s+CONCURRENTLY)/i,
		rule: 'no-drop-index-without-concurrently',
		severity: 'warning',
		message: 'DROP INDEX without CONCURRENTLY takes an exclusive lock, blocking reads and writes.',
		suggestion: 'Use DROP INDEX CONCURRENTLY to avoid blocking.'
	},
	{
		pattern: /\bCREATE\s+(?:UNIQUE\s+)?INDEX\b(?!\s+CONCURRENTLY)/i,
		rule: 'no-create-index-without-concurrently',
		severity: 'warning',
		message:
			'CREATE INDEX without CONCURRENTLY locks the table for writes (can be slow on large tables).',
		suggestion:
			'Use CREATE INDEX CONCURRENTLY for large tables. Acceptable for initial migration or small tables.'
	},
	{
		pattern: /\bALTER\s+TYPE\b|\bUSING\b.*::/i,
		rule: 'no-alter-column-type',
		severity: 'warning',
		message: 'Changing column type can fail or lose data, and may require a full table rewrite.',
		suggestion: 'Use expand/contract: add new column with new type, backfill, switch code, drop old.'
	},
	{
		pattern: /\bTRUNCATE\b/i,
		rule: 'no-truncate',
		severity: 'error',
		message: 'TRUNCATE removes all data from the table.',
		suggestion: 'Use DELETE with a WHERE clause if you need to remove specific rows.'
	},
	{
		pattern: /\bDROP\s+CONSTRAINT\b/i,
		rule: 'no-drop-constraint',
		severity: 'warning',
		message: 'Dropping constraints can allow invalid data.',
		suggestion: 'Ensure the application code handles the relaxed constraint before dropping.'
	}
];

function checkFile(filePath: string): Violation[] {
	const content = readFileSync(filePath, 'utf-8');
	const lines = content.split('\n');
	const violations: Violation[] = [];
	const fileName = basename(filePath);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip comments
		if (line.trim().startsWith('--')) continue;

		for (const rule of RULES) {
			if (rule.pattern.test(line)) {
				violations.push({
					file: fileName,
					line: i + 1,
					rule: rule.rule,
					severity: rule.severity,
					message: rule.message,
					suggestion: rule.suggestion
				});
			}
		}
	}

	return violations;
}

function main() {
	const args = process.argv.slice(2);
	const ciMode = args.includes('--ci');
	const specificFiles = args.filter((a) => a.endsWith('.sql'));

	let files: string[];

	if (specificFiles.length > 0) {
		files = specificFiles;
	} else {
		// Check all migration files
		try {
			files = readdirSync(MIGRATIONS_DIR)
				.filter((f) => f.endsWith('.sql'))
				.map((f) => join(MIGRATIONS_DIR, f));
		} catch {
			console.log('No migrations directory found. Nothing to check.');
			process.exit(0);
		}
	}

	if (files.length === 0) {
		console.log('No migration files to check.');
		process.exit(0);
	}

	const allViolations: Violation[] = [];

	for (const file of files) {
		const violations = checkFile(file);
		allViolations.push(...violations);
	}

	// Filter initial migration — CREATE INDEX without CONCURRENTLY is fine there
	const isInitialMigration = (v: Violation) =>
		v.file.startsWith('0000_') && v.rule === 'no-create-index-without-concurrently';

	const relevant = allViolations.filter((v) => !isInitialMigration(v));

	if (relevant.length === 0) {
		console.log(`✓ ${files.length} migration file(s) checked — no issues found.`);
		process.exit(0);
	}

	const errors = relevant.filter((v) => v.severity === 'error');
	const warnings = relevant.filter((v) => v.severity === 'warning');

	console.log(`\nMigration safety check: ${errors.length} error(s), ${warnings.length} warning(s)\n`);

	for (const v of relevant) {
		const icon = v.severity === 'error' ? '✗' : '⚠';
		console.log(`${icon} ${v.file}:${v.line} [${v.rule}]`);
		console.log(`  ${v.message}`);
		console.log(`  → ${v.suggestion}\n`);
	}

	if (ciMode && errors.length > 0) {
		console.log('Failing CI — fix the errors above or add expand/contract migrations.');
		process.exit(1);
	}

	if (errors.length > 0) {
		process.exit(1);
	}
}

main();
