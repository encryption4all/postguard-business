import { describe, it, expect } from 'vitest';
import { appendConnectSrc } from '../../src/lib/server/csp.ts';

const YIVI = 'https://is.staging.yivi.app';

describe('appendConnectSrc', () => {
	it('appends the source to an existing connect-src directive', () => {
		expect(
			appendConnectSrc("default-src 'self'; connect-src 'self'; object-src 'none'", YIVI)
		).toBe(`default-src 'self'; connect-src 'self' ${YIVI}; object-src 'none'`);
	});

	it('leaves other directives untouched', () => {
		const header =
			"default-src 'self'; script-src 'self' 'nonce-abc+/123='; connect-src 'self'; report-uri /api/csp-report";
		expect(appendConnectSrc(header, YIVI)).toBe(
			`default-src 'self'; script-src 'self' 'nonce-abc+/123='; connect-src 'self' ${YIVI}; report-uri /api/csp-report`
		);
	});

	it('does not duplicate an already-present source', () => {
		const header = `connect-src 'self' ${YIVI}`;
		expect(appendConnectSrc(header, YIVI)).toBe(header);
	});

	it('adds a connect-src directive when none exists, preserving the default-src fallback', () => {
		expect(appendConnectSrc("default-src 'self'", YIVI)).toBe(
			`default-src 'self'; connect-src 'self' ${YIVI}`
		);
	});
});
