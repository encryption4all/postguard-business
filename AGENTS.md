# AGENTS.md

Working notes for humans and coding agents. Read this before making changes.
For setup, local URLs, and demo credentials see [`README.md`](README.md); this
file focuses on conventions and the non-obvious rules.

## Stack

SvelteKit 2 (`adapter-node`) · Svelte 5 (runes) · TypeScript (strict) · Drizzle
ORM + `postgres.js` on PostgreSQL 18 · Vitest + Playwright · Yivi/IRMA auth.

## Commands

| Command               | What it does                                     |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | SvelteKit dev server                             |
| `npm run build`       | Production build (`adapter-node`)                |
| `npm run check`       | `svelte-check` (TS + Svelte types)               |
| `npm run lint`        | Prettier check + ESLint (fails on any warning)   |
| `npm run format`      | Prettier write                                   |
| `npm run test:unit`   | Vitest unit tests (node env)                     |
| `npm run test:e2e`    | Playwright e2e (builds + previews the app)       |
| `npm run db:generate` | Generate a SQL migration from schema changes     |
| `npm run db:migrate`  | Run pending migrations                           |
| `npm run db:check`    | Migration safety check (also in pre-commit + CI) |

## Conventions

- **Formatter is authoritative.** Prettier config: tabs, single quotes,
  `printWidth: 100`, no trailing commas. Run `npm run format`; don't hand-format.
- **TypeScript strict**, `svelte-check` must be clean (0 errors/warnings).
- **Svelte 5 runes** (`$state`, `$derived`, `$props`) — not the legacy store/`export let` style.
- **Server-only code lives in `src/lib/server/`** and must never be imported by client code.
- **No user-facing strings in components** — use `svelte-i18n` (locales in `src/lib/locales/`, en-US + nl-NL).

## Logging & observability

- Use the **structured logger**, not `console.*`. In request handlers use
  `event.locals.log` (a `pino` child logger carrying the request's `requestId`);
  elsewhere import `{ logger } from '$lib/server/logger'`. Level via `LOG_LEVEL`.
- Every request is logged (method/path/status/duration) and gets an
  `X-Request-Id` (inbound header reused if present, else minted). `/health` and
  `/readyz` are excluded from request logs.
- `handleError` in `hooks.server.ts` logs unhandled errors with the request id.
- Probes: **`/health`** = liveness (used by the Docker `HEALTHCHECK`);
  **`/readyz`** = readiness (pings the DB, returns 503 when unreachable).
- **Never log secrets** (tokens, API keys, Yivi attributes, request bodies).

## Config

- Read env via `$env/dynamic/private` (server) — never hardcode.
- **Feature flags** are `FF_*` env vars resolved in `src/lib/feature-flags.ts`
  (imported as `$lib/feature-flags`); in dev they can also be toggled at runtime
  from the admin settings page.
- Required vars fail fast at startup (e.g. `DATABASE_URL`).

## Database & migrations

- **File-based SQL migrations only** — never `drizzle-kit push` against a real DB.
  Workflow: edit `src/lib/server/db/schema.ts` → `npm run db:generate` → review the
  SQL in `drizzle/migrations/` → commit it alongside the schema change.
- **Migration safety is enforced** (pre-commit + CI via `db:check`). Blocked
  patterns: `DROP TABLE`/`DROP COLUMN`, `RENAME`, `SET NOT NULL` without backfill,
  `ADD COLUMN NOT NULL` without `DEFAULT`, `TRUNCATE`. Use the **expand/contract**
  pattern for breaking changes (add nullable → migrate code → drop later). A line
  with a `-- safe:` comment bypasses a specific check — use sparingly.
- The business portal **shares its Postgres with the PKG server**, so business
  tables are prefixed (e.g. `business_api_keys`, not `api_keys`).

## Auth & security

- Auth is **Yivi/IRMA attribute disclosure** — no passwords. Two user types:
  `org` and `admin`. Sessions are server-side (SHA-256-hashed token, `pg_session`
  HttpOnly cookie, secure in prod, TTL + throttled `lastActiveAt`).
- **Demo vs prod attributes**: `YIVI_DEMO_ATTRIBUTES=true` uses the `irma-demo`
  scheme; unset uses the `pbdf` production scheme.
- **API keys** are SHA-256-hashed; the plaintext prefix is shown once at creation.
- Non-CSP security headers (X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy) are set in `hooks.server.ts`. The
  report-only **CSP** is configured in `svelte.config.js` (`kit.csp.reportOnly`)
  and posts violations to `/api/csp-report`.
- **Report vulnerabilities privately** — see [`SECURITY.md`](SECURITY.md), not public issues.

## Testing

- Unit tests: `tests/unit/**` (and colocated `*.test.ts`), node env. Mock
  server deps with `vi.mock` + `vi.hoisted` (see `tests/unit/dns-verification.test.ts`).
- E2E: `tests/e2e/**/*.e2e.ts` (Playwright). CI runs both against a real Postgres.

## CI / releases

- **PR titles must be Conventional Commits** (`feat:`/`fix:`/`docs:`/`ci:`/`chore:`/…) —
  enforced by the `pr-title.yml` check. Releases are automated via release-please.
- Pre-commit (husky) runs `svelte-check`, `npm run lint`, and `db:check`.
- CI also runs CodeQL, dependency review, secret scanning, and an image
  vulnerability scan; published GHCR images are cosign-signed.

## Gotchas

- **Don't mutate the global `svelte-i18n` locale in `hooks.server.ts`** — the store
  is process-global and would leak across concurrent requests. The per-request
  locale is carried on `event.locals.locale` and applied in `+layout.ts`.
- The IRMA/Yivi server is reached only through the server proxy `/irma/[...path]`
  (which injects the auth token); the browser never talks to it directly.
- A leftover `coverage/` directory can trip `prettier --check` locally — it's
  git-ignored; don't commit it.
