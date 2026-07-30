# OmniXtra

OmniXtra is an AI-native, multi-tenant Learning Management Platform.

The project source of truth is [AGENTS.md](./AGENTS.md). Sprint progress is tracked in Part 8 of that file.

## Current Status

Sprint 0-5 foundations are under remediation. The API has tenant/RLS foundations, auth skeletons, course and learning backends, a local/mock AI tutor runtime, a billing foundation, Docker migration wiring, and remote CI with real PostgreSQL/Redis integration tests. Auth hardening, provider-backed AI, functional frontend workflows, live Stripe wiring, branding, analytics, and MVP polish remain open. `AGENTS.md` is the detailed tracker and distinguishes implemented foundations from remaining production gaps.

## Local Development

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
npm run dev
```

Local infrastructure:

```bash
docker compose up
```

Fresh-clone Docker flow:

1. Copy `.env.example` values or create a compatible local `.env` if you need overrides.
2. Run `docker compose up --build --wait`.
3. Compose starts PostgreSQL and Redis, runs the one-shot `migrate` service with Alembic, then starts the API and worker after migrations complete.
4. Verify the API health endpoint:

```bash
curl http://localhost:8000/health
```

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
PostgreSQL is exposed locally on port `15432` and Redis on `16379` by default to avoid common local-service collisions.
