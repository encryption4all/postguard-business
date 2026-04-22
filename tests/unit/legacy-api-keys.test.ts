import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
	groupingKey,
	planMigration,
	type LegacyApiKeyRow
} from '$lib/server/migrations/legacy-api-keys';

function row(overrides: Partial<LegacyApiKeyRow> = {}): LegacyApiKeyRow {
	return {
		api_key: 'raw-key-abc',
		email: 'alice@acme.example.nl',
		organisation_name: 'Acme B.V.',
		phone_number: '+31612345678',
		kvk_number: '12345678',
		organisation_name_public: true,
		phone_number_public: false,
		kvk_number_public: true,
		expires_at: new Date('2030-01-01T00:00:00Z'),
		...overrides
	};
}

describe('groupingKey', () => {
	it('prefers kvk_number when present', () => {
		expect(groupingKey(row())).toBe('kvk:12345678');
	});

	it('falls back to organisation_name when kvk is missing', () => {
		expect(groupingKey(row({ kvk_number: null }))).toBe('org:acme b.v.');
	});

	it('falls back to email domain when org info is missing', () => {
		expect(groupingKey(row({ kvk_number: null, organisation_name: null }))).toBe(
			'domain:acme.example.nl'
		);
	});

	it('lowercases and trims the grouping bucket', () => {
		expect(groupingKey(row({ kvk_number: null, organisation_name: '  Foo  ' }))).toBe('org:foo');
	});

	it('treats empty strings as absent', () => {
		expect(groupingKey(row({ kvk_number: '', organisation_name: '' }))).toBe(
			'domain:acme.example.nl'
		);
	});
});

describe('planMigration', () => {
	it('hashes api_key with sha256 matching the seed.ts convention', () => {
		const plan = planMigration([row({ api_key: 'secret' })]);
		expect(plan.keys).toHaveLength(1);
		expect(plan.keys[0].keyHash).toBe(createHash('sha256').update('secret').digest('hex'));
		expect(plan.keys[0].keyPrefix).toBe('secret');
	});

	it('groups rows with the same kvk_number into a single org', () => {
		const plan = planMigration([
			row({ api_key: 'k1', email: 'a@acme.example.nl' }),
			row({ api_key: 'k2', email: 'b@acme.example.nl' })
		]);
		expect(plan.orgs).toHaveLength(1);
		expect(plan.orgs[0].memberKeyHashes).toHaveLength(2);
	});

	it('creates separate orgs for different kvk numbers', () => {
		const plan = planMigration([
			row({ api_key: 'k1', kvk_number: '1' }),
			row({ api_key: 'k2', kvk_number: '2' })
		]);
		expect(plan.orgs).toHaveLength(2);
	});

	it('carries email domain through to organizations.domain when plausible', () => {
		const plan = planMigration([row({ api_key: 'k1', kvk_number: null, organisation_name: null })]);
		expect(plan.orgs[0].domain).toBe('acme.example.nl');
	});

	it('falls back to a *.legacy.postguard.local domain when no email domain is available', () => {
		const plan = planMigration([
			row({
				api_key: 'k1',
				email: 'malformed-email',
				kvk_number: '42',
				organisation_name: null
			})
		]);
		expect(plan.orgs[0].domain).toBe('42.legacy.postguard.local');
	});

	it('disambiguates duplicate synthesised domains for different groups', () => {
		const plan = planMigration([
			row({ api_key: 'k1', kvk_number: '1', email: 'a@shared.example.nl' }),
			row({ api_key: 'k2', kvk_number: '2', email: 'b@shared.example.nl' })
		]);
		const domains = plan.orgs.map((o) => o.domain);
		expect(new Set(domains).size).toBe(domains.length);
		expect(domains.filter((d) => d.startsWith('shared.example.nl'))).toHaveLength(2);
	});

	it('derives signing_attrs honouring the legacy *_public flags', () => {
		const plan = planMigration([
			row({
				api_key: 'k1',
				organisation_name_public: true,
				phone_number_public: true,
				kvk_number_public: false
			})
		]);
		expect(plan.keys[0].signingAttrs).toEqual({
			email: true,
			orgName: true,
			phone: true,
			kvkNumber: false
		});
	});

	it('does not mark absent fields as signed even if the _public flag is true', () => {
		const plan = planMigration([
			row({
				api_key: 'k1',
				phone_number: null,
				phone_number_public: true
			})
		]);
		expect(plan.keys[0].signingAttrs.phone).toBe(false);
	});

	it('skips duplicate api_keys in the source', () => {
		const plan = planMigration([row({ api_key: 'same' }), row({ api_key: 'same' })]);
		expect(plan.keys).toHaveLength(1);
		expect(plan.skipped).toHaveLength(1);
		expect(plan.skipped[0].reason).toBe('duplicate api_key in source');
	});

	it('skips rows with empty api_key or email', () => {
		const plan = planMigration([row({ api_key: '' }), row({ api_key: 'ok', email: '' })]);
		expect(plan.keys).toHaveLength(0);
		expect(plan.skipped.map((s) => s.reason).sort()).toEqual(['empty api_key', 'empty email']);
	});

	it('is deterministic for the same input', () => {
		const rows = [row({ api_key: 'k1', kvk_number: '1' }), row({ api_key: 'k2', kvk_number: '2' })];
		const a = planMigration(rows);
		const b = planMigration(rows);
		expect(a.orgs.map((o) => o.domain)).toEqual(b.orgs.map((o) => o.domain));
		expect(a.keys.map((k) => k.keyHash)).toEqual(b.keys.map((k) => k.keyHash));
	});
});
