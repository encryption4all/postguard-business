import { describe, it, expect, vi } from 'vitest';

// Stub the module's side-effectful imports so importing the db module doesn't
// try to open a real connection at import time.
vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgres://user:pass@localhost:5432/db' }
}));
vi.mock('postgres', () => ({ default: vi.fn(() => ({})) }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn(() => ({})) }));

import { intFromEnv } from '$lib/server/db';

describe('intFromEnv', () => {
	it('parses a valid positive integer', () => {
		expect(intFromEnv('25', 10)).toBe(25);
	});

	it('falls back when unset', () => {
		expect(intFromEnv(undefined, 10)).toBe(10);
	});

	it('falls back on an empty string', () => {
		expect(intFromEnv('', 10)).toBe(10);
	});

	it('falls back on a non-numeric value', () => {
		expect(intFromEnv('abc', 10)).toBe(10);
	});

	it('falls back on zero and negative values', () => {
		expect(intFromEnv('0', 10)).toBe(10);
		expect(intFromEnv('-5', 10)).toBe(10);
	});

	it('falls back on a non-integer (float)', () => {
		expect(intFromEnv('1.5', 10)).toBe(10);
	});
});
