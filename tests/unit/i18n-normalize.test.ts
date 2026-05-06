import { describe, it, expect } from 'vitest';
import { normalizeLocale, defaultLanguage } from '../../src/lib/i18n';

describe('normalizeLocale', () => {
	it('returns the default for null / undefined / empty input', () => {
		expect(normalizeLocale(null)).toBe(defaultLanguage);
		expect(normalizeLocale(undefined)).toBe(defaultLanguage);
		expect(normalizeLocale('')).toBe(defaultLanguage);
		expect(normalizeLocale('   ')).toBe(defaultLanguage);
	});

	it('maps Dutch tags to nl-NL', () => {
		expect(normalizeLocale('nl')).toBe('nl-NL');
		expect(normalizeLocale('nl-NL')).toBe('nl-NL');
		expect(normalizeLocale('nl-BE')).toBe('nl-NL');
		expect(normalizeLocale('NL')).toBe('nl-NL');
	});

	it('maps English tags to en-US', () => {
		expect(normalizeLocale('en')).toBe('en-US');
		expect(normalizeLocale('en-US')).toBe('en-US');
		expect(normalizeLocale('en-GB')).toBe('en-US');
		expect(normalizeLocale('EN-us')).toBe('en-US');
	});

	it('falls back for unsupported languages', () => {
		expect(normalizeLocale('de-DE')).toBe(defaultLanguage);
		expect(normalizeLocale('fr')).toBe(defaultLanguage);
		expect(normalizeLocale('zh-CN')).toBe(defaultLanguage);
		expect(normalizeLocale('xx')).toBe(defaultLanguage);
	});

	it('uses only the highest-priority tag from a multi-value Accept-Language', () => {
		expect(normalizeLocale('nl-NL,en-US;q=0.8,de;q=0.5')).toBe('nl-NL');
		expect(normalizeLocale('en-GB,nl;q=0.9')).toBe('en-US');
		expect(normalizeLocale('de-DE,nl;q=0.9')).toBe(defaultLanguage);
	});

	it('trims whitespace around the primary tag', () => {
		expect(normalizeLocale('  nl-NL  ')).toBe('nl-NL');
		expect(normalizeLocale(' en ,de')).toBe('en-US');
	});

	it('does not throw on garbage input', () => {
		expect(normalizeLocale(',,,')).toBe(defaultLanguage);
		expect(normalizeLocale(';;;')).toBe(defaultLanguage);
	});
});
