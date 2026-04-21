/**
 * Migrate legacy pg-pkg `api_keys` rows into the postguard-business
 * `organizations` + `business_api_keys` tables.
 *
 * See `docs/migrate-legacy-api-keys.md` for the full design discussion,
 * open product questions, and operator runbook.
 *
 * Usage:
 *   DATABASE_URL=postgres://...business-db \
 *   LEGACY_DATABASE_URL=postgres://...pkg-db \
 *   tsx scripts/migrate-legacy-api-keys.ts --dry-run
 *
 *   # ...once the dry-run output has been reviewed:
 *   tsx scripts/migrate-legacy-api-keys.ts --live
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { organizations, apiKeys } from '../src/lib/server/db/schema.ts';
import {
	planMigration,
	type LegacyApiKeyRow
} from '../src/lib/server/migrations/legacy-api-keys.ts';

type Mode = 'dry-run' | 'live';

function parseMode(argv: string[]): Mode {
	if (argv.includes('--live')) return 'live';
	return 'dry-run';
}

async function readLegacyRows(legacyUrl: string): Promise<LegacyApiKeyRow[]> {
	const client = postgres(legacyUrl, { max: 1 });
	try {
		const rows = await client<LegacyApiKeyRow[]>`
			SELECT api_key, email, organisation_name, phone_number, kvk_number,
			       organisation_name_public, phone_number_public, kvk_number_public,
			       expires_at
			FROM api_keys
			WHERE expires_at > NOW()
		`;
		return rows;
	} finally {
		await client.end();
	}
}

async function main() {
	const mode = parseMode(process.argv.slice(2));

	const DATABASE_URL = process.env.DATABASE_URL;
	const LEGACY_DATABASE_URL = process.env.LEGACY_DATABASE_URL;

	if (!DATABASE_URL) {
		console.error('DATABASE_URL is not set (target: postguard-business DB)');
		process.exit(1);
	}
	if (!LEGACY_DATABASE_URL) {
		console.error('LEGACY_DATABASE_URL is not set (source: legacy pg-pkg DB)');
		process.exit(1);
	}

	console.log(`Mode: ${mode}`);
	console.log('Reading legacy api_keys...');
	const legacyRows = await readLegacyRows(LEGACY_DATABASE_URL);
	console.log(`  Found ${legacyRows.length} active legacy key(s).`);

	const plan = planMigration(legacyRows);

	console.log(`\nPlanned actions:`);
	console.log(`  ${plan.orgs.length} organisation(s) will be created or reused.`);
	console.log(`  ${plan.keys.length} api key(s) will be migrated.`);
	console.log(`  ${plan.skipped.length} row(s) skipped (see reasons below).`);

	if (plan.skipped.length > 0) {
		console.log(`\nSkipped rows:`);
		for (const s of plan.skipped) {
			console.log(`  - email=${s.row.email} reason=${s.reason}`);
		}
	}

	console.log(`\nOrganisation groups:`);
	for (const g of plan.orgs) {
		console.log(
			`  - name="${g.name}" domain=${g.domain} kvk=${g.kvkNumber ?? '-'} ` +
				`keys=${g.memberKeyHashes.length}`
		);
	}

	if (mode === 'dry-run') {
		console.log('\nDry-run complete. No writes were performed.');
		console.log('Re-run with --live to apply the migration.');
		return;
	}

	const client = postgres(DATABASE_URL, { max: 1 });
	const db = drizzle(client);

	try {
		await db.transaction(async (tx) => {
			const orgIdByHash = new Map<string, string>();

			for (const g of plan.orgs) {
				const existing = await tx
					.select({ id: organizations.id })
					.from(organizations)
					.where(eq(organizations.domain, g.domain))
					.limit(1);

				let orgId: string;
				if (existing.length > 0) {
					orgId = existing[0].id;
					console.log(`org: reused "${g.domain}" id=${orgId}`);
				} else {
					const [inserted] = await tx
						.insert(organizations)
						.values({
							name: g.name,
							domain: g.domain,
							email: g.email,
							contactName: g.contactName,
							phone: g.phone ?? null,
							kvkNumber: g.kvkNumber ?? null,
							status: 'pending'
						})
						.returning({ id: organizations.id });
					orgId = inserted.id;
					console.log(`org: created "${g.domain}" id=${orgId}`);
				}

				for (const h of g.memberKeyHashes) {
					orgIdByHash.set(h, orgId);
				}
			}

			let inserted = 0;
			let alreadyPresent = 0;

			for (const k of plan.keys) {
				const existing = await tx
					.select({ id: apiKeys.id })
					.from(apiKeys)
					.where(eq(apiKeys.keyHash, k.keyHash))
					.limit(1);

				if (existing.length > 0) {
					alreadyPresent++;
					continue;
				}

				const orgId = orgIdByHash.get(k.keyHash);
				if (!orgId) {
					throw new Error(
						`internal: key ${k.keyPrefix}... has no mapped org (this is a bug in planMigration)`
					);
				}

				await tx.insert(apiKeys).values({
					keyHash: k.keyHash,
					keyPrefix: k.keyPrefix,
					name: k.name,
					orgId,
					signingAttrs: k.signingAttrs,
					expiresAt: k.expiresAt
				});
				inserted++;
			}

			console.log(`\nInserted ${inserted} new api key row(s).`);
			console.log(`Found ${alreadyPresent} existing key row(s) (idempotent skip).`);
		});
	} finally {
		await client.end();
	}

	console.log('\nMigration complete.');
}

main().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
