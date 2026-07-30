# OmniXtra

OmniXtra is an AI-native, multi-tenant Learning Management Platform.

The project source of truth is [AGENTS.md](./AGENTS.md). Sprint progress is tracked in Part 8 of that file.

## Current Status

Sprint 0-4 backend foundations are implemented, with MVP hardening in progress. The API has tenant/RLS foundations, auth skeletons, course and learning backends, and a local/mock AI tutor runtime. The frontend currently contains static foundations rather than full workflow routes. `AGENTS.md` is the detailed tracker and now distinguishes implemented foundations from remaining production gaps.

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

The API health endpoint is available at `http://localhost:8000/health`.
PostgreSQL is exposed locally on port `15432` and Redis on `16379` by default to avoid common local-service collisions.
