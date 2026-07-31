# Release Candidate Review - v0.1.0-rc.1

Status: RC tagged

Tag: `v0.1.0-rc.1`  
Commit: `cbd2542`  
Date: 2026-07-31

## Summary

`v0.1.0-rc.1` is the first OmniXtra MVP release-candidate checkpoint. It includes completed Sprints 0-5 and the completed MVP readiness remediation track.

## Evidence

- MVP readiness evidence: `docs/runbooks/mvp-readiness-verification-2026-07-31.md`
- Real OpenAI tutor eval evidence: `docs/runbooks/ai-tutor-eval-latest.json`
- CI status at tag point: green on `main`
- Docker-backed integration tests: passed
- Frontend desktop/tablet/mobile Playwright tests: passed

## Included MVP Capabilities

- Multi-tenant FastAPI backend with RLS-backed isolation.
- Auth, RBAC defaults, refresh-token rotation, and auth rate limiting.
- Course authoring backend and frontend builder foundation.
- Learner course player, progress, quiz, completion, and certificate flows.
- AI tutor job enqueueing, worker execution, tenant-scoped retrieval, citations, guardrails, semantic cache, streaming, and usage limits.
- Billing plans, checkout/session handling, signed Stripe webhook path, subscription state, and billing audit coverage.
- Tenant branding, admin reporting, CSV export, onboarding, and pricing surfaces.
- CI gates for backend lint/format/type/tests, real Postgres/Redis integration tests, isolation coverage, frontend lint/type/unit tests, and Playwright e2e.

## Release Review

### RC-Blocking Issues

None identified for an MVP release-candidate checkpoint.

### Production Launch Decisions Still Required

- ADR-002 remains proposed and needs sign-off before production launch.
- `omnixtra_superadmin` access policy must be confirmed: full read versus redacted read.
- Tenant deletion policy must be confirmed: soft delete immediately, scheduled hard delete after 30 days is the current recommendation.
- RLS benchmark target and index strategy must be formally accepted.
- Future marketplace cross-tenant visibility must remain out of generic bypass paths and should get a separate ADR when started.

### Deployment Prerequisites

- Replace local `.env.example` defaults with production secrets and managed service URLs.
- Provision production Postgres 16 with pgvector and the required roles.
- Provision production Redis.
- Choose and configure production hosting for API, worker, and web.
- Configure Stripe, Resend, OpenAI or Anthropic, Sentry, OpenTelemetry export, and LangSmith secrets.
- Confirm migration execution procedure for the chosen host.

## Recommendation

Use `v0.1.0-rc.1` as the stable checkpoint for deployment planning. The next track should be deployment preparation, not more MVP feature work. Track deployment work in `docs/runbooks/deployment-preparation-checklist.md`.
