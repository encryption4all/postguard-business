import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const CLAUDE_MD = fileURLToPath(new URL('../../CLAUDE.md', import.meta.url));

// CLAUDE.md is orientation: what this repo is, its position under PostGuard, and
// the repos to weigh before changing it. 4,000 B is the threshold that decides
// whether a container working this repo gets its cwd pointed at the clone
// (encryption4all/dobby-code#482), so raising the cap should be a decision.
const MAX_BYTES = 4_000;

// The 7,242 B agent-notes corpus arrived under these headings (#131). Every one
// of them fits inside 4,000 B, so the size cap alone would let any single
// section back in.
const CUT_SECTIONS = [
	'Agent notes (migrated from the dobby memory repo)',
	'Architecture',
	'Data model',
	'Yivi client integration gotcha (deepmerge default `result`)',
	'Build and test (memory-hungry)',
	'Dependency overrides',
	'Color system conventions',
	'Accessibility conventions',
	'Layout gotcha',
	'Security',
	'Test-runner quirks'
];

// LF-normalised: a CRLF checkout would otherwise spend a byte per line of the
// budget, making the cap mean something different per machine.
function claudeMd(): string {
	return readFileSync(CLAUDE_MD, 'utf8').replace(/\r\n/g, '\n');
}

describe('CLAUDE.md', () => {
	it(`stays under ${MAX_BYTES} B — documentation goes to the docs site, a durable check to the rule bundle, a repo-local convention to AGENTS.md`, () => {
		expect(Buffer.byteLength(claudeMd(), 'utf8')).toBeLessThanOrEqual(MAX_BYTES);
	});

	it('has no heading from the cut corpus, at any heading level', () => {
		// Any level, not just `##`: promoting a section to `###` is the cheapest
		// way back in, and it is the same section either way.
		const headings = claudeMd()
			.split('\n')
			.filter((line) => line.startsWith('#'))
			.map((line) => line.replace(/^#+/, '').trim());

		expect(CUT_SECTIONS.filter((section) => headings.includes(section))).toEqual([]);
	});

	it('names the revision holding the cut corpus — the corpus is not migrated, so this pointer is the only way back to it', () => {
		expect(claudeMd()).toContain('git show fcb7405:CLAUDE.md');
	});

	it('still points at the files carrying the detail — the checks above all pass on an empty file', () => {
		const body = claudeMd();
		const missing = ['AGENTS.md', 'README.md', 'docs.postguard.eu/repos/postguard-business'].filter(
			(pointer) => !body.includes(pointer)
		);
		expect(missing).toEqual([]);
	});
});
