import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import generated from '../../src/lib/icons.generated.json';

// getIcons() only emits an `aliases` key when an alias is bundled, so type it
// as optional rather than relying on the inferred shape of today's JSON.
const bundled = generated as {
	prefix: string;
	icons: Record<string, unknown>;
	aliases?: Record<string, unknown>;
};

// Icons render offline from the bundled collection ($lib/icons); the Iconify
// API is not in the CSP connect-src, so an unbundled icon silently renders
// blank in production. This test fails when an icon is used in src/ without
// regenerating the bundle (npm run generate:icons).

// Statically-quoted names only — a `mdi:${x}` template literal evades both
// this test and the generator scan (see scripts/generate-icons.ts); always
// write icon names as full string literals.
const ICON_RE = /['"]mdi:([a-z0-9-]+)['"]/g;
const SCAN_EXTENSIONS = ['.svelte', '.ts', '.js'];

function collectIconNames(dir: string, names: Set<string>): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			collectIconNames(path, names);
		} else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
			for (const match of readFileSync(path, 'utf8').matchAll(ICON_RE)) {
				names.add(match[1]);
			}
		}
	}
}

describe('bundled icon collection', () => {
	const srcDir = new URL('../../src', import.meta.url).pathname;
	const used = new Set<string>();
	collectIconNames(srcDir, used);

	it('finds icon usages in src/ (sanity check on the scan)', () => {
		expect(used.size).toBeGreaterThan(0);
	});

	it('has the mdi prefix expected by <Icon icon="mdi:...">', () => {
		expect(bundled.prefix).toBe('mdi');
	});

	it('contains every mdi: icon referenced in src/ — run `npm run generate:icons` if not', () => {
		const available = new Set([
			...Object.keys(bundled.icons ?? {}),
			...Object.keys(bundled.aliases ?? {})
		]);
		const missing = [...used].filter((name) => !available.has(name)).sort();
		expect(missing).toEqual([]);
	});
});
