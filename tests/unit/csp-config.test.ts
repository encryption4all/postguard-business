import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import config from '../../svelte.config.js';

describe('SvelteKit CSP configuration', () => {
	const csp = config.kit?.csp;

	it('is configured', () => {
		expect(csp).toBeDefined();
	});

	it('uses Report-Only mode for the initial rollout', () => {
		expect(csp?.reportOnly).toBeDefined();
		expect(csp?.directives).toBeUndefined();
	});

	it('uses auto mode so SvelteKit picks nonce vs hash per route', () => {
		expect(csp?.mode).toBe('auto');
	});

	it('locks down framing, base-uri, form-action and object-src', () => {
		const r = csp!.reportOnly!;
		expect(r['frame-ancestors']).toEqual(['none']);
		expect(r['base-uri']).toEqual(['self']);
		expect(r['form-action']).toEqual(['self']);
		expect(r['object-src']).toEqual(['none']);
	});

	it('keeps script-src restricted to same-origin (no unsafe-inline / unsafe-eval)', () => {
		const scriptSrc = csp!.reportOnly!['script-src'] ?? [];
		expect(scriptSrc).toContain('self');
		expect(scriptSrc).not.toContain('unsafe-inline');
		expect(scriptSrc).not.toContain('unsafe-eval');
	});

	it('pins a sha256 hash matching the inline <script> in app.html', () => {
		const appHtml = readFileSync(new URL('../../src/app.html', import.meta.url), 'utf8');
		const inlineScriptBody = appHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1];
		expect(inlineScriptBody, 'src/app.html should contain an inline <script>').toBeDefined();
		const expected = `sha256-${createHash('sha256').update(inlineScriptBody!).digest('base64')}`;
		expect(csp!.reportOnly!['script-src']).toContain(expected);
	});

	it('allows data: images for inline icon SVGs', () => {
		expect(csp!.reportOnly!['img-src']).toContain('data:');
	});

	it('allows the Iconify API in connect-src for @iconify/svelte icon loading', () => {
		expect(csp!.reportOnly!['connect-src']).toContain('https://api.iconify.design');
	});

	it('points violations at the in-app CSP report sink', () => {
		expect(csp!.reportOnly!['report-uri']).toEqual(['/api/csp-report']);
	});
});
