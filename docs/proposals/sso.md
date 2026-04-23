# Proposal: Single Sign-On (SSO) for organizations

Status: **draft, request for comments** (refreshed 2026-04-23 — reflects #15 landing)
Tracking issue: [encryption4all/postguard#143](https://github.com/encryption4all/postguard/issues/143)
Related: [postguard#74](https://github.com/encryption4all/postguard/issues/74) (org user management), [postguard#146](https://github.com/encryption4all/postguard/issues/146) (AD / SCIM sync), [postguard-business#15](https://github.com/encryption4all/postguard-business/pull/15) (users table — landed)

This document proposes the shape of SSO support in postguard-business before
any schema or code lands. The goal is to agree on the model and phasing so
that the implementation PRs can be small, focused, and individually
reviewable.

## Motivation

Today `postguard-business` authenticates every portal action via Yivi/IRMA.
For an organization with, say, 50 employees, that means 50 separate Yivi
enrolments and a Yivi disclosure each time any of them wants to hit the
portal. Enterprise customers (Zivver's Ultimate tier is the reference
competitor) expect to bring their own identity provider — Azure AD, Google
Workspace, Okta, Keycloak — and have their users land in the portal
authenticated, without re-proving identity attributes on every action.

## Non-goals (phase 1)

- **Yivi removal.** Yivi stays as the default auth and as the signing/key
  path. SSO is _added_ as an alternative org-user entry point, not a
  replacement.
- **SAML.** OIDC first. SAML is strictly more code (SP metadata, signed
  assertions, XML canonicalisation) and most target IdPs support OIDC. SAML
  is phase 2.
- **Extensions (Outlook / Thunderbird / browser add-on).** Desktop SSO
  needs embedded-browser OIDC with PKCE and is a separate, much larger
  task. Only the portal is in scope for phase 1.
- **SCIM / AD sync.** Separately tracked in #146. Out of scope here.
- **Custom-branded login pages per org.** A plain `/auth/sso/[orgSlug]`
  bounce is enough for v1.

## Prerequisite: multi-user organizations — **landed in #15**

The original version of this proposal called this out as a blocker. It is
now done: PR [#15](https://github.com/encryption4all/postguard-business/pull/15)
landed a `users` table and the session plumbing needed to log in as a
specific person, not just "as the organization". SSO plugs into that same
table rather than introducing a second `org_users` table.

As-landed shape (`src/lib/server/db/schema.ts`):

```
users (
  id uuid pk,
  email varchar(256) not null unique,          -- globally unique (not per-org)
  full_name varchar(256) not null,
  phone varchar(32),
  org_id uuid not null references organizations on delete cascade,
  created_at timestamptz not null default now(),
  index idx_users_org (org_id)
)
```

Sessions already carry `user_type` (`'org'` | `'admin'` | `'user'`) and
`user_id` referencing `users.id`. The SSO callback creates a session row
with `user_type='user'` the same way Yivi login does.

### Additive columns this proposal adds to `users`

SSO needs three columns that #15 did not land. They are additive, nullable,
and default to Yivi behaviour so existing rows keep working:

```
-- migration 0002_add-sso-fields.sql
alter table users
  add column auth_source varchar(32) not null default 'yivi',
    -- 'yivi' | 'sso'
  add column sso_subject varchar(256),
    -- IdP 'sub' claim — only set for auth_source='sso' users
  add column last_login_at timestamptz;

create unique index users_sso_subject_unique
  on users (org_id, sso_subject)
  where sso_subject is not null;
```

`role` / `status` are intentionally NOT part of this migration — #15 did
not land them, and SSO does not need them (role gating is a follow-up for
the admin/members work). Adding them here would widen scope.

**Email uniqueness note.** The landed `users.email` is globally unique,
not per-org. That is fine for SSO: a single person works at one
organization in PostGuard. If that ever changes, both the landed schema
and this proposal have to evolve together.

## Data model for SSO

One new table, owned by this proposal:

```
org_identity_providers (
  id uuid pk,
  org_id uuid references organizations,
  provider varchar(16) not null,                -- 'oidc' (phase 1) | 'saml' (phase 2)
  display_name varchar(128) not null,           -- shown on portal login page
  enabled boolean not null default false,

  -- OIDC fields
  issuer varchar(512),                          -- discovery URL, e.g. https://login.microsoftonline.com/{tenant}/v2.0
  client_id varchar(256),
  client_secret_encrypted bytea,                -- envelope-encrypted, key id in client_secret_key_id
  client_secret_key_id varchar(64),
  scopes varchar(256) not null default 'openid email profile',

  -- Attribute mapping: which claim becomes which org_user field.
  -- Defaults: email=email, full_name=name, sso_subject=sub
  claim_mapping jsonb not null default '{}',

  -- Policy
  jit_provisioning boolean not null default false,   -- auto-create org_users on first login if email domain matches org.domain
  require_yivi_for_signing boolean not null default true, -- SSO session alone suffices for portal; Yivi still required to sign/decrypt

  created_at timestamptz,
  updated_at timestamptz,
  unique (org_id)   -- one IdP per org in phase 1
)
```

Encryption of `client_secret_encrypted` uses an env-provided symmetric key
(`SSO_SECRET_KEY`, 32 bytes base64) so leaked DB dumps cannot be used to
silently replay against an IdP. Key rotation is a follow-up.

## Auth flow (OIDC)

```
User → /auth/sso/[orgSlug]
       (SvelteKit route)
       |
       | 1. Look up org by slug, load org_identity_providers row, ensure
       |    enabled, generate state + PKCE verifier, stash in signed cookie
       | 2. Redirect to provider.authorizationEndpoint?client_id=…&state=…
       v
       IdP login page → IdP → redirect back
       |
       v
User → /api/auth/sso/callback?code=…&state=…
       |
       | 1. Validate state + PKCE
       | 2. Exchange code at token endpoint
       | 3. Verify ID token signature against JWKS, iss/aud/exp checks
       | 4. Apply claim_mapping to extract email + sub + full_name
       | 5. Find users by (org_id, sso_subject); if miss, find by
       |    (org_id, email); if miss and jit_provisioning, insert with
       |    auth_source='sso'; else 403
       | 6. createSession(userType='user', userId, orgId, attrs={sso:true}),
       |    update users.last_login_at
       | 7. Set pg_session cookie (existing helper)
       | 8. Redirect to ?redirect= or /portal/dashboard
```

We lean on [`openid-client`](https://github.com/panva/openid-client) (actively
maintained, certified against the OIDC conformance suite). No hand-rolled
JWT verification.

## Portal login UX

- `/auth/login` gets a small additional block: "Sign in with your
  organization" with a text input for the org slug/domain, which POSTs to
  `/auth/sso/[orgSlug]`. Yivi stays as the primary option.
- For orgs with SSO enabled, the portal sidebar shows the signed-in user's
  name + org; the `change organization` / impersonation UI is unchanged
  (admin path only).

## Admin UX

- New page `(admin)/admin/organizations/[id]/sso` — show/edit
  `org_identity_providers` row. Admin only.
- Shows the org's **redirect URI** (copy-paste into the IdP).
- "Test configuration" button (admin-only) that initiates an SSO round-trip
  against the saved config and reports success / which step failed.
- All edits produce entries in `admin_audit_log`.

## Signing and decryption (the ambiguous bit)

The issue says:

> SSO users should still be able to encrypt/decrypt without per-message
> Yivi authentication where the organization allows it.

PostGuard's encryption is IRMA/Yivi-based at the core: a recipient proves
attributes to obtain a decryption key. That cryptographic primitive cannot
be bypassed by SSO — the KG still wants Yivi proofs. What an org CAN
opt into is: **the portal accepts an SSO session in place of a fresh Yivi
disclosure for portal actions** (API key management, audit log, etc.).
Per-message encryption/decryption still goes through the standard
Yivi/IRMA flow triggered from the client.

`org_identity_providers.require_yivi_for_signing` defaults to true and
captures this. An org may flip it to `false` only after we have a story
for delegating signing attributes to an SSO-authenticated user (likely via
a short-lived server-signed token the postguard-business backend issues
after verifying SSO identity + org policy — out of scope here, but the
flag lets us ship without painting ourselves into a corner).

Flag this for explicit review in the RFC discussion.

## Feature flag

`FF_SSO=true` enables all SSO routes. Off by default. Matches existing
`FF_*` pattern. When off:

- `/auth/sso/*` returns 404
- Admin SSO page is hidden
- No migration needed to "disable" — the table just stays empty

## Security considerations

- State + PKCE mandatory (prevents code injection / CSRF on callback).
- `openid-client` does signature + iss/aud/exp/nbf verification.
- Client secret encrypted at rest with a symmetric key outside the DB.
- Redirect URI allowlisted per env (no open redirects).
- Session cookie unchanged (httpOnly, secure, sameSite lax — same as today).
- `admin_audit_log` entry on every IdP config change (create / enable /
  disable / rotate secret).
- Login failures (bad state, bad claim, JIT-denied) logged without PII,
  rate-limited per IP.

## Rollout plan (PR-sized chunks)

Each chunk is one PR. Humans can stop the train at any step.

1. **This PR** — proposal only. No code. Merge or reject the plan.
2. ~~`feat(db): users table and session scaffolding`~~ — **landed in #15.**
   The `users` table, `sessions.user_id`, `user_type='user'` and the
   members portal page all shipped. SSO only needs the additive migration
   in the next chunk.
3. `feat(db): add SSO fields + org_identity_providers` — migration-only
   PR. Adds `auth_source`/`sso_subject`/`last_login_at` to `users`, a
   partial unique index on `(org_id, sso_subject)`, and the
   `org_identity_providers` table. No routes.
4. `feat(auth): OIDC SSO callback` — `openid-client` dep, `/auth/sso/[slug]`,
   `/api/auth/sso/callback`, session creation path. `FF_SSO` gates
   everything. No admin UI yet; IdP config inserted via seed / db:studio
   for testing.
5. `feat(portal): SSO login entry on /auth/login` — the small "sign in
   with your organization" block.
6. `feat(admin): SSO configuration page` — `(admin)/admin/organizations/[id]/sso`,
   CRUD, test button, audit log.
7. `feat(sso): SAML phase 2` — only if SAML is still wanted. Separate
   proposal amendment.

## Open questions (please answer in the PR thread)

1. **OIDC-only for launch acceptable, or must SAML ship at the same time?**
   (Big scope difference.)
2. **JIT provisioning default — on or off?** If on, any user with an email
   matching the org's `domain` gets an `org_users` row on first login.
   Convenient but widens who can log in.
3. **`require_yivi_for_signing` — is the "SSO session is enough for
   _portal_ actions only, Yivi still required for encrypt/decrypt" default
   correct?** This is my read of the issue; please confirm.
4. **Slug vs. domain for `/auth/sso/[x]`.** Using `organizations.domain`
   (e.g. `acme.com`) means the SSO URL is predictable for end users but
   couples the SSO URL to the domain-verification feature. A short slug
   like `acme` is cleaner but needs a migration.
5. **Scope of phase 1 for extensions:** confirm Outlook / Thunderbird
   add-ons are explicitly out-of-scope for this issue, and file a separate
   issue for desktop SSO.

If this plan looks right, chunks 3–6 are roughly one week of work total
and can be reviewed independently (chunk 2 already landed as #15).
