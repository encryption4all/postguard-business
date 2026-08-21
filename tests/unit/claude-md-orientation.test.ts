import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// CLAUDE.md is orientation: what this repo is, the position it takes under
// PostGuard, and the repos to weigh before changing it. Until this test it was
// 7,242 B of agent notes migrated out of the dobby memory repo (#131) — a stack
// summary, a column-by-column data model, build gotchas, colour tokens, a
// resolved-findings list — none of which said what the repo is for, and much of
// which had drifted from the code by the time it was cut
// (encryption4all/dobby-code#692).
//
// The two homes for what came out: documentation goes to
// docs.postguard.eu/repos/postguard-business, a durable check goes in the rule
// bundle a container reads, and a convention that is only true here goes in
// AGENTS.md next to the rest of them.

const CLAUDE_MD = fileURLToPath(new URL('../../CLAUDE.md', import.meta.url));

// 4,000 B is not cosmetic: it is the threshold that decides whether a container
// working this repo gets its cwd pointed at the clone (dobby-code#482). Above it
// the checkout becomes a sibling directory. Raising the cap should be a decision,
// not a reflex.
const MAX_BYTES = 4_000;

// The corpus arrived under these headings, so the regression is named rather than
// left to the byte count: every one of them fits inside 4,000 B, so the size cap
// on its own would let any single section back in. `Security` is on the list too
// — this repo's security conventions belong in AGENTS.md and SECURITY.md, which is
// where they went.
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

function claudeMd(): string {
	// LF-normalised: a CRLF checkout would otherwise spend a byte per line of the
	// budget, so the cap would mean something different depending on the machine.
	return readFileSync(CLAUDE_MD, 'utf8').replace(/\r\n/g, '\n');
}

describe('CLAUDE.md', () => {
	it('stays orientation-sized', () => {
		const bytes = Buffer.byteLength(claudeMd(), 'utf8');
		expect(
			bytes,
			`CLAUDE.md is ${bytes} B, over the ${MAX_BYTES} B cap. This file is ORIENTATION: what this ` +
				`repo is, its position under PostGuard, and the repos to weigh before changing it. ` +
				`Documentation belongs at docs.postguard.eu/repos/postguard-business, a durable check in the ` +
				`rule bundle, a convention that is only true here in AGENTS.md.`
		).toBeLessThanOrEqual(MAX_BYTES);
	});

	it('has no heading from the cut corpus', () => {
		// Any heading level, not just `##`: promoting a section to `###` is the
		// cheapest way back in, and it is the same section either way.
		const headings = claudeMd()
			.split('\n')
			.filter((line) => line.startsWith('#'))
			.map((line) => line.replace(/^#+/, '').trim());

		for (const section of CUT_SECTIONS) {
			expect(
				headings,
				`CLAUDE.md has a "${section}" heading again. That section went with the agent-notes corpus ` +
					`(dobby-code#692): it is documentation, a binding rule, an AGENTS.md convention, or history ` +
					`at fcb7405 now, not this file.`
			).not.toContain(section);
		}
	});

	it('names the revision holding the cut corpus', () => {
		// The pointer is the whole preservation mechanism. The corpus is not
		// migrated and not reconstructed, so a reader who needs it has only the
		// revision this file names — and dropping the line would satisfy both
		// checks above.
		expect(
			claudeMd(),
			'CLAUDE.md no longer says where the cut corpus went. It lives only in git history at fcb7405; ' +
				'without that line a reader cannot recover it.'
		).toContain('git show fcb7405:CLAUDE.md');
	});

	it('still points at the files that carry the detail', () => {
		// Cutting a file is not the same as gutting it: the checks above are all
		// satisfied by an empty CLAUDE.md, which would strand every convention
		// that moved to AGENTS.md. Proving an instruction is absent does not prove
		// its replacement is present.
		const body = claudeMd();
		for (const pointer of [
			'AGENTS.md',
			'README.md',
			'docs.postguard.eu/repos/postguard-business'
		]) {
			expect(
				body,
				`CLAUDE.md no longer points at ${pointer}. Orientation has to say where the detail went, ` +
					`or the cut reads as the detail never existing.`
			).toContain(pointer);
		}
	});
});
