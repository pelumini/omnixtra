# Deployment Preparation Checklist

Status: Not started  
Applies to: `v0.1.0-rc.1` and later release candidates

This checklist turns the MVP release-candidate review into deployable work. It is intentionally provider-neutral until the deployment targets are selected.

## 1. Release Baseline

- [x] Create release-candidate tag: `v0.1.0-rc.1`.
- [x] Record MVP readiness evidence: `docs/runbooks/mvp-readiness-verification-2026-07-31.md`.
- [x] Record RC review: `docs/runbooks/release-candidate-v0.1.0-rc.1.md`.
- [ ] Select deployment target for web.
- [ ] Select deployment target for API and worker.
- [ ] Select managed Postgres provider.
- [ ] Select managed Redis provider.
- [ ] Decide whether the first deployment is staging-only, private design-partner production, or public MVP production.

## 2. Architecture Sign-Off

These must be resolved before production launch.

- [ ] Sign off ADR-002 multi-tenant isolation.
- [ ] Confirm `omnixtra_superadmin` policy: full read access versus redacted read access.
- [ ] Confirm tenant deletion policy: soft delete immediately and scheduled hard delete after 30 days is the current recommendation.
- [ ] Confirm RLS benchmark target and tenant-leading compound index strategy.
- [ ] Confirm future marketplace cross-tenant visibility will require a separate ADR and custom RLS policies.

## 3. Runtime Services

### Web

- [ ] Provision frontend hosting.
- [ ] Configure build command: `npm ci && npm run build`.
- [ ] Configure app directory: `web`.
- [ ] Configure `NEXT_PUBLIC_API_URL`.
- [ ] Configure `NEXT_PUBLIC_APP_URL`.
- [ ] Configure preview/staging URL.
- [ ] Configure production domain and TLS.

### API

