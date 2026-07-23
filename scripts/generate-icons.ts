/**
 * Regenerate src/lib/icons.generated.json from the icon names used in src/.
 *
 * The app renders icons with @iconify/svelte, which by default fetches icon
 * data from api.iconify.design at runtime. That endpoint is deliberately NOT
 * in the CSP connect-src: every icon must be bundled at build time instead.
 * This script scans the source tree for "mdi:*" icon names and extracts
 * exactly those icons from @iconify-json/mdi into a pruned collection that
 * $lib/icons registers on startup.
 *
 * Run after adding/removing icons:  npm run generate:icons
 * (tests/unit/icons-bundled.test.ts fails if the file is stale.)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getIcons } from '@iconify/utils';
import { icons as mdiCollection } from '@iconify-json/mdi';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const outFile = join(srcDir, 'lib', 'icons.generated.json');

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

const names = new Set<string>();
collectIconNames(srcDir, names);
const sorted = [...names].sort();

if (sorted.length === 0) {
	throw new Error('No mdi: icon names found in src/ — scan regex or layout changed?');
}

const collection = getIcons(mdiCollection, sorted);
const missing = sorted.filter(
	(name) => !(name in (collection?.icons ?? {})) && !(name in (collection?.aliases ?? {}))
);
if (!collection || missing.length > 0) {
	throw new Error(`Icons not found in @iconify-json/mdi: ${missing.join(', ')}`);
}

writeFileSync(outFile, JSON.stringify(collection, null, '\t') + '\n');
console.log(`Wrote ${sorted.length} icons to ${outFile}`);
