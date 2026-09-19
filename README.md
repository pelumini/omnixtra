# OmniXtra

OmniXtra is an AI-native, multi-tenant Learning Management Platform.

The project source of truth is [AGENTS.md](./AGENTS.md). Sprint progress is tracked in Part 8 of that file.

## Current Status

Sprint 0-5 and MVP readiness remediation are complete. The first release-candidate checkpoint is tagged as `v0.1.0-rc.1`; readiness evidence is recorded in `docs/runbooks/mvp-readiness-verification-2026-07-31.md`. Deployment preparation is tracked in `docs/runbooks/deployment-preparation-checklist.md`.

## Local Development

Canonical local development runs through Compose so the API and web app always
come up on the same URLs:

```bash
docker compose up --build --wait
```

Local testing URLs:

- API: `http://localhost:8000`
- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
- Web: `http://localhost:3001`

Tenant-scoped local URLs use wildcard localhost subdomains, matching production
subdomain routing:

- Public entry and academy creation: `http://localhost:3001`
- Tenant web app after signup/login: `http://{academy}.localhost:3001`
- Tenant API calls from the browser: `http://{academy}.localhost:8000`

For localhost only, the browser creates the academy through
`http://{academy}.localhost:8000` so the API can issue host-scoped cookies that
are accepted by browsers over local HTTP. If browser policy still refuses a
cross-origin `Set-Cookie`, the web app completes a localhost-only first-party
handoff on `{academy}.localhost:3001/auth/local-signup` using the signed access
token returned by tenant creation. Production domains use Secure, parent-scoped
cookies from `APP_BASE_DOMAIN`, for example `.omnixtra.app`. Do not replace this
with a dev-only tenant header or bypass.

Backend commands are run from `api/` with `uv`:

```bash
uv sync --dev
uv run ruff check .
uv run ruff format --check .
uv run mypy app --strict
uv run pytest
uv run uvicorn app.main:app --reload
```

Frontend commands are run from `web/`:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run verify
npm run dev -- --port 3001
```

`npm run verify` is the frontend pre-push gate: lint, TypeScript, and Vitest.
Playwright is CI-only on Linux and is not part of local agent verification.
Local browser checks should be performed manually by the human tester when needed.

```bash
npm run verify
```

The local verification runbook is
[`docs/runbooks/local-verification-workflow.md`](./docs/runbooks/local-verification-workflow.md).
Use the documented local checks before pushing; CI re-runs them asynchronously
as the backstop.

Backend-only local infrastructure remains available for backend-focused work:

```bash
docker compose up postgres redis api worker
```

Fresh-clone Docker flow:

1. Copy `.env.example` values or create a compatible local `.env` if you need overrides.
2. Run `docker compose up --build --wait`.
3. Compose starts PostgreSQL, Redis, Adminer, runs the one-shot `migrate` service with Alembic, then starts the API, worker, and web app after dependencies are healthy.
4. Verify the API, web, and database browser endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:3001
curl http://localhost:8082
```

Adminer is available at `http://localhost:8082` for local database inspection.
Use `System: PostgreSQL`, `Server: postgres`, `Username: omnixtra_app`, `Password: omnixtra_app_password`, and `Database: omnixtra`.

If an older local Docker volume was created with different database role passwords, recreate that local development volume before retrying Compose.

Backend tests against local Compose services can be run with:

```bash
cd api
uv sync --dev
$env:OMNIXTRA_TEST_DATABASE_URL="postgresql://omnixtra_app:omnixtra_app_password@localhost:15432/omnixtra"
uv run pytest
```

DevContainer flow:

1. Open the repository in VS Code.
2. Choose **Dev Containers: Reopen in Container**.
3. The `api-dev` container starts PostgreSQL and Redis, installs backend dev dependencies, and runs Alembic migrations.
4. From the container terminal, run backend commands from `/workspaces/omnixtra/api`.

The API health endpoint is available at `http://localhost:8000/health`.
PostgreSQL is exposed locally on port `15432`, Redis on `16379`, and Adminer on `8082` by default to avoid common local-service collisions.
