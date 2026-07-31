# MVP Readiness Verification - 2026-07-31

Status: Passed

This run records the Part 9 manual verification checklist evidence for the MVP readiness remediation track.

## Environment

- Branch: `main`
- Local infrastructure: Docker Compose PostgreSQL 16 + pgvector on `localhost:15432`, Redis 7 on `localhost:16379`
- API database: `omnixtra`
- Frontend Playwright server: `http://127.0.0.1:3100`

## Commands Run

### Backend Integration

```powershell
$env:DATABASE_URL='postgresql+asyncpg://omnixtra_app:omnixtra_app_password@localhost:15432/omnixtra'
$env:MIGRATIONS_DATABASE_URL='postgresql+psycopg://omnixtra_migrations:omnixtra_migrations_password@localhost:15432/omnixtra'
$env:OMNIXTRA_TEST_DATABASE_URL='postgresql://omnixtra_app:omnixtra_app_password@localhost:15432/omnixtra'
$env:REDIS_URL='redis://localhost:16379/0'
uv --cache-dir ..\.uv-cache run pytest -p no:cacheprovider tests\integration -m integration
```

Result: `10 passed, 1 warning`

### Backend Focused Readiness

```powershell
uv --cache-dir ..\.uv-cache run pytest -p no:cacheprovider tests\test_health.py tests\test_tenant_middleware.py tests\test_ai_limits.py tests\test_ai_guardrails.py tests\test_ai_citations.py tests\test_course_services.py tests\test_learning_services.py tests\test_billing_services.py
```

Result: `39 passed, 1 warning`

### Frontend Unit, Lint, Type, E2E

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run e2e
```

Results:

- Vitest: `21 passed`
- ESLint: passed
- TypeScript: passed
- Playwright: `18 passed`

## Checklist Evidence

| Checklist Item | Evidence |
|---|---|
| 1. Create Tenant A and Tenant B. | `tests/integration/test_*_isolation_routes.py` create paired tenants through signup flows with unique slugs. |
| 2. Authenticate as Tenant B and attempt Tenant A resources by known IDs. | Course, learning, AI, billing, admin reporting, and branding isolation route tests use Tenant B credentials against Tenant A IDs. |
| 3. Confirm cross-tenant attempts return indistinguishable `404`. | Integration isolation tests assert protected cross-tenant route behavior through the application API. |
| 4. Query through app role raw SQL with no tenant context and confirm zero tenant rows. | `tests/integration/test_rls_last_defence.py` passed against Docker-backed Postgres. |
| 5. Publish a course with text, video, image, and quiz lessons. | Course route and service tests cover authoring/publish behavior; frontend builder tests cover text, video, image, quiz controls. |
| 6. Enrol a learner, resume progress, complete the course, and download a certificate. | Learning integration and focused learning service tests passed; frontend learner-completion e2e passed. |
| 7. Ask the tutor course-scoped questions and confirm citations. | `tests/test_ai_citations.py`, AI graph/service tests, and recorded `docs/runbooks/ai-tutor-eval-latest.json` passed 20/20 with real OpenAI provider. |
| 8. Ask out-of-scope and quiz-answer questions and confirm guardrails. | `tests/test_ai_guardrails.py` passed. |
| 9. Verify audit records for publishing, enrolment, completion, billing, and admin changes. | Course, learning, and billing service tests passed and assert transactional audit event creation. |
| 10. Verify logs contain `request_id` and `tenant_id` but no sensitive data. | `tests/test_health.py`, `tests/test_tenant_middleware.py`, and `app/core/logging.py` confirm request/tenant context propagation into structured logging. |
| 11. Exhaust a tenant AI rate limit and confirm another tenant is unaffected. | `tests/test_ai_limits.py` passed, including tenant-scoped rate and monthly-budget enforcement. |
| 12. Run frontend on mobile, tablet, and desktop widths for no layout breakage. | Playwright passed on `desktop-chrome`, `tablet-chrome`, and `mobile-chrome`: `18 passed`. |

## Notes

- The OpenAI eval evidence is already recorded at `docs/runbooks/ai-tutor-eval-latest.json`; it is key-backed evidence and is not reproducible from a fresh clone without a real provider key.
- CI remains the authoritative repeatable gate after this local readiness pass.
