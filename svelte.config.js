import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// SvelteKit's auto-CSP only nonces/hashes scripts it injects; the inline
// <script> in src/app.html (dark-mode flash prevention) is not covered. We
// derive its sha256 here so script-src stays in sync with the file content.
const appHtml = readFileSync(new URL('./src/app.html', import.meta.url), 'utf8');
const inlineScriptBody = appHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!inlineScriptBody) {
	throw new Error(
		'svelte.config.js: could not locate inline <script> in src/app.html for CSP hashing'
	);
}
/** @type {`sha256-${string}`} */
const inlineScriptHash = `sha256-${createHash('sha256').update(inlineScriptBody).digest('base64')}`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({ out: 'build' }),
		csp: {
			mode: 'auto',
			// Enforced CSP (previously report-only while issue #60 collected violations).
			// `report-uri` is retained so browsers still POST blocked-violation reports
			// to /api/csp-report even though the policy is now enforced.
			directives: {
				'default-src': ['self'],
				'script-src': ['self', inlineScriptHash],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				// Icons are bundled ($lib/icons), so no Iconify API here. The Yivi
				// server origin is runtime config and is appended in hooks.server.ts.
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'object-src': ['none'],
				'report-uri': ['/api/csp-report']
			}
		},
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$types: 'src/lib/types',
			$server: 'src/lib/server'
		},
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
