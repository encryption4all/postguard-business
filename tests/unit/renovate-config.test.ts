import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const RENOVATE_JSON = fileURLToPath(new URL('../../renovate.json', import.meta.url));

function renovateConfig(): Record<string, unknown> {
	return JSON.parse(readFileSync(RENOVATE_JSON, 'utf8'));
}

// Recursively collects every value found under an "automerge" key, anywhere in
// the config tree — Renovate honours it at the top level and inside any
// packageRules entry, and postguard / postguard-js both require one review,
// which a bot cannot give.
function collectAutomergeValues(node: unknown, out: unknown[] = []): unknown[] {
	if (Array.isArray(node)) {
		for (const item of node) collectAutomergeValues(item, out);
	} else if (node && typeof node === 'object') {
		for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
			if (key === 'automerge') out.push(value);
			else collectAutomergeValues(value, out);
		}
	}
	return out;
}

// Recursively finds packageRule-shaped objects that pair enabled: true with an
// @e4a/ package matcher — the preset's first-party rule disables those
// fleet-wide because they are wire-compatibility readers or fixtures that
// must age, and a Renovate bump there would silently undo that compat gate.
function findReenabledFirstPartyRules(node: unknown, out: unknown[] = []): unknown[] {
	if (Array.isArray(node)) {
		for (const item of node) findReenabledFirstPartyRules(item, out);
	} else if (node && typeof node === 'object') {
		const obj = node as Record<string, unknown>;
		if (obj.enabled === true) {
			const matchers = ([] as unknown[]).concat(
				obj.matchPackageNames as unknown[],
				obj.matchPackagePatterns as unknown[]
			);
			if (matchers.some((matcher) => typeof matcher === 'string' && matcher.includes('@e4a/'))) {
				out.push(obj);
			}
		}
		for (const value of Object.values(obj)) findReenabledFirstPartyRules(value, out);
	}
	return out;
}

describe('renovate.json', () => {
	it('extends the fleet preset', () => {
		expect(renovateConfig().extends).toContain('github>encryption4all/renovate-config');
	});

	it('uses bump range strategy — this is an app, not a published package', () => {
		expect(renovateConfig().rangeStrategy).toBe('bump');
	});

	it('never sets automerge: true — postguard and postguard-js require one review, which a bot cannot give', () => {
		expect(collectAutomergeValues(renovateConfig())).not.toContain(true);
	});

	it('does not re-enable an @e4a/ first-party package — the preset already disables those fleet-wide', () => {
		expect(findReenabledFirstPartyRules(renovateConfig())).toEqual([]);
	});
});
