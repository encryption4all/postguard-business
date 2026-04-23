import { describe, it, expect } from 'vitest';
import { isAllowed } from '../../src/routes/irma/[...path]/allowlist';

describe('irma proxy path allowlist', () => {
	it('allows the session prefix', () => {
		expect(isAllowed('session')).toBe(true);
	});

	it('allows session subpaths', () => {
		expect(isAllowed('session/abc123')).toBe(true);
		expect(isAllowed('session/abc123/status')).toBe(true);
	});

	it('rejects unknown top-level prefixes', () => {
		expect(isAllowed('admin')).toBe(false);
		expect(isAllowed('scheme')).toBe(false);
		expect(isAllowed('configuration')).toBe(false);
		expect(isAllowed('keyshare')).toBe(false);
	});

	it('rejects path traversal attempts', () => {
		expect(isAllowed('session/../admin')).toBe(false);
		expect(isAllowed('../admin')).toBe(false);
		expect(isAllowed('session/..')).toBe(false);
	});

	it('rejects empty and undefined paths', () => {
		expect(isAllowed('')).toBe(false);
		expect(isAllowed(undefined)).toBe(false);
	});

	it('does not allow prefix-spoofing like sessionadmin', () => {
		expect(isAllowed('sessionadmin')).toBe(false);
		expect(isAllowed('sessionfoo/bar')).toBe(false);
	});
});
