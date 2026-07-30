# OmniXtra

OmniXtra is an AI-native, multi-tenant Learning Management Platform.

The project source of truth is [AGENTS.md](./AGENTS.md). Sprint progress is tracked in Part 8 of that file.

## Current Status

Pre-Sprint 0 implementation has started. The repository contains the initial `api/` and `web/` application folders, plus planning documents from the charter and ADR.

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