- [ ] Provision API hosting.
- [ ] Configure Python 3.12 runtime or container deployment from `api/Dockerfile`.
- [ ] Configure health check: `/health`.
- [ ] Configure public API URL.
- [ ] Configure process command: `.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] Configure autoscaling or minimum instance count.
- [ ] Configure request timeout suitable for non-AI HTTP routes.

### Worker

- [ ] Provision worker hosting.
- [ ] Configure worker command: `.venv/bin/dramatiq app.workers.main`.
- [ ] Confirm worker has access to the same Postgres, Redis, AI provider, Sentry, OTel, and LangSmith env vars as the API.
- [ ] Confirm worker restart policy.
- [ ] Confirm worker logs are shipped to the same log sink as API logs.

## 4. Data Services

### Postgres

- [ ] Provision PostgreSQL 16.
- [ ] Enable pgvector.
- [ ] Create database: `omnixtra`.
- [ ] Create `omnixtra_app` role with no `BYPASSRLS`.
- [ ] Create `omnixtra_migrations` role with no `BYPASSRLS`.
- [ ] Create `omnixtra_superadmin` role only if the signed-off support policy requires it.
- [ ] Grant required schema/database privileges.
- [ ] Confirm app role cannot bypass RLS.
- [ ] Configure connection pool limits for API and worker.
- [ ] Configure automated backups and point-in-time recovery.
- [ ] Configure provider audit logs or pgAudit-equivalent for privileged DB access.

### Redis

- [ ] Provision Redis 7 or compatible managed Redis.
- [ ] Configure TLS if provider supports it.
- [ ] Configure eviction policy suitable for cache/pubsub/rate-limit use.
- [ ] Confirm Redis URL works from API and worker.
- [ ] Confirm Redis Pub/Sub works for tutor SSE events.
- [ ] Confirm AI rate-limit keys use tenant-scoped prefixes.

## 5. Secrets And Environment Variables

Never reuse `.env.example` secrets outside local development.

### Core

- [ ] `APP_ENV`
- [ ] `APP_NAME`
- [ ] `APP_BASE_DOMAIN`
- [ ] `JWT_SECRET_KEY`
- [ ] `JWT_ISSUER`
- [ ] `ACCESS_TOKEN_MINUTES`
- [ ] `DATABASE_URL`
- [ ] `MIGRATIONS_DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `WEB_APP_URL`
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_APP_URL`

### AI

- [ ] `AI_PROVIDER`
- [ ] `AI_PROVIDER_TIMEOUT_SECONDS`
- [ ] `AI_TUTOR_REQUESTS_PER_MINUTE`
- [ ] `AI_MONTHLY_TOKEN_BUDGET`
- [ ] `AI_MONTHLY_TOKEN_WARNING_PERCENT`
- [ ] `AI_TUTOR_ESTIMATED_TOKENS_PER_REQUEST`
- [ ] `AI_TUTOR_FEATURE_TOKEN_LIMIT`
- [ ] `OPENAI_API_KEY`, if OpenAI is enabled.
- [ ] `OPENAI_MODEL`
- [ ] `OPENAI_EMBEDDING_MODEL`
- [ ] `ANTHROPIC_API_KEY`, if Anthropic is enabled.
- [ ] `ANTHROPIC_MODEL`
- [ ] LangSmith env vars required by the selected deployment platform.

### Billing

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] Configure Stripe webhook endpoint: `/api/v1/billing/webhooks/stripe`.
- [ ] Configure Stripe products/prices to match seeded or configured plan slugs.
- [ ] Verify signed webhook delivery in staging.

### Email

- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] Verify sender domain.
- [ ] Send a staging magic-link email.
- [ ] Send a staging password-reset email.
- [ ] Send a staging invitation email.

### Observability

- [ ] `SENTRY_DSN`
- [ ] `OTEL_EXPORTER_OTLP_ENDPOINT`
- [ ] Configure log sink.
- [ ] Configure metrics/uptime checks.
- [ ] Configure LangSmith tracing credentials.

## 6. Migration Procedure

- [ ] Confirm migrations run from the `omnixtra_migrations` role.
- [ ] Confirm migration command for the selected host.
- [ ] Run `alembic upgrade head` against staging.
- [ ] Run migration smoke: upgrade head, downgrade base, upgrade head in disposable environment.
- [ ] Verify RLS policies exist and are forced for tenant-owned tables.
- [ ] Verify pgvector extension is installed before AI migrations run.

## 7. Staging Verification

- [ ] Deploy web, API, worker, Postgres, and Redis to staging.
- [ ] Run `/health` against the deployed API.
- [ ] Run tenant-creation/login smoke flow.
- [ ] Create Tenant A and Tenant B.
- [ ] Confirm cross-tenant API attacks return indistinguishable `404`.
- [ ] Publish a course with text, video, image, and quiz blocks.
- [ ] Enrol a learner, resume progress, complete course, and download certificate.
- [ ] Ask tutor an in-course question and confirm citation behavior.
- [ ] Ask tutor out-of-scope and quiz-answer questions and confirm guardrails.
- [ ] Confirm AI rate limit blocks one tenant/user without affecting another tenant.
- [ ] Run Stripe checkout/session smoke in test mode.
- [ ] Send Resend transactional email smoke.
- [ ] Export admin CSV and confirm formula neutralization.
- [ ] Confirm logs contain `request_id` and `tenant_id` and do not contain secrets, tokens, passwords, or private prompt payloads.
- [ ] Confirm Sentry receives a staged test event.
- [ ] Confirm OTel traces appear in the selected backend.
- [ ] Confirm LangSmith traces appear for AI tutor runs.

## 8. Production Cutover

- [ ] Confirm staging verification is complete.
- [ ] Confirm production secrets are configured.
- [ ] Confirm production database backup/PITR is enabled.
- [ ] Confirm production DB audit logging is enabled.
- [ ] Run production migrations.
- [ ] Deploy API.
- [ ] Deploy worker.
- [ ] Deploy web.
- [ ] Configure production Stripe webhook.
- [ ] Configure production DNS and TLS.
- [ ] Run production health check.
- [ ] Run production tenant-creation/login smoke with a controlled tenant.
- [ ] Run production tutor smoke within configured token budget.
- [ ] Monitor logs, errors, traces, worker jobs, Redis, and database metrics for the first hour.

## 9. Rollback Plan

- [ ] Identify previous deployable version.
- [ ] Confirm whether any migration is irreversible before deploy.
- [ ] Confirm backup restore path and expected recovery time.
- [ ] Document command to roll API back.
- [ ] Document command to roll worker back.
- [ ] Document command to roll web back.
- [ ] Document how to pause Stripe webhooks if necessary.
- [ ] Document how to disable AI provider usage if cost/error spike occurs.

## 10. Go / No-Go

- [ ] All production launch decisions are signed off.
- [ ] All required services are provisioned.
- [ ] All production secrets are set.
- [ ] Staging verification is complete.
- [ ] Rollback procedure is documented.
- [ ] On-call owner is assigned for launch day.
- [ ] Launch window is selected.

Current recommendation: complete this checklist in staging before cutting a production MVP release.
