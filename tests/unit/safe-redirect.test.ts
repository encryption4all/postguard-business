import { describe, it, expect } from 'vitest';
import { safeRedirect, DEFAULT_REDIRECT } from '../../src/routes/auth/login/safe-redirect';

describe('safeRedirect', () => {
	it('accepts same-origin absolute paths', () => {
		expect(safeRedirect('/portal/dashboard')).toBe('/portal/dashboard');
		expect(safeRedirect('/portal/settings')).toBe('/portal/settings');
		expect(safeRedirect('/')).toBe('/');
		expect(safeRedirect('/a?b=c#d')).toBe('/a?b=c#d');
	});

	it('falls back for missing values', () => {
		expect(safeRedirect(null)).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect(undefined)).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('')).toBe(DEFAULT_REDIRECT);
	});

	it('rejects values that do not start with a slash', () => {
		expect(safeRedirect('portal/dashboard')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('https://evil.example')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('http://evil.example/path')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect(' /portal/dashboard')).toBe(DEFAULT_REDIRECT);
	});

	it('rejects protocol-relative URLs', () => {
		expect(safeRedirect('//evil.example')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('//evil.example/path')).toBe(DEFAULT_REDIRECT);
	});

	it('rejects the backslash variant browsers normalise to protocol-relative', () => {
		expect(safeRedirect('/\\evil.example')).toBe(DEFAULT_REDIRECT);
		expect(safeRedirect('/\\/evil.example')).toBe(DEFAULT_REDIRECT);
	});
});
