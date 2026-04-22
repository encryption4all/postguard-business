/**
 * Pure planning logic for migrating legacy pg-pkg `api_keys` rows into the
 * postguard-business `organizations` + `business_api_keys` tables.
 *
 * This module has no I/O. It turns a list of legacy rows into:
 *   - a list of organisation groups (each with a deterministic domain) and
 *   - a list of key inserts (each with its group's hash so the caller can
 *     map keys to the correct org id).
 *
 * The caller in `scripts/migrate-legacy-api-keys.ts` is responsible for
 * reading from the legacy DB, writing to the business DB, and wrapping the
 * writes in a transaction.
 */

import { createHash } from 'crypto';

export type LegacyApiKeyRow = {
	api_key: string;
	email: string;
	organisation_name: string | null;
	phone_number: string | null;
	kvk_number: string | null;
	organisation_name_public: boolean;
	phone_number_public: boolean;
	kvk_number_public: boolean;
	expires_at: Date;
};

export type SigningAttrs = {
	email: boolean;
	orgName: boolean;
	phone: boolean;
	kvkNumber: boolean;
};

export type PlannedKey = {
	keyHash: string;
	keyPrefix: string;
	name: string;
	signingAttrs: SigningAttrs;
	expiresAt: Date;
};

export type OrgGroup = {
	name: string;
	domain: string;
	signingEmail: string;
	contactEmail: string;
	contactName: string;
	contactPhone: string | null;
	kvkNumber: string | null;
	memberKeyHashes: string[];
};

export type SkippedRow = {
	row: LegacyApiKeyRow;
	reason: string;
};

export type MigrationPlan = {
	orgs: OrgGroup[];
	keys: PlannedKey[];
	skipped: SkippedRow[];
};

/**
 * Derive a stable organisation grouping key for a legacy row.
 *
 * Priority order (first non-empty wins):
 *   1. `kvk_number` (Dutch Chamber of Commerce number — unambiguous org id)
 *   2. normalised `organisation_name`
 *   3. the email's domain (fallback: one org per email domain)
 *   4. the full email (last-resort: one synthetic org per user)
 *
 * The grouping key is a string prefix that disambiguates the source so
 * different rows that happen to collide on a value (e.g. kvk 1 and a raw
 * orgname "1") do not share a group.
 */
export function groupingKey(row: LegacyApiKeyRow): string {
	if (row.kvk_number && row.kvk_number.trim() !== '') {
		return `kvk:${row.kvk_number.trim()}`;
	}
	if (row.organisation_name && row.organisation_name.trim() !== '') {
		return `org:${row.organisation_name.trim().toLowerCase()}`;
	}
	const at = row.email.indexOf('@');
	if (at > 0 && at < row.email.length - 1) {
		return `domain:${row.email.substring(at + 1).toLowerCase()}`;
	}
	return `email:${row.email.toLowerCase()}`;
}

/**
 * Derive a synthetic domain for an org group.
 *
 * Business `organizations.domain` is `UNIQUE NOT NULL`. Legacy rows often
 * have no associated domain, so we synthesise one that is:
 *   - deterministic (running the migration twice produces the same value),
 *   - collision-free across groups (the grouping key is part of the domain),
 *   - valid-ish (lowercase, alphanumerics + dots + dashes).
 *
 * For groups that have a real email domain we prefer it; otherwise we fall
 * back to `<slug>.legacy.postguard.local`.
 */
export function synthesiseDomain(group: OrgGroup): string {
	if (group.signingEmail) {
		const at = group.signingEmail.indexOf('@');
		if (at > 0 && at < group.signingEmail.length - 1) {
			const dom = group.signingEmail.substring(at + 1).toLowerCase();
			if (isPlausibleDomain(dom)) return dom;
		}
	}

	const slug = slugify(group.kvkNumber ?? group.name ?? group.signingEmail);
	return `${slug}.legacy.postguard.local`;
}

function isPlausibleDomain(d: string): boolean {
	return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}

function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 48) || 'legacy'
	);
}

function sha256Hex(s: string): string {
	return createHash('sha256').update(s).digest('hex');
}

function signingAttrsFromRow(row: LegacyApiKeyRow): SigningAttrs {
	// Email is ALWAYS a signed attribute in the pg-pkg flow (see
	// pg-pkg/src/middleware/auth.rs:212-215 — email is hardcoded as a public
	// attribute). The other three are only signed if the legacy row marked
	// them public in the `*_public` columns.
	return {
		email: true,
		orgName: !!row.organisation_name && row.organisation_name_public,
		phone: !!row.phone_number && row.phone_number_public,
		kvkNumber: !!row.kvk_number && row.kvk_number_public
	};
}

/**
 * Turn a batch of legacy rows into an executable migration plan.
 *
 * The plan is pure: no DB access, no ordering dependencies. The caller is
 * expected to run it inside a single transaction.
 */
export function planMigration(rows: LegacyApiKeyRow[]): MigrationPlan {
	const groups = new Map<string, OrgGroup>();
	const keys: PlannedKey[] = [];
	const skipped: SkippedRow[] = [];
	const seenHashes = new Set<string>();

	for (const row of rows) {
		if (!row.api_key || row.api_key.trim() === '') {
			skipped.push({ row, reason: 'empty api_key' });
			continue;
		}
		if (!row.email || row.email.trim() === '') {
			skipped.push({ row, reason: 'empty email' });
			continue;
		}

		const keyHash = sha256Hex(row.api_key);

		if (seenHashes.has(keyHash)) {
			skipped.push({ row, reason: 'duplicate api_key in source' });
			continue;
		}
		seenHashes.add(keyHash);

		const gk = groupingKey(row);
		let group = groups.get(gk);
		if (!group) {
			group = {
				name:
					row.organisation_name?.trim() || (row.kvk_number ? `KVK ${row.kvk_number}` : row.email),
				domain: '', // filled below
				signingEmail: row.email,
				contactEmail: row.email,
				contactName: row.email,
				contactPhone: row.phone_number,
				kvkNumber: row.kvk_number,
				memberKeyHashes: []
			};
			group.domain = synthesiseDomain(group);
			groups.set(gk, group);
		}

		group.memberKeyHashes.push(keyHash);

		keys.push({
			keyHash,
			keyPrefix: row.api_key.substring(0, 10),
			name: `legacy-${row.api_key.substring(0, 8)}`,
			signingAttrs: signingAttrsFromRow(row),
			expiresAt: row.expires_at
		});
	}

	// Ensure synthesised domains are unique. If two groups both fell back to
	// the same email domain, disambiguate by appending the grouping-key hash.
	const seenDomains = new Map<string, OrgGroup>();
	for (const [gk, g] of groups) {
		if (seenDomains.has(g.domain)) {
			const suffix = sha256Hex(gk).slice(0, 8);
			g.domain = `${g.domain}.${suffix}`;
		}
		seenDomains.set(g.domain, g);
	}

	return {
		orgs: Array.from(groups.values()),
		keys,
		skipped
	};
}
