# Local Verification Workflow

Local verification is the development loop. CI is the asynchronous backstop after
push.

## Targeted Checks

Run these from a normal workstation checkout:

```powershell
cd api
uv --cache-dir ..\.uv-cache run ruff check .
uv --cache-dir ..\.uv-cache run ruff format --check .
uv --cache-dir ..\.uv-cache run mypy app --strict
uv --cache-dir ..\.uv-cache run pytest tests/test_auth_routes.py
uv --cache-dir ..\.uv-cache run pytest -k tenancy
```

```powershell
cd web
npm run lint
npm run typecheck
npm test -- auth.test.tsx
npm run e2e:spec
```

Do not use raw `npx playwright test` as the project default on Windows. It lets
Playwright own the Next server lifecycle and has repeatedly left orphaned child
processes in this project. Use `npm run e2e -- <spec>` instead; the repo runner
builds, starts, checks readiness, runs Playwright with internal timeouts, tears
down the process tree, and exits explicitly.

Use `PLAYWRIGHT_PORT` to choose a fresh port when needed:

```powershell
cd web
$env:PLAYWRIGHT_PORT="3110"
npm run e2e -- e2e/my-courses-routing.spec.ts --project=desktop-chrome
```

## Pre-Push Gate

Run the full local suite once before a batched push:

```powershell
cd api
uv --cache-dir ..\.uv-cache run ruff check .
uv --cache-dir ..\.uv-cache run ruff format --check .
uv --cache-dir ..\.uv-cache run mypy app --strict
uv --cache-dir ..\.uv-cache run pytest

cd ..\web
npm run verify
```

`npm run verify` runs frontend lint, TypeScript, Vitest, and the full bounded
Playwright matrix. Backend remains driven by `uv` per `AGENTS.md`.

## Current Timing Baseline

These timings are measured on the local development workstation on 2026-08-06.
They are not a clean-checkout baseline because the worktree already contained
the accumulated local tenant/session remediation changes before this workflow
optimization task began.

| Check | Command | Time |
|---|---|---:|
| Backend lint | `uv --cache-dir ..\.uv-cache run ruff check .` | 3.57s |
| Backend format check | `uv --cache-dir ..\.uv-cache run ruff format --check .` | 0.24s |
| Backend typecheck | `uv --cache-dir ..\.uv-cache run mypy app --strict` | 6.88s |
| Backend tests | `uv --cache-dir ..\.uv-cache run pytest` | 27.30s |
| Frontend lint | `npm run lint` | 15.14s |
| Frontend typecheck | `npm run typecheck` | 8.18s |
| Frontend unit tests | `npm test` | 7.80s |
| E2E single spec, first run | `npm run e2e -- e2e/my-courses-routing.spec.ts --project=desktop-chrome` | 83.10s |
| E2E single spec, immediate rerun | `npm run e2e -- e2e/my-courses-routing.spec.ts --project=desktop-chrome` | 70.10s |

The two E2E runs used the same `PLAYWRIGHT_PORT=3113`; the port was free after
each run, proving the supported runner does not leave a stale listener behind.

## CI Shape

GitHub Actions uses independent jobs for backend, frontend, backend isolation
gates, and browser permission gates. Backend and frontend full suites are
path-filtered where safe, while tenant-isolation and header/permission browser
gates run on every push, PR, and manual dispatch.
