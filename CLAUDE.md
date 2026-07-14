
---

## Agent notes (migrated from the dobby memory repo)

## Architecture
- SvelteKit (Svelte 5 runes), `adapter-node` (SSR), TypeScript. Default branch `main`.
- SCSS + CSS custom properties in `src/lib/global.scss` define the purple business colorway, with a `.dark` class scope for dark-mode overrides on `<html>`.
- Drizzle ORM + postgres.js + PostgreSQL 18.
- Yivi/IRMA attribute-based auth (`svelte-i18n` for en-US / nl-NL).
- Feature flags via `FF_*` env vars (`FF_BUSINESS`, `FF_PORTAL_MEMBERS`), default false.
- Release: release-please.

## Data model
- `users`: id UUID PK, email UNIQUE, full_name, phone, org_id UUID FK to organizations.id. No role/status columns. Login matches the Yivi-disclosed email.
- `organizations`: id UUID PK, name, domain UNIQUE, signing_email, kvk_number, contact_user_id UUID FK to users.id NULLABLE, status, created_at, updated_at.
- `business_api_keys`: key_hash, key_prefix, signing_attrs JSONB, org_id FK, created_by FK to admin_accounts.id NULLABLE.
- Migration gotcha: organizations created before the users-table migration have no `users` row and a NULL `contact_user_id`. They cannot log in until a user row is inserted for them.

## Yivi client integration gotcha (deepmerge default `result`)
`@privacybydesign/yivi-client`'s `_sanitizeOptions` deep-merges the session config over defaults that include a `result` fetcher. Omitting `result` from your config does NOT disable client-side result fetching, the default is retained. After a disclosure reaches `DONE`, the client's state machine fetches the result URL and throws on any non-200, which rejects `yivi.start()`.

If verification moves server-side (server-side session start plus an HttpOnly requestor token), you MUST set `result: false` in the yivi session config explicitly. Otherwise the client still fetches `/irma/session/undefined/result` (the session-token mapping is gone), the hardened `/irma` allowlist 403s it, and login/register break after a successful scan. Unit tests and svelte-check stay green; this only shows up at runtime.

## Build and test (memory-hungry)
- Requires `.env`; `cp .env.example .env` is enough for `vite build` (no live DB needed).
- `npm run check` (svelte-check) and the adapter-node packaging step of `vite build` OOM at the default Node heap. Use `NODE_OPTIONS="--max-old-space-size=3072"` for both, and for `git commit` too (Husky's pre-commit runs svelte-check).
- `npx vite build` alone completes in ~10s with the env set; only the adapter-node bundling step at the end may get killed.
- Tests via vitest.
- CI: build amd64/arm64, finalize Docker manifest, migration safety, svelte-check, Playwright tests, release-please. There is a conventional-commit PR-title check, plus CodeQL and a dependency-review + secret-scan workflow. Published GHCR images are cosign-signed.

## Dependency overrides
Standing transitive vulnerabilities that can't be cleared by bumping the direct dep (it's already at latest):
- `@sveltejs/kit` pins `cookie ^0.6.0` (vulnerable): override `cookie: ^0.7.2`.
- `svelte-i18n` and `drizzle-kit` pull vulnerable `esbuild` ranges: override `esbuild: ^0.25.0`.

Before opening a "bump deps" PR for this repo, confirm the direct dep is not already at its latest published version. An advisory scanner will flag paths that are only reachable transitively, which a version bump can't fix.

## Color system conventions
- `--pg-primary` is the accent color (text-on-background, underlines, outlines). In dark mode it's `#a78bfa` so accent text pops on `#0f0a1e`, don't darken it.
- `--pg-primary-bg` / `--pg-primary-bg-hover` are the purple-background-with-white-text tokens (`#7c3aed` / `#6d28d9` in both themes, tuned for WCAG AA).
- Rule: any `background: <purple>; color: #fff` pattern must use `var(--pg-primary-bg)`, not `var(--pg-primary)`.
- `--pg-primary-contrast` is the hover/pressed variant.
- Find purple-bg misuse: `grep -rnE "background:\s*var\(--pg-primary\)[;}]" --include="*.svelte" --include="*.scss"`

## Accessibility conventions
- `ThemeSwitcher.svelte` uses radio-buttons-as-toggle with a `.visually-hidden` class. For any icon-only label, add a `.visually-hidden` span with the name and mark the icon `aria-hidden="true"`.
- `@iconify/svelte` renders via `{@html body}` with no child slot, so `<title>` cannot be injected through Icon props. Use visually-hidden text on the wrapping label/button instead.

## Layout gotcha
Marketing pages with `min-height: <N>vh` overflow short viewports because the marketing layout adds Header + Footer outside `<main>` (so `min-height: 80vh` plus header and footer exceeds 100vh on many laptops). The pattern that works: the marketing layout's `<main>` is `display: flex; flex-direction: column;` and full-bleed sections use `flex: 1` instead of `min-height`.

## Security
When touching these areas, watch for these patterns:

- **Layout-load is NOT an action guard (recurring bug class).** SvelteKit form actions run on POST independently of `+layout.server.ts` load functions. A layout redirect for non-admin sessions does NOT prevent a non-admin user from POSTing to admin form actions. Every admin action must check `locals.session?.adminId` (or the equivalent user-type check) directly inside the action handler.
- Resolved, don't re-flag without re-checking the file first: the IRMA proxy uses an allowlist plus `..` rejection and no longer forwards session creation or the requestor token to clients (session creation is server-side, the requestor token is kept in an HttpOnly cookie, and the proxy allowlist permits only frontend polling/delete endpoints); `requestChange` validates `fieldName` against an allowlist; the DNS TXT check uses strict equality; security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `hooks.server.ts`, with CSP currently in Report-Only mode.
- Open / accepted risk: `sql.raw()` in `approveChangeRequest` is safe today via an allowlist but is a fragile pattern, Drizzle's type-safe update is preferable; the session cookie is httpOnly and secure in prod but `sameSite: 'lax'` (acceptable for the Yivi SSO flow); no HSTS header is configured at the app layer (set it at the reverse proxy if needed).
- API keys: `api-keys.ts` generates 24-byte URL-safe random keys and stores a SHA-256 hash, no salt, which is fine for high-entropy random tokens.
- **Open-redirect validation must reject control characters.** `safeRedirect()` validates the post-login `redirect` param. Checking only that the value starts with `/` and the second character isn't `/` or `\` is not enough: browsers strip ASCII C0 control characters (TAB/LF/CR) from URLs before navigating, so a value like a tab followed by `/evil.example` passes the slash checks then normalizes to `//evil.example`, an off-origin redirect. Any redirect/URL allowlist that inspects only leading characters must reject control characters first, before the slash checks. Write the guard as a `charCodeAt() <= 0x1f` scan, not a regex, to keep literal control bytes out of the source.

## Test-runner quirks

Pre-commit hook runs `svelte-check` with `NODE_OPTIONS=--max-old-space-size=3072`; tests run via `vitest`.
