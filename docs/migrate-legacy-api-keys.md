# Legacy pkg api_keys → postguard-business migration

Implements the migration half of encryption4all/postguard#141. The
`pg-pkg` side (validator changes) is tracked separately in
encryption4all/postguard#140.

## Schemas

### Source (legacy `pg-pkg`, Postgres)

`api_keys` — see `pg-pkg/migrations/20260316000000_create_api_keys.up.sql`

| column                   | type         | notes                     |
| ------------------------ | ------------ | ------------------------- |
| id                       | uuid         | pk                        |
| api_key                  | varchar(128) | **plaintext**, unique     |
| email                    | varchar(256) | not null                  |
| organisation_name        | varchar(256) | nullable                  |
| phone_number             | varchar(32)  | nullable                  |
| kvk_number               | varchar(32)  | nullable                  |
| organisation_name_public | bool         | is this attribute signed? |
| phone_number_public      | bool         | is this attribute signed? |
| kvk_number_public        | bool         | is this attribute signed? |
| expires_at               | timestamp    | not null                  |

### Target (`postguard-business`, Postgres)

`organizations` + `business_api_keys` — see
`src/lib/server/db/schema.ts`. The relevant columns:

```
organizations(id, name, domain UNIQUE, email, contact_name, phone,
              kvk_number, status)
business_api_keys(id, key_hash UNIQUE, key_prefix, name, org_id FK,
                  signing_attrs JSONB, expires_at, revoked_at, created_by)
```

Key hashes are SHA-256 of the raw key (see `scripts/seed.ts:85`).

## Mapping

| legacy column                              | new location                                   |
| ------------------------------------------ | ---------------------------------------------- |
| `api_key` (plaintext)                      | `business_api_keys.key_hash` = sha256(api_key) |
| `api_key[0..10]`                           | `business_api_keys.key_prefix`                 |
| `email`, `organisation_name`, `kvk_number` | `organizations.*` (grouped — see below)        |
| `organisation_name_public` etc.            | `business_api_keys.signing_attrs` booleans     |
| `expires_at`                               | `business_api_keys.expires_at`                 |
| `phone_number`                             | `organizations.phone`                          |

### Grouping legacy rows into organisations

The legacy schema is per-key; the new schema is per-organisation with a
`UNIQUE` domain. Multiple legacy rows can belong to the same real-world
org, so the script groups rows using the first available of:

1. `kvk_number` (Dutch Chamber of Commerce number — unambiguous)
2. case-insensitive `organisation_name`
3. email domain
4. full email (last-resort: one synthetic org per user)

`organizations.domain` is derived deterministically:

- if the grouped rows share a plausible email domain, use it verbatim;
- otherwise synthesise `<slug>.legacy.postguard.local` where `<slug>` is
  a kebab-case slug of the kvk number / org name / email.

If two groups happen to collide on a synthesised domain, an 8-hex-char
disambiguating suffix is appended (derived from the grouping key's hash,
so the result is still deterministic across runs).

Migrated orgs are created with `status = 'active'` — these are existing
users and do not need to re-verify.

### Signing attributes

`email` is always signed (it is hardcoded as a public attribute in
`pg-pkg/src/middleware/auth.rs:212-215`). Each of `orgName`, `phone`,
`kvkNumber` is signed iff **both**:

- the legacy row had the corresponding `*_public` flag set to `true`, and
- the corresponding source column was non-null.

## Operator runbook

```bash
# 1. Point the script at BOTH databases.
export DATABASE_URL='postgres://...business-db'
export LEGACY_DATABASE_URL='postgres://...pkg-db'

# 2. Dry run. Reads both DBs, writes nothing.
tsx scripts/migrate-legacy-api-keys.ts --dry-run

# 3. Review the printed plan. Pay attention to:
#    - number of orgs created vs reused,
#    - any rows in the "Skipped" section,
#    - any synthetic .legacy.postguard.local domains (these flag groups
#      that the migration could not tie to a real domain).

# 4. When the plan looks sane, apply it.
tsx scripts/migrate-legacy-api-keys.ts --live
```

The live run is wrapped in a single transaction — if any insert fails
the whole migration rolls back.

Running `--live` twice is safe: the script looks up each `key_hash`
before inserting and will skip keys already present, and `organizations`
are upserted by `domain`.

## Open product questions

All resolved — confirmed by @rubenhensen.

1. **Re-keying.** **Resolved:** preserve existing keys. All legacy keys
   have the `PG-API-` prefix, which passes the new `PG-` prefix check
   in postguard#142. No re-keying needed.

2. **Grouping heuristic.** **Resolved:** the `kvk → orgname →
   email-domain → email` fallback chain is fine.

3. **Synthetic org status.** **Resolved:** migrated orgs are set to
   `active` — these are existing users and should be grandfathered in.

4. **`created_by`.** **Resolved:** left NULL is fine for now.

## What this PR does NOT do

- It does **not** touch the `pg-pkg` validator (`postguard#140`).
- It does **not** drop the legacy `api_keys` table. That is a separate
  cleanup PR that should only run after `#140` is merged AND the
  transition window has elapsed.
- It does **not** generate or mail new keys.
