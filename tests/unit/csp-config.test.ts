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

	it('allows data: images for inline icon SVGs', () => {
		expect(csp!.reportOnly!['img-src']).toContain('data:');
	});
});
