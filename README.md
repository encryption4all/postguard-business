# PostGuard for Business

Business portal for organizations to manage PostGuard identity-based email signing. Built with SvelteKit, PostgreSQL, and Yivi/IRMA attribute-based authentication.

**Production:** `business.postguard.eu`
**Staging:** `business.staging.postguard.eu`

## Features

- **Landing page** with pricing and organization registration
- **Portal** — API key management, organization info, email audit log, DNS verification
- **Admin panel** — organization management, audit log, impersonation
- **Yivi authentication** — attribute-based login for both org users and admins
- **Feature flags** — every feature toggleable via environment variables

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) with `adapter-node` (server-side rendering)
- [Svelte 5](https://svelte.dev/docs/svelte) with runes (`$state`, `$derived`, `$props`)
- [Drizzle ORM](https://orm.drizzle.team) with `postgres.js` driver
- PostgreSQL 18
- SCSS with CSS custom properties (purple colorway)
- [svelte-i18n](https://github.com/kaisermann/svelte-i18n) (en-US, nl-NL)

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 24+](https://nodejs.org/) (for running checks locally)

### Running locally

```bash
# 1. Clone and install dependencies
git clone git@github.com:encryption4all/postguard-business.git
cd postguard-business
npm install

# 2. Copy the example environment file
cp .env.example .env

# 3. Start everything
docker compose up
```

This starts:

| Service | URL | Purpose |
|---------|-----|---------|
| **App** | http://localhost:8080 | SvelteKit dev server (via nginx) |
| **Adminer** | http://localhost:8081 | Database admin UI |
| **MailCrab** | http://localhost:1080 | Email capture UI |
| **IRMA server** | http://localhost:8088 | Yivi/IRMA dev server |

The `db-setup` service automatically runs migrations and seeds a demo admin account + example organization on first start.

### Demo credentials

The seed script creates demo accounts that work with `irma-demo` attributes:

| Role | Attribute | Value |
|------|-----------|-------|
| **Admin** | Email | `admin@postguard.eu` |
| | Full name | `Jan de Admin` |
| | Phone | `0612345678` |
| **Org user** | Email | `info@acme.example.nl` |

Admin login is at `/auth/login/admin`. Org login is at `/auth/login`.

Override admin credentials via `ADMIN_EMAIL`, `ADMIN_FULL_NAME`, `ADMIN_PHONE` in `.env`.

### Feature flags

Toggle features via environment variables in `.env`:

| Flag | Controls |
|------|----------|
| `FF_PRICING_PAGE` | Pricing page visibility |
| `FF_REGISTRATION` | Organization registration form |
| `FF_PORTAL_API_KEYS` | API key management in portal |
| `FF_PORTAL_ORG_INFO` | Organization info page |
| `FF_PORTAL_EMAIL_LOG` | Email audit log |
| `FF_PORTAL_DNS` | DNS verification page |
| `FF_ADMIN_PANEL` | Entire admin panel |
| `FF_ADMIN_ORG_STATUS` | Activate/suspend org buttons |
| `FF_ADMIN_AUDIT_LOG` | Admin audit log page |
| `FF_ADMIN_IMPERSONATION` | Admin impersonation feature |

In development mode, flags can also be toggled at runtime from the admin settings page.

## Database

### Schema

Defined in `src/lib/server/db/schema.ts` using Drizzle's `pgTable`. Tables:

- `organizations` — registered organizations
- `business_api_keys` — API keys (named `business_` to avoid collision with PKG's `api_keys` table)
- `sessions` — server-side sessions (hashed tokens)
- `change_requests` — org data change requests pending admin approval
- `email_audit_log` — signed email audit trail
- `dns_verifications` — domain verification records
- `admin_accounts` — admin users
- `admin_audit_log` — admin action audit trail

### Migrations

We use file-based SQL migrations (not `drizzle-kit push`). Migration files live in `drizzle/migrations/` and are version-controlled.

**Creating a new migration:**

```bash
# 1. Edit the schema in src/lib/server/db/schema.ts

# 2. Generate the SQL migration
npm run db:generate

# 3. Review the generated SQL file in drizzle/migrations/

# 4. Commit the migration file alongside the schema change
```

**Running migrations locally:**

```bash
npm run db:migrate
```

**Migration safety rules:**

All migrations are checked for backward compatibility (both in a pre-commit hook and in CI). The following patterns are blocked:

- `DROP TABLE` / `DROP COLUMN` / `RENAME COLUMN` / `RENAME TABLE`
- `SET NOT NULL` without prior backfill
- `ADD COLUMN NOT NULL` without a `DEFAULT`
- `TRUNCATE`

Use the **expand/contract** pattern for breaking changes:

1. **Release N:** Add new column (nullable or with default). Old code ignores it.
2. **Release N+1:** Code starts using the new column.
3. **Release N+2:** Drop the old column (only after old code is fully gone).

Run the checker manually:

```bash
npm run db:check
```

### Shared database

The business portal and the PKG server share the same PostgreSQL instance. To avoid table name collisions, business portal API keys are stored in `business_api_keys` (not `api_keys`).

## Development

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start SvelteKit dev server |
| `npm run build` | Production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run lint` | Prettier + ESLint |
| `npm run format` | Auto-format with Prettier |
| `npm run test` | Run unit + E2E tests |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run db:generate` | Generate SQL migration from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:check` | Check migrations for dangerous patterns |

### Pre-commit hooks

[Husky](https://typicode.github.io/husky/) runs two checks on every commit:

1. `svelte-check --threshold warning` — TypeScript + Svelte type checking
2. `scripts/check-migrations.ts` — migration safety rules

### Project structure

```
src/
  routes/
    (marketing)/        # Public pages (landing, pricing, register)
    (portal)/portal/    # Authenticated org portal
    (admin)/admin/      # Admin panel
    auth/               # Login/logout
    api/                # JSON API endpoints
    irma/[...path]/     # IRMA server proxy (adds auth token)
    health/             # Kubernetes health endpoint
  lib/
    server/
      db/               # Drizzle schema + client
      auth/             # Session + Yivi helpers
      services/         # Business logic
    components/         # Svelte components
    stores/             # Svelte 5 rune-based stores
    locales/            # i18n (en.json, nl.json)
    feature-flags.ts    # Feature flag system
    global.scss         # Design tokens (purple colorway)
drizzle/
  migrations/           # SQL migration files (version-controlled)
scripts/
  migrate.ts            # Standalone migration runner
  seed.ts               # Demo data seeder
  check-migrations.ts   # Migration safety checker
docker/
  Dockerfile            # Production image
  dev.Dockerfile        # Dev image (hot reload)
  nginx.dev.conf        # Dev reverse proxy
  entrypoint.sh         # Production entrypoint (seed + start)
```

## CI/CD

### Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main` and on pull requests:

1. **Migration Safety** — checks SQL migrations for backward-incompatible patterns
2. **Svelte Check** — TypeScript + Svelte type checking
3. **Tests** — Vitest + Playwright (with PostgreSQL service container)
4. **Release Please** — creates GitHub releases with semantic versioning (main only)
5. **Build** — multi-platform Docker images (amd64 + arm64)
6. **Finalize** — merges into a multi-platform manifest on GHCR

### Docker image tags

| Trigger | Tag | Example |
|---------|-----|---------|
| Push to main | `edge` | `ghcr.io/encryption4all/postguard-business:edge` |
| Pull request | `pr-N` | `ghcr.io/encryption4all/postguard-business:pr-42` |
| Release | `X.Y.Z` | `ghcr.io/encryption4all/postguard-business:1.2.0` |

## Releases

This project uses [Release Please](https://github.com/googleapis/release-please) for automated semantic versioning based on [Conventional Commits](https://www.conventionalcommits.org/).

### Commit message format

| Prefix | Version bump | Example |
|--------|-------------|---------|
| `fix:` | Patch (1.0.x) | `fix: resolve login redirect loop` |
| `feat:` | Minor (1.x.0) | `feat: add email revocation` |
| `feat!:` or `BREAKING CHANGE:` | Major (x.0.0) | `feat!: change API key format` |

Other prefixes (`chore:`, `docs:`, `refactor:`, `test:`) do not trigger a release.

### Release workflow

1. **Write code** using conventional commit messages
2. **Push to main** — CI builds the `edge` image
3. **Release Please** automatically opens/updates a release PR that:
   - Bumps the version in `package.json`
   - Updates `CHANGELOG.md`
   - Collects all commits since the last release
4. **Merge the release PR** — this triggers:
   - A GitHub release + git tag
   - A Docker image tagged with the version (e.g., `1.2.0`)
5. **Deploy** — update the image tag in `postguard-ops` and apply Terraform

### Deploying to staging

Staging automatically tracks the `edge` tag. After pushing to main:

```bash
# In postguard-ops/
terraform apply -var-file=environments/dev.tfvars
```

Terraform runs the migration Job first, then rolls out the new deployment.

### Deploying to production

After merging a release PR:

```bash
# In postguard-ops/
# Update postguard_business_image_tag in environments/prod.tfvars to the new version
terraform apply -var-file=environments/prod.tfvars
```

### Kubernetes migration Job

Migrations run as a Kubernetes Job (`business-migrate-{tag}`) before the deployment starts. The Job:

- Uses the same Docker image as the app
- Runs `scripts/migrate.ts` against the production database
- Must complete successfully before the deployment proceeds
- Retries up to 3 times, times out after 2 minutes
- Auto-cleans up after 5 minutes

If the migration fails, Terraform stops and the deployment does not proceed.

> **Note:** For `edge` deploys, the Job name is `business-migrate-edge` and won't be recreated on subsequent applies with the same tag. Delete the old Job first: `kubectl delete job business-migrate-edge -n <namespace>`

## Infrastructure

Managed in [postguard-ops](https://github.com/encryption4all/postguard-ops) via Terraform.

### Key Terraform variables

| Variable | Description |
|----------|-------------|
| `deploy_business` | Enable/disable business portal |
| `postguard_business_image_tag` | Docker image tag to deploy |
| `business_host` | Public hostname |
| `business_database_user` | PostgreSQL user (key in K8s `postgres` secret) |
| `business_admin_secret_id` | Scaleway secret with admin credentials |

### Architecture

```
Internet → Ingress → business-svc:3000 → business-deployment
                                              ↓
                              PostgreSQL (Scaleway Managed)
                                              ↑
                              business-migrate Job (pre-deploy)
```

The IRMA/Yivi server is accessed through SvelteKit's backend proxy (`/irma/[...path]`), which adds the authentication token. The browser never communicates directly with the IRMA server.
