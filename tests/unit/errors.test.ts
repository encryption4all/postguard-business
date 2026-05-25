import { describe, it, expect } from 'vitest';
import { isUniqueViolation } from '$lib/server/services/errors';

describe('isUniqueViolation', () => {
	it('matches postgres "duplicate key value violates unique constraint" wording on message', () => {
		const err = new Error('duplicate key value violates unique constraint "users_email_key"');
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('matches the bare "unique constraint" wording on message', () => {
		const err = new Error('unique constraint violation on column email');
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('matches "duplicate key" wording wrapped in a cause', () => {
		const err = new Error('insert failed') as Error & { cause: Error };
		err.cause = new Error(
			'duplicate key value violates unique constraint "organizations_domain_key"'
		);
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('matches "unique" wording wrapped in a cause', () => {
		const err = new Error('insert failed') as Error & { cause: Error };
		err.cause = new Error('Unique constraint failed');
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('is case-insensitive', () => {
		const err = new Error('DUPLICATE KEY value violates UNIQUE constraint');
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('reads message off a plain object with a message field', () => {
		const err = { message: 'duplicate key value violates unique constraint' };
		expect(isUniqueViolation(err)).toBe(true);
	});

	it('returns false for unrelated errors', () => {
		expect(isUniqueViolation(new Error('connection refused'))).toBe(false);
	});

	it('returns false for non-error values', () => {
		expect(isUniqueViolation(null)).toBe(false);
		expect(isUniqueViolation(undefined)).toBe(false);
		expect(isUniqueViolation(42)).toBe(false);
		expect(isUniqueViolation({})).toBe(false);
	});
});
