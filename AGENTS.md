# OmniXtra: Architecture, Infrastructure & Agent Implementation Plan

**Project**: OmniXtra AI-Native Learning Management Platform  
**Source of Truth**: `OmniXtra_Project_Charter_v1.2.docx` + `ADR-002_Multi-Tenant_Isolation.docx`  
**Charter Version**: 1.2, pre-kickoff draft  
**ADR Status**: ADR-002 proposed, awaiting sign-off  
**Status**: Sprints 0-5 complete; MVP readiness verification track ready
**Scope**: Full-stack LMS, FastAPI backend, Next.js frontend, AI tutor, multi-tenant SaaS

---

## Instructions

### Backend (Python / FastAPI)

1. This project uses `uv`. Always use `uv` for backend package management, task execution, testing, and lockfile operations. Fall back to `pip` only if `uv` fails.
2. Backend runtime is Python 3.12 with FastAPI, SQLAlchemy 2.x async, Alembic, asyncpg, PostgreSQL 16, pgvector, Redis 7, and Dramatiq.
3. Use Ruff for linting and formatting. All backend code must pass `ruff check` and `ruff format`.
4. Use mypy in strict mode. All backend modules must pass `mypy --strict` with no errors.
5. Use pre-commit hooks to enforce linting, formatting, type-checking, and other quality gates.
6. Follow the modular monolith pattern. Each domain module owns its Models, Schemas, Services, Repositories, Routes, and Events.
7. Export public classes and functions via `__init__.py` with explicit `__all__` definitions.
8. Do not use raw SQL outside of Alembic migrations and the pgvector retrieval module. Raw SQL never replaces tenant-safe repository/service boundaries.
9. Errors must be typed. Do not use bare `except`, do not swallow exceptions, and do not leak sensitive context in error messages.
10. All routes live under `/api/v1/` unless explicitly documented as system endpoints such as health checks.

### Frontend (Next.js / TypeScript)

11. Frontend uses Next.js 15 App Router, React 19, and TypeScript strict mode.
12. Use Server Components by default. Use Client Components only when interactivity requires browser state, events, effects, or client-only APIs.
13. Styling uses TailwindCSS 4 and shadcn/ui. Do not add custom CSS unless Tailwind cannot reasonably express the design.
14. Use React Query (TanStack Query) for server state. Use Zustand only for client-only state such as auth UI preferences and transient interface state.
15. All API request and response types must be validated with Zod schemas mirroring backend Pydantic schemas.
16. Use ESLint and Prettier. All frontend code must pass linting, formatting, and `tsc` strict checks.
17. Build tenant-brandable interfaces. Logo, primary colour, locale, time zone, and email templates must not be hard-coded when they should be configurable.

### AI Features

18. AI features must never block API calls. All AI workloads run asynchronously through Dramatiq jobs and stream status/results via Redis Pub/Sub and SSE.
19. AI outputs are advisory. Tutor responses must be visibly AI-generated; AI-assisted course authoring must require human review before publishing.
20. Never send learner PII to third-party LLMs. Paid-tenant course content may be sent to external LLM providers only when tenant settings explicitly consent.
21. Retrieval must be tenant-scoped at the index/query level. pgvector searches always filter by `tenant_id` and relevant resource scope, such as `course_id`, before or during retrieval.
22. AI jobs must be retry-safe, idempotent, cost-aware, and traceable in LangSmith.
23. Learner-facing tutor tools must not execute actions. Agentic tool execution is Phase 3 and must go through MCP auth, RBAC, tenant scoping, rate limits, and audit logging.

### Agent Execution Contract

All human and AI coding agents working on this codebase must:

- **Never** bypass tenant isolation in queries, migrations, jobs, cache access, vector search, file storage, SSE channels, or business logic.
- **Never** expose sensitive data in logs, error responses, traces, analytics payloads, API outputs, or AI prompts. Sensitive data includes PII, payment data, private course content, credentials, tokens, and audit details.
- **Never** introduce synchronous AI calls in request handlers.
- **Always** validate inputs via Pydantic on the backend and Zod on the frontend before processing.
- **Always** write or update tests alongside feature work. No feature is mergeable without meaningful tests.
- **Always** propagate `tenant_id` and `request_id` through service calls, background jobs, structured logs, traces, and audit records.
- **Always** include an audit log entry in the same database transaction as mutations affecting billing, enrolment, completion, certificates, publishing, RBAC, or admin actions.
- **Always** return cross-tenant resource access as indistinguishable `404 NotFoundError`, never `403`, partial data, or an existence-confirming error.
- **Always** default durable customer/domain data to soft deletion. Never introduce synchronous hard-delete paths for tenant, user, course, learner, enrolment, progress, audit-adjacent, or billing-adjacent data. Hard deletion must run only through reviewed retention/deletion jobs.
- **Always** treat ADR-002 as the controlling document for tenant isolation details where it is more precise than the charter.

---

## Project Context

### Product Narrative

OmniXtra is an AI-native, multi-tenant Learning Management System for small-to-medium businesses and startups that need to launch internal training, customer education, or partner enablement quickly.

The product wedge is a personalised AI tutor grounded in each tenant's own course content through RAG. The system must also support self-serve onboarding: a customer should be able to sign up, brand a tenant, upload or create a course, and invite learners without a sales-led implementation cycle.

The MVP is intentionally scoped. SCORM/xAPI, SSO, live classes, course marketplace, custom domains, deep analytics, and MCP agentic skills are deferred to later phases.

### Target Personas

| Persona | Context | Primary Job | Success Metric |
|---|---|---|---|
| Pia, Head of People | 20-200 person company, no L&D team | Launch onboarding and compliance training quickly | Time-to-launch under 1 week |
| Marco, Customer Success Lead | B2B SaaS, 50-500 employees | Educate customers and reduce support volume | Reduction in onboarding tickets |
| Sofia, Course Creator | SME or instructor | Build a course quickly with AI assistance | Course built in under 4 hours |
| Leo, Learner | Employee, customer, or partner | Complete required training without friction | Course completion over 70% |
| Ada, Org Admin | IT/Ops customer admin | Manage users, branding, SSO, and reporting | Self-serve without support tickets |

### Success Metrics

Business targets for the first 12 months:

- First 10 paying tenants by end of month 4.
- $10k MRR by end of month 9.
- Net revenue retention above 100% by end of year 1.

Product KPIs:

- Signup to first published course under 30 minutes at P50.
- Learner course completion rate above 65%.
- AI tutor weekly active usage above 40% among enrolled learners.
- Tenant 30-day retention above 80%.

Engineering KPIs:

- API p95 latency below 300ms.
- Frontend Largest Contentful Paint below 2.5s on 4G.
- Uptime above 99.5% for MVP and 99.9% by Phase 3.
- P1 incident MTTR below 1 hour.

### MVP Scope

| Capability | MVP Includes | Explicitly Excluded from MVP |
|---|---|---|
| Tenancy & Auth | Subdomain routing, RLS, email/password, magic link, Org Admin and Learner roles | SSO, MFA, custom roles |
| Course Authoring | Sections, lessons, text/video/image/quiz blocks, drag-drop reorder, draft/publish | SCORM/xAPI import, AI course generation, branching scenarios |
| Learning Experience | Course player, resume, progress bar, quiz scoring, completion certificate PDF | Forums, social learning, gamification |
| AI Tutor | Per-course RAG chat, LangGraph, pgVector retrieval, SSE streaming, conversation history | Voice tutor, agentic skill execution, fine-tuned models |
| Admin & Analytics | Completion %, learner progress, CSV export | Custom dashboards, scheduled reports, BI export |
| Branding | Logo, primary colour, custom subdomain | Custom domains, email white-labelling, custom CSS |
| Billing | Stripe subscription, self-serve checkout, plan changes | Marketplace, course sales, revenue share, invoicing |
| Notifications | Transactional email via Resend | In-app inbox, push, SMS, digest emails |

### Out of Scope for v1

- Native iOS or Android apps. Use responsive web and PWA.
- On-premise or air-gapped deployment.
- Rich authoring parity with Articulate, Rise, or Storyline.
- Proctoring, lockdown browsers, or anti-cheat.
- White-glove migration services.
- Native live video unless future evidence justifies it.

---

## Part 0: Architecture & Infrastructure

### 0.0 System Overview

```mermaid
graph TB
    User["Browser / Learner / Admin"] --> Web["Next.js App Router"]
    Web --> CDN["CDN / Vercel"]
    Web --> API["FastAPI Modular Monolith"]
    API --> Postgres["PostgreSQL 16 + pgvector + RLS"]
    API --> Redis["Redis 7"]
    API --> Storage["Cloudflare R2 / S3-compatible media storage"]
    API --> Worker["Dramatiq Workers"]
    Worker --> Redis
    Worker --> Postgres
    Worker --> LLM["OpenAI / Anthropic via LangGraph"]
    API --> Stripe["Stripe Billing"]
    API --> Email["Resend"]
    API --> Sentry["Sentry"]
    API --> OTel["OpenTelemetry"]
    Worker --> LangSmith["LangSmith"]
    ExternalAgent["External AI Agents, Phase 3"] --> MCP["FastMCP Server"]
    MCP --> API
```

### 0.1 Architectural Strategy: Modular Monolith

OmniXtra is a modular monolith, not a microservices system.

**Rationale:**

- Faster delivery for a small team or solo founder.
- Lower operational burden.
- Strong internal boundaries without distributed failure modes.
- Easier local development, debugging, and transaction handling.
- Future extraction remains possible through stable module service interfaces.

> **Design principle:** Design for extraction, not distribution. A well-built modular monolith that never needs to become microservices is a success.

### 0.2 Infrastructure Stack

#### Backend Technologies

| Technology | Version / Choice | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | Current stable | Async API framework and OpenAPI generation |
| SQLAlchemy | 2.x async | ORM and query construction |
| Alembic | Current stable | Database migrations |
| PostgreSQL | 16 | Primary relational store |
| pgvector | PostgreSQL extension | Embeddings and vector retrieval |
| asyncpg | Current stable | Async PostgreSQL driver |
| Redis | 7 managed | Cache, pub/sub, rate limits, Dramatiq broker |
| Dramatiq | Redis broker | Background jobs |
| structlog | JSON logs | Structured logging and redaction processors |
| OpenTelemetry | Vendor-neutral | Tracing and metrics export |
| Sentry | SaaS | Error tracking |
| Database audit logging | pgAudit, managed provider query logs, or equivalent | External audit trail for privileged database access, especially `omnixtra_superadmin` |

#### Frontend Technologies

| Technology | Purpose |
|---|---|
| Next.js 15 App Router | SSR, RSC, routing, frontend app |
| React 19 | UI framework |
| TypeScript strict | Type safety |
| TailwindCSS 4 | Styling |
| shadcn/ui | Owned component foundation |
| React Query | Server state |
| Zustand | Client-only state |
| Zod | Runtime schema validation |
| Playwright | Critical-path E2E tests |

#### AI Technologies

| Technology | Purpose |
|---|---|
| LangGraph | Stateful AI workflows, streaming, HITL, checkpointing |
| LangChain | Thin provider/prompt abstraction |
| LangSmith | AI tracing, evals, prompt versioning, cost dashboards |
| OpenAI / Anthropic | LLM providers |
| text-embedding-3-small | Default embedding model for MVP |
| pgvector HNSW | Vector similarity search |
| Redis semantic cache | Cost reduction for similar tutor queries |
| FastMCP | Phase 3 external AI agent access |

#### Managed Services

| Service | Preferred Choice | Purpose |
|---|---|---|
| Frontend hosting | Vercel | Next.js deployment |
| Backend hosting | Fly.io or Railway | FastAPI and workers |
| Database | Neon or Supabase | Managed Postgres with pgvector and RLS |
| Cache / queue | Upstash or managed Redis | Redis |
| Object storage | Cloudflare R2 | Media, exports, WORM audit batches |
| Video | Mux or Cloudflare Stream | HLS/adaptive bitrate |
| Email | Resend | Transactional email |
| Payments | Stripe Billing | SaaS subscriptions |
| Observability | Sentry, LangSmith, Grafana/Axiom | Errors, AI traces, logs/metrics |

### 0.3 Repository Layout

The charter describes a monorepo with two top-level applications. In this repository the corrected top-level app folders are:

```text
omnixtra/
|-- api/                  # FastAPI backend modular monolith
|   |-- app/
|   |   |-- core/         # config, db, redis, logging, security, exceptions
|   |   |-- shared/       # response envelope, audit interface, utilities
|   |   |-- tenancy/      # tenant context, middleware, RLS helpers
|   |   |-- auth/         # users, sessions, RBAC
|   |   |-- courses/      # course CRUD, publishing
|   |   |-- learning/     # enrolments, progress, certificates
|   |   |-- ai/           # tutor, RAG, embeddings, graphs
|   |   |-- billing/      # Stripe integration
|   |   |-- admin/        # admin endpoints
|   |   |-- mcp/          # MCP server, Phase 3
|   |   `-- workers/      # Dramatiq actors
|   |-- migrations/       # Alembic
|   `-- tests/
|-- web/                  # Next.js frontend
|-- packages/
|   `-- shared-types/     # generated from OpenAPI when introduced
|-- infra/
|   `-- terraform/        # or Pulumi when introduced
|-- docs/
|   |-- adr/
|   |-- runbooks/
|   `-- architecture/
`-- .github/workflows/
```

Only create folders when their sprint requires them. Do not scaffold future modules just to satisfy the tree.

### 0.4 Domain Module Structure

Each backend domain module follows this shape:

```text
app/{module}/
|-- models/          # SQLAlchemy 2.x typed ORM models
|-- schemas/         # Pydantic request/response schemas
|-- services/        # Business logic
|-- repositories/    # Data access abstraction
|-- routes/          # FastAPI route handlers
`-- events/          # Domain events
```

**Sprint 0 core packages only:**

- `core/` - config, database, Redis, logging, security, exceptions, middleware
- `shared/` - response envelope, audit interfaces, common utilities
- `api/` - API version routing
- `tenancy/` - placeholder until Sprint 1
- `auth/` - placeholder until Sprint 1

**MVP modules, created by sprint:**

- `tenancy` - tenants, subdomain resolution, context, RLS helpers
- `auth` - users, sessions, RBAC, password reset, magic links
- `courses` - courses, sections, lessons, blocks, draft/publish
- `learning` - enrolments, progress, quiz scoring, certificates
- `ai` - tutor graph, embeddings, retrieval, semantic cache, SSE events
- `billing` - Stripe checkout, plans, subscription state
- `admin` - tenant admin, reporting, CSV export
- `workers` - Dramatiq actors

### 0.5 Development Environment: DevContainers

The DevContainer is the primary backend development environment.

| Layer | Strategy | Rationale |
|---|---|---|
| Backend + infrastructure | Containerized via Docker Compose / DevContainer | Reproducible Postgres, Redis, API, worker |
| Frontend | Container or local | Local HMR is acceptable for faster UI iteration |
| Orchestration | Simple Compose | No Kubernetes or service mesh in MVP |

Rules:

- `docker compose up` must start backend services with zero configuration.
- `.env.example` must contain every required variable with sensible local defaults.
- PostgreSQL must auto-create the database and enable pgvector on first run.
- All services must define health checks.
- API and worker services must wait for database and Redis health.
- Frontend connects to backend through `NEXT_PUBLIC_API_URL`.

### 0.6 CI/CD Pipeline

Every PR must run:

```bash
# Backend
uv run ruff check .
uv run ruff format --check .
uv run mypy app --strict
uv run pytest

# Frontend
npm run lint
npm run typecheck
npm test
```

CI must include integration tests against real PostgreSQL and Redis. The tenant-isolation suite runs on every PR. A nightly extended isolation suite runs against seeded cross-tenant data.

### 0.7 Observability

| Layer | Tool | Requirement |
|---|---|---|
| Logs | structlog JSON | Include `request_id`, `tenant_id`, actor, redacted fields |
| Errors | Sentry | Tag `tenant_id`, `actor_id`, `request_id` |
| Traces | OpenTelemetry | Full sampling in staging, sampled in production |
| Metrics | Prometheus/Grafana or Axiom | Golden signals per endpoint group |
| AI traces | LangSmith | Graph traces, token usage, prompt versions, evals |
| Uptime | Better Stack or Checkly | Marketing site and health endpoint |

### 0.8 Background Job Processing

Use Dramatiq with Redis broker.

Use jobs for:

- AI graph execution.
- Embedding generation.
- Audit outbox flushing.
- WORM audit batch writes.
- Email sending where async handling is required.
- CSV/report generation.
- Certificate rendering if CPU-heavy.
- Data export and deletion workflows.

All jobs must be idempotent, retry-safe, tenant-scoped, request-correlated where applicable, and observable.

### 0.9 API Design Principles

- RESTful, resource-oriented routes.
- Strict versioning under `/api/v1/`.
- OpenAPI is generated by FastAPI. Do not maintain hand-written API docs.
- All responses use the standard envelope:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "request_id": "req_abc123"
  }
}
```

Error envelope:

```json
{
  "data": null,
  "error": {
    "type": "ValidationError",
    "message": "course title must be 3-200 characters",
    "details": [{ "field": "title", "constraint": "length" }]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-05-16T10:30:00Z"
  }
}
```

- Cursor pagination is required for list endpoints. Offset pagination is forbidden.
- PUT and DELETE are idempotent.
- POST endpoints that affect billing, enrolment, completion, or certificates accept `Idempotency-Key`.

### 0.10 Error Handling

| HTTP | Error Type | When |
|---|---|---|
| 400 | `ValidationError` | Pydantic/Zod or business-rule validation failure |
| 401 | `AuthenticationError` | Missing or invalid credentials |
| 403 | `AuthorizationError` | Authenticated but lacks permission |
| 404 | `NotFoundError` | Resource does not exist or does not exist in this tenant |
| 409 | `ConflictError` | Duplicate slug or invalid state transition |
| 422 | `UnprocessableEntity` | Valid syntax but semantic error |
| 429 | `RateLimitError` | Tenant, user, IP, or agent throttle exceeded |
| 500 | `InternalError` | Unexpected server failure |

Never reveal whether a resource exists in another tenant. Cross-tenant access is a `404`.

### 0.11 Real-Time Transport

SSE is the default server-to-client transport.

| Feature | Transport | Notes |
|---|---|---|
| AI tutor streaming | SSE | One-way stream with EventSource reconnect |
| AI job status | SSE | Redis Pub/Sub fanout |
| Notifications | SSE | Tenant-scoped channels |
| Authoring autosave indicator | SSE | Server confirms saves |
| Future live collaboration | WebSocket | Only when bidirectional presence/editing is required |

Redis channel names must include tenant scope, such as `tenant:{id}:ai_jobs` and `tenant:{id}:notifications`.

---

## Part 1: Multi-Tenancy and Isolation

### 1.1 Tenancy Model

OmniXtra uses a shared-database, shared-schema model with `tenant_id` on every tenant-owned table. Postgres Row-Level Security is mandatory for tenant-owned tables.

Rejected for MVP:

- Schema-per-tenant: migration, pooling, and backup complexity beyond SMB needs.
- Database-per-tenant: operationally expensive and reserved for future Enterprise tier.
- Application-only filtering: unacceptable because a missed `WHERE` can leak customer data.

### 1.2 Three-Layer Enforcement

| Layer | Where | Requirement |
|---|---|---|
| L1 Request context | API middleware/dependency | Resolve tenant from subdomain or authenticated principal; bind request-scoped tenant context |
| L2 ORM query filter | SQLAlchemy session | Inject tenant predicates for tenant-owned SELECT/UPDATE/DELETE and auto-populate INSERT `tenant_id` |
| L3 Postgres RLS | Database | Forced RLS policies compare row `tenant_id` to session-local tenant variable |

Each layer must fail closed. A query missing tenant context must return zero rows or raise a loud error, never all rows.

### 1.3 Database Roles

| Role | Used By | RLS | Rule |
|---|---|---|---|
| `omnixtra_app` | FastAPI runtime and workers | Enforced | Default production role. No `BYPASSRLS`. |
| `omnixtra_migrations` | Alembic | Enforced | Data migrations touching tenant rows set tenant context explicitly per batch. |
| `omnixtra_superadmin` | Internal support tooling only | BYPASSRLS | Separate connection, read-only SQL privileges, externally audit-logged. Never used by app runtime. |

Superadmin database access must be audit-logged outside the application through managed database audit logs, pgAudit, provider query logs, or equivalent infrastructure-level logging. Do not implement superadmin audit coverage as ordinary application audit logging; the application runtime must never be the trust anchor for a role that bypasses RLS.

### 1.4 Tenant-Owned vs Global Tables

Tenant-owned tables carry `tenant_id`, inherit tenant-scoped ORM behavior, have RLS enabled and forced, and require isolation tests.

Global tables are limited to:

- Tenant table itself.
- Plan/pricing reference data.
- System configuration.
- System-level audit log.

Expected tenant-owned tables include users, courses, sections, lessons, enrolments, progress, embeddings, conversations, tenant-scoped audit logs, media metadata, and certificates.

Future cross-tenant tables, such as marketplace listings, require a separate ADR and custom RLS policies.

### 1.5 Tenant Resolution

Browser traffic resolves tenant from subdomain. Programmatic API traffic may resolve tenant from authenticated principal claims.

Reserved subdomains are not valid tenant slugs:

- `www`
- `app`
- `api`
- `admin`
- `status`
- `docs`
- `blog`
- `mail`

Failure to resolve a tenant returns `404`, not `403`, to avoid tenant enumeration.

Allowed tenant-resolution exemptions are security-sensitive and must be reviewed. Examples include health checks, signup, and login.

### 1.6 RLS Session Variable Discipline

Connection pooling is the fragile point. A pooled connection must never retain Tenant A's context and serve Tenant B.

Implementation requirements from ADR-002:

- Set the tenant session variable before every cursor execution, not only on checkout.
- Explicitly clear the tenant variable when no tenant context is active.
- Tests must prove raw SQL through the app role cannot read cross-tenant rows.
- Data migrations that touch tenant-owned rows must set tenant context explicitly.

### 1.7 Bypass Discipline

Bypass is allowed only for documented, auditable cases:

- Tenant resolution before tenant context exists.
- Separate support tooling using `omnixtra_superadmin`.
- Future marketplace tables with custom RLS policies, not generic bypass.

Application code does not bypass isolation for analytics, debugging, support convenience, or "quick fixes".

Any ORM bypass flag must be explicit, named, grep-able, reviewed, and covered by CI enforcement.

### 1.8 Isolation Checklist

| Surface | Required Isolation Mechanism |
|---|---|
| Models | Tenant-owned base model includes `tenant_id` |
| Indexes | Common tenant-owned access paths use compound indexes leading with `tenant_id`, such as `(tenant_id, id)`, `(tenant_id, slug)`, or `(tenant_id, course_id, status)` |
| SELECT | ORM filter plus RLS |
| INSERT | Auto-populate tenant_id plus RLS `WITH CHECK` |
| UPDATE / DELETE | ORM filter plus RLS |
| File storage | Object keys scoped under tenant prefix |
| Redis cache | Keys prefixed with tenant scope |
| Rate limits | Tenant-primary buckets |
| Background jobs | `tenant_id` in job metadata |
| SSE | Tenant-scoped channels |
| Vector retrieval | Filter by `tenant_id` and `course_id` |
| Logs | `tenant_id` and `request_id` on every line |
| Audit | Tenant-scoped audit records and WORM batches |

### 1.9 Isolation Testing

Every endpoint that handles tenant-owned resources requires paired cross-tenant attack tests.

Minimum scenarios:

- Tenant B directly reads Tenant A resource by known ID and receives indistinguishable `404`.
- Tenant B PATCH/DELETE against Tenant A resource receives `404` and the resource is unchanged.
- Tenant B list endpoint excludes Tenant A resources.
- Tenant B search endpoint excludes Tenant A content, including semantic search.
- Pagination metadata does not reveal cross-tenant rows.
- Error message body for missing, cross-tenant, and soft-deleted resources is byte-identical where applicable.
- Timing behaviour for missing, cross-tenant, and soft-deleted resources must not create a practical existence oracle.

At least one RLS-last-defence test must bypass L1 and L2 with raw SQL through the application role and prove L3 alone returns zero rows.

CI must compare OpenAPI route inventory to isolation-test coverage declarations and fail if a new route lacks coverage.

Isolation coverage declarations should use an explicit pytest decorator so CI can parse coverage reliably:

```python
@covers_isolation("GET", "/api/v1/courses/{course_id}")
async def test_tenant_b_cannot_read_tenant_a_course(...):
    ...
```

Use one `@covers_isolation(method, path)` entry per protected route/verb. The decorator path must match the generated OpenAPI path template exactly. Naming conventions alone are not sufficient for CI coverage.

### 1.10 Outstanding Architecture Sign-off Items Before MVP Release

The charter and ADR-002 are still draft/proposed documents. Do not treat the following items as casually settled during Sprint 1 implementation:

- Decide whether `omnixtra_superadmin` has full read access or only redacted read access. The ADR recommends full read in MVP for support velocity, then tightening in Phase 2.
- Confirm tenant deletion policy. The recommended path is soft delete immediately, then scheduled hard delete after 30 days, with tenant resolver filtering soft-deleted tenants.
- Confirm the RLS benchmark target and index strategy. ADR-002 sets a target of under roughly 5% isolation overhead and calls out compound indexes leading with `tenant_id`.
- Confirm that future marketplace cross-tenant visibility is handled by a separate ADR and custom RLS policies, not generic tenant-filter bypass.

---

## Part 2: Auth, RBAC, and Tenant Administration

### 2.1 MVP Roles

| Role | MVP Purpose |
|---|---|
| Org Admin | Tenant setup, branding, users, courses, reports, billing |
| Learner | Enrolled course access, progress, quizzes, certificates, AI tutor |

Custom roles, SSO, MFA, and advanced permissions are deferred beyond MVP unless needed for security foundations.

### 2.2 Auth Requirements

- Email/password and magic link in MVP.
- JWT stored in httpOnly, Secure, SameSite cookies.
- Refresh-token rotation with replay detection.
- Argon2id password hashing.
- Login and signup rate limiting.
- Breached-password check through HIBP API when implemented.
- Password reset flow must avoid account enumeration.

### 2.3 Authorization Rules

- Enforce RBAC centrally.
- Never rely on frontend visibility as authorization.
- Every endpoint must check tenant scope and actor permission.
- Admin operations require audit logs.
- Future MCP API keys bind to tenant, role, scopes, and per-agent rate limits.

---

## Part 3: Core LMS Domains

### 3.1 Course Authoring

MVP authoring supports:

- Courses.
- Sections.
- Lessons.
- Blocks for text, video, image, and quiz content.
- Drag/drop reorder.
- Draft and publish workflow.
- Media upload to tenant-scoped object storage.
- Audit logging for create/update/delete/publish.

Explicitly deferred:

- SCORM/xAPI import.
- AI course generation.
- Branching scenarios.
- Rich Articulate/Rise-style authoring.

### 3.2 Learning Experience

MVP learner experience supports:

- Course player.
- Resume last position.
- Progress tracking.
- Quiz scoring.
- Completion state.
- Certificate PDF generation.

Completion, enrolment, and certificate operations require idempotency and audit logging.

### 3.3 Admin and Analytics

MVP admin analytics include:

- Per-course completion percentage.
- Per-learner progress.
- CSV export.

Custom dashboards, scheduled reports, BI export, engagement heatmaps, and drop-off analysis are Phase 2 or later.

### 3.4 Branding

MVP branding includes:

- Tenant logo.
- Primary colour.
- Custom subdomain.

Custom domains, email white-labelling, and custom CSS are later-phase items.

### 3.5 Billing

MVP billing includes:

- Stripe subscription.
- Per-seat plans.
- Self-serve checkout.
- Plan upgrade/downgrade.
- Plan gating in services and UI so tenants cannot exceed plan limits silently.
- Stripe Tax support for VAT/GST when tax handling is enabled.

Initial pricing hypothesis from the charter:

| Plan | Price | Included Capacity | Notes |
|---|---:|---|---|
| Starter | $49/mo | 3 admin seats, 50 learners, 10 GB video | AI tutor included, OmniXtra branding visible |
| Growth | $149/mo | 10 admin seats, 250 learners, 50 GB video | Custom branding, SSO in Phase 2, priority support |
| Business | $399/mo | 25 admin seats, 1000 learners, 200 GB video | Audit logs, SAML SSO, SCORM import |
| Enterprise | Custom | Contract-defined | DPA, custom contract, dedicated support |

Trial rule: paid plans include a 14-day free trial with no credit card required to start.

Treat these prices and capacities as product hypotheses, not constants to bury deep in code. Plan limits should be data/config driven.

Marketplace, Stripe Connect, revenue share, and invoicing are Phase 3.

---

## Part 4: AI Subsystem

### 4.1 AI Module Structure

```text
app/ai/
|-- graphs/
|   |-- tutor.py
|   |-- semantic_search.py
|   |-- course_authoring.py
|   `-- skills.py
|-- nodes/
|   |-- retriever.py
|   |-- llm_caller.py
|   |-- validator.py
|   `-- citation_extractor.py
|-- prompts/
|-- jobs/
|   `-- graph_runner.py
|-- state.py
`-- config.py
```

Only create Phase 2/3 files when those features begin.

### 4.2 AI Tutor MVP

The MVP tutor is per-course RAG chat:

- Lessons chunked around 500 tokens with 50-token overlap.
- Embeddings stored in pgvector.
- Retrieval scoped by `tenant_id` and `course_id`.
- Hybrid search: vector plus Postgres full-text fallback.
- Re-rank top candidates.
- Stream response over SSE.
- Cite lesson sections used.
- Refuse out-of-course questions.
- Refuse to provide quiz answers verbatim when configured.

### 4.3 LangGraph Design

Tutor graph:

```text
User question
  -> validate scope
  -> embed query
  -> pgvector retrieval filtered by tenant_id/course_id
  -> re-rank top 20 to top 5
  -> LLM answer with citations
  -> confidence check
  -> stream answer or uncertainty notice
```

LangGraph is selected for stateful graphs, streaming, checkpointing, conditional routing, subgraphs, and future human-in-the-loop authoring flows.

### 4.4 AI Verification Workflow

AI outputs that affect published content require human review.

| Status | Meaning |
|---|---|
| `PENDING_REVIEW` | AI output generated and awaiting author review |
| `VERIFIED` | Author accepted unchanged |
| `MODIFIED` | Author edited before accepting |
| `REJECTED` | Author rejected; stored anonymously for evaluation |

AI-generated lessons and quizzes are never auto-published. Tutor responses are exempt because they are live, advisory, and ephemeral.

### 4.5 Cost Controls

Required controls:

- Tenant-scoped semantic cache.
- Cache keys prefixed with `tenant:{id}:ai_cache:*`.
- Tutor answer cache by course and semantic hash.
- Embeddings generated once per lesson version.
- Per-tenant monthly token budget.
- Soft warning at 80%, hard stop at 100%.
- Per-feature token limits.
- AI rate limits by tenant/user/agent.
- Circuit breaker if AI error rate exceeds threshold.
- Fallback cascade: premium model, cheaper model, cached response, friendly degraded message.

### 4.6 AI Observability

- Enable LangSmith tracing for graph executions.
- Track token usage and cost per graph, tenant, model, and time period.
- Keep prompt templates version-controlled.
- Run nightly evals against held-out question/citation sets.
- Alert if eval pass rate drops by more than 5%.

### 4.7 MCP Server, Phase 3

OmniXtra exposes MCP tools only in Phase 3.

Planned tools:

| Tool | Description | Permission |
|---|---|---|
| `search_courses` | Semantic and keyword course search | `courses:read` |
| `get_course_summary` | AI-generated course summary | `courses:read` |
| `get_learner_progress` | Learner progress across courses | `analytics:read` |
| `enrol_learner` | Add learner to a course | `enrolment:write` |
| `generate_report` | Cohort completion report | `analytics:read` |

Security model:

- API key per agent.
- API key binds to tenant and role.
- Tool-level RBAC.
- Per-agent rate limits.
- Every MCP call audit-logged like human actions.
- No MCP bypass of tenant isolation.

---

## Part 5: Security, Privacy, and Compliance

### 5.1 Threat Model

| Threat | Mitigation | Phase |
|---|---|---|
| Cross-tenant leak | Middleware, ORM filter, forced RLS, attack tests | MVP |
| Credential stuffing | Argon2id, login rate limit, HIBP check | MVP |
| Session hijacking | httpOnly Secure SameSite cookies, token rotation | MVP |
| Account takeover | MFA and anomalous-login alerts | Phase 2 |
| IDOR | Tenant scoping plus authorization helper | MVP |
| Prompt injection | Sanitization, prompt isolation, no learner tool calls | MVP |
| Malicious upload | Content type, magic bytes, antivirus scan | MVP |
| DDoS / abuse | Cloudflare, tenant rate limits, AI circuit breakers | MVP |
| XSS in course content | Sanitized rendering and CSP | MVP |
| CSRF | Double-submit cookie | MVP |
| SQL injection | Parameterized ORM queries, no raw SQL | MVP |

### 5.2 Data Protection

- TLS 1.3 everywhere. TLS 1.2 is minimum load-balancer fallback.
- AES-256 at rest for Postgres, object storage, and backups.
- Production secrets live in one secrets manager. Do not use production `.env` files.
- PII minimization: collect only email, name, role, and locale by default.
- Daily backups with 30-day retention.
- Quarterly restore drill.
- structlog redaction processor scrubs sensitive field names such as passwords, tokens, and card data.

### 5.3 Sensitive Data Envelope Pattern

Future sensitive fields use structured envelopes:

```json
{
  "v": 1,
  "alg": "fernet",
  "kid": "primary",
  "ct": "base64ciphertext"
}
```

This preserves migration paths to KMS or Vault without reshaping stored data.

### 5.4 Rate Limiting

Use Redis-backed token buckets with atomic Lua scripts.

| Dimension | Purpose | Starter Default |
|---|---|---|
| Tenant + endpoint class | Noisy-neighbour isolation | 600 req/min on `/ai/*`, 1200 req/min on `/api/v1/*` |
| User + endpoint class | Compromised-token containment | 120 req/min per user on `/ai/*` |
| IP unauthenticated | Login/signup abuse | 20 req/min on auth endpoints |
| MCP agent | External agent containment | 300 req/min default |

429 responses include:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After`

Rate-limit overrides are per plan or tenant and must create audit entries.

### 5.5 Audit Trail

Mutations affecting billing, enrolment, completion, admin actions, auth changes, publishing, role/permission changes, profile changes, or compliance settings require audit logging in the same database transaction as the business change.

Audit records capture:

- Actor: `user_id`, `agent_id`, `tenant_id`
- Action: `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN`, `PUBLISH`, etc.
- Target: `resource_type`, `resource_id`
- Context: `request_id`, IP address, user agent, timestamp
- Diff: old/new JSON for updates

Application role may INSERT and SELECT audit rows only. It must not UPDATE or DELETE audit rows.

Security-sensitive audit events are streamed to WORM object storage:

- Object Lock compliance mode.
- Seven-year retention.
- HMAC-signed batches.
- Tenant/day partitioning: `audit/{tenant_id}/{YYYY-MM-DD}/{batch}.jsonl.gz`.
- Nightly HMAC-chain verification.
- Quarterly restore/reconcile drill.

Retention and erasure rules:

- Live `audit_log` table retains 2 years for query performance.
- WORM audit storage retains 7 years for compliance evidence.
- GDPR erasure does not mean deleting audit history. User identifiers are anonymized or replaced with deterministic tombstones while preserving the audit trail.

### 5.6 GDPR and Compliance

From MVP:

- Tenant data export endpoint.
- Account deletion within 30 days.
- DPA available on request.
- Published sub-processor list.
- SCC disclosure for US-hosted EU customers.

Phase 3:

- SOC 2 Type 1 prep and audit.
- Audit log export.
- GDPR DPA template formalization.

Accessibility baseline is WCAG 2.1 AA from MVP, with audit at end of Phase 2.

### 5.7 Data Residency

MVP:

- Single production region in US East.
- Postgres, Redis, object storage, and email logs live in US East.
- EU customers may accept US hosting under SCCs.

Phase 2:

- Isolated EU deployment in Frankfurt or Dublin.
- Separate Postgres, Redis, object storage, and where required Stripe account.
- Tenant region chosen at creation and immutable.
- No tenant content, PII, or audit logs cross regions.
- Only anonymized aggregate metrics may cross by allow-listed pipeline.

Phase 3:

- Add UK, APAC, Canada, or other regions only with customer commitment.
- No active-active multi-region tenant deployment.

---

## Part 6: Frontend Architecture

### 6.1 Project Structure

Expected `web/` shape:

```text
web/
|-- src/
|   |-- app/
|   |-- components/
|   |   |-- ui/
|   |   `-- domain/
|   |-- features/
|   |-- lib/
|   |-- hooks/
|   |-- schemas/
|   |-- stores/
|   `-- types/
|-- e2e/
`-- tests/
```

### 6.2 Frontend Principles

- Build the actual LMS workflow, not marketing shells, unless the sprint explicitly calls for marketing.
- Use dense, clear, operational UI for admins.
- Learner experience should be focused, calm, and low-friction.
- Role-based UI visibility is helpful, but backend authorization remains mandatory.
- Use loading, empty, error, disabled, and optimistic states deliberately.
- Validate forms with Zod.
- Keep API response parsing at the boundary.
- Keep tenant branding tokenized.

### 6.3 Key MVP Pages

- Signup and tenant creation.
- Login and magic link flow.
- Tenant onboarding wizard.
- Admin dashboard.
- Course list.
- Course builder.
- Lesson editor.
- Media upload.
- Learner course catalog/enrolments.
- Course player.
- Quiz view.
- Certificate download.
- AI tutor chat panel.
- Learner progress report.
- Branding settings.
- Billing/plan page.

---

## Part 7: Environment Variables

Use `.env.example` for local defaults. Production secrets must live in a secrets manager.

```bash
# Application
APP_ENV=local
APP_NAME=omnixtra
API_BASE_URL=http://localhost:8000
WEB_BASE_URL=http://localhost:3000
PUBLIC_ROOT_DOMAIN=omnixtra.localhost

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/omnixtra
MIGRATION_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/omnixtra

# Redis
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET_KEY=change-me
JWT_REFRESH_SECRET_KEY=change-me
MAGIC_LINK_SECRET=change-me
COOKIE_DOMAIN=localhost

# Tenant
RESERVED_SUBDOMAINS=www,app,api,admin,status,docs,blog,mail

# Security
CSRF_SECRET=change-me
RATE_LIMIT_ENABLED=true

# Storage
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
OBJECT_STORAGE_BUCKET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=no-reply@omnixtra.app

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEFAULT_LLM_PROVIDER=openai
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
AI_MONTHLY_BUDGET_DEFAULT_USD=50

# LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=omnixtra

# Observability
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Part 8: Implementation Sprints

The charter labels the MVP as a 10-week schedule, but its S0-S5 sprint table implies six two-week sprints, or 12 weeks. This `AGENTS.md` treats the delivery plan as six two-week sprints unless the charter is amended.

### Tracking Rules

- This section is the implementation tracker and single source of truth for sprint progress.
- Mark a task `- [x]` only after the implementation exists in the workspace and has passed the relevant verification for that task.
- Keep incomplete, blocked, deferred, or partially implemented work as `- [ ]`.
- When completing a task, add or update the related tests in the same change whenever the Definition of Done requires them.
- Update the sprint status table whenever a task changes state.
- A checkbox may only be marked complete when its verification can be reproduced by a fresh clone running documented commands.

### Sprint Status Summary

| Sprint / Phase | Status | Completed | Notes |
|---|---|---:|---|
| Sprint 0: Pre-flight Foundations | Complete | 18 / 18 | Core repo, backend/frontend scaffolds, local and remote Git history, Docker services, DevContainer workflow, CI, lint/type/test gates, logging, request context, health, envelope, typed errors, and ADR docs are in place. |
| Sprint 1: Tenancy & Auth | Complete | 17 / 17 | Tenant middleware, RLS, auth flows, Org Admin/Learner RBAC defaults, migration guard, RLS benchmark, real route attack tests, recorded-hit isolation coverage gate, cookie auth, refresh-token rotation, replay detection, logout invalidation, verification endpoints, and auth rate limiting are in place. |
| Sprint 2: Course Authoring | Complete | 11 / 11 | Course authoring backend, media metadata, route coverage declarations, migration smoke, real route-level attack tests, admin course list, and course builder foundation are in place. |
| Sprint 3: Learning Experience | Complete | 11 / 11 | Learning backend, idempotent learner workflows, real route-level attack tests, learner course player, quiz/completion UI, and certificate PDF download workflow are in place. |
| Sprint 4: AI Tutor | Complete | 17 / 17 | Provider-backed tutor jobs, provider-failure handling, embedding-provider provenance, hybrid retrieval SQL, Redis Pub/Sub job streaming, LangSmith wrapper, vector isolation coverage, route attack tests, actor-path cache reuse coverage, tutor UI, and recorded OpenAI 20-question eval evidence are in place. |
| Sprint 5: Billing, Branding, Analytics, and MVP Polish | Complete | 15 / 15 | Sprint 5 audit remediation is complete: unsigned billing webhook removed, signed Stripe webhook negative tests and signed-path coverage added, CSV cells neutralized, Sprint 5 smoke specs pass, and Docker-backed integration suite passes against PostgreSQL 16 + pgvector with RLS. |
| MVP Readiness Remediation | In progress | 3 / 6 | AI tutor tenant/user rate limits, monthly token budget reservation, and env settings are implemented; frontend journey coverage, manual readiness evidence, and local integration rerun hardening remain. |
| Phase 2: Months 4-6 | Not started | 0 / 11 | Post-MVP expansion. |
| Phase 3: Months 7-9 | Not started | 0 / 9 | Post-MVP platform/compliance expansion. |

### Definition of Done, All Sprints

- Code passes Ruff, mypy strict, ESLint, TypeScript strict, and tests.
- API endpoints appear in generated OpenAPI.
- Unit and integration tests cover changed code.
- Tenant isolation tests exist for tenant-owned routes.
- Audit logging applies where required.
- No sensitive data appears in logs, errors, responses, traces, or AI prompts.
- Structured logs include `request_id` and `tenant_id`.
- Migrations are reversible.
- API responses follow the standard envelope.
- PR checklist is complete.

### Sprint 0: Pre-flight Foundations, Weeks 1-2

- [x] Initialize monorepo structure with `api/` and `web/`.
- [x] Repair or initialize Git repository metadata.
- [x] Add root `.gitignore` for Python, Node, environment, build, editor, and OS artifacts.
- [x] Add root `README.md` with local setup, development commands, and project status.
- [x] Establish initial commit after Sprint 0 scaffold is reproducible.
- [x] Configure Git remote origin for hosted repository.
- [x] Push `main` and verify remote CI run visibility.
- [x] Configure backend Python 3.12, `uv`, Ruff, mypy strict, pytest.
- [x] Configure frontend Next.js App Router, TypeScript strict, TailwindCSS, shadcn/ui, ESLint, Prettier.
- [x] Add DevContainer and Docker Compose migration path for API, worker, PostgreSQL 16 + pgvector, Redis 7.
- [x] Add health checks and `depends_on: condition: service_healthy`.
- [x] Add `.env.example` with local defaults.
- [x] Add CI for backend lint/type/test, frontend lint/type/test, real PostgreSQL/Redis integration tests, and migration smoke.
- [x] Add structlog JSON logging with redaction foundation.
- [x] Add request ID middleware.
- [x] Add OpenTelemetry and Sentry scaffolding.
- [x] Add base response envelope and typed error hierarchy.
- [x] Add ADR folder and move/convert root ADR when project docs are formalized.

**Exit criteria:** `docker compose up` boots cleanly, health smoke test passes, CI green.

### Sprint 1: Tenancy & Auth, Weeks 3-4

#### Sprint 1 Subtask Tracker

| Parent Task | Subtask | Status |
|---|---|---|
| Create database roles | Add local Postgres init SQL for `omnixtra_app`, `omnixtra_migrations`, and `omnixtra_superadmin` | Complete |
| Create database roles | Wire local init SQL into Docker Compose | Complete |
| Create database roles | Verify roles in disposable Docker smoke database | Complete |
| Per-cursor RLS tenant variable | Add SQLAlchemy engine event hook | Complete |
| Per-cursor RLS tenant variable | Set `app.current_tenant_id` before every cursor execution when tenant context exists | Complete |
| Per-cursor RLS tenant variable | Clear `app.current_tenant_id` before every cursor execution when no tenant context exists | Complete |
| RLS migration helper | Add reusable Alembic helper for tenant-owned table RLS policies | Complete |
| RLS migration helper | Add first tenant-owned table using the helper | Complete |
| CI RLS check | Add script that detects tenant-owned migrations missing the helper | Complete |
| RLS tests | Add static/helper tests for RLS helper and migration guard | Complete |
| ORM tenant filter | Add grep-able tenant-filter bypass execution option | Complete |
| ORM tenant filter | Inject tenant predicate for tenant-owned SELECT queries | Complete |
| ORM tenant filter | Inject tenant predicate for tenant-owned UPDATE and DELETE statements | Complete |
| ORM tenant inserts | Auto-populate `tenant_id` on new tenant-owned ORM objects | Complete |
| ORM tenant tests | Add unit tests for SELECT/UPDATE/DELETE filtering and INSERT population | Complete |
| RLS integration tests | Make Alembic use the migration database role URL | Complete |
| RLS integration tests | Add disposable-Postgres raw SQL last-defence test | Complete |
| Isolation coverage gate | Add `@covers_isolation(method, path)` pytest decorator | Complete |
| Isolation coverage gate | Add OpenAPI route inventory comparison script | Complete |
| Isolation coverage gate | Wire route coverage script into CI | Complete |
| Isolation attack tests | Replace decorator-only route tests with real cross-tenant route attacks | Complete |
| Auth foundation | Add Argon2id password hashing utilities | Complete |
| Auth foundation | Add user and auth-token models/migrations with tenant ownership | Complete |
| Auth foundation | Add signup and login schemas/services/routes | Complete |
| Auth foundation | Add magic-link and password-reset request schemas/services/routes | Complete |
| Auth hardening | Store JWT access and refresh tokens in httpOnly Secure SameSite cookies | Complete |
| Auth hardening | Add refresh-token rotation, replay detection, and logout invalidation | Complete |
| Auth hardening | Add magic-link verification and password-reset completion endpoints | Complete |
| Auth hardening | Add login/signup/password-reset rate limiting | Complete |
| RBAC foundation | Add Org Admin and Learner role enum/defaults | Complete |
| Auth tests | Add tests for password hashing, schemas, roles, and auth token flow | Complete |
| RLS benchmark | Add synthetic dataset benchmark script | Complete |
| RLS benchmark | Compare tenant-scoped RLS table reads with equivalent non-RLS table reads | Complete |
| RLS benchmark | Document local benchmark command and approximate threshold | Complete |
| RLS benchmark | Run benchmark smoke on disposable Postgres | Complete |

- [x] Implement tenant model and global tenant table.
- [x] Create database roles: `omnixtra_app`, `omnixtra_migrations`, `omnixtra_superadmin`.
- [x] Implement tenant resolver for subdomains and authenticated principal claims.
- [x] Implement request-scoped tenant context with fail-closed accessor.
- [x] Implement SQLAlchemy tenant-owned base model.
- [x] Implement ORM query filter for tenant-owned SELECT/UPDATE/DELETE.
- [x] Auto-populate `tenant_id` on tenant-owned INSERT.
- [x] Implement per-cursor RLS tenant variable set/clear.
- [x] Implement RLS migration helper and first tenant-owned table.
- [x] Add CI check for tenant-owned migrations missing RLS helper.
- [x] Implement signup, login, magic link, password reset.
- [x] Implement Org Admin and Learner roles.
- [x] Seed RBAC defaults.
- [x] Add real cross-tenant isolation suite and OpenAPI coverage gate.
- [x] Add RLS-as-last-defence raw SQL test running in CI against `omnixtra_app`.
- [x] Add runbook for adding tenant-owned tables.
- [x] Benchmark RLS overhead on synthetic data.

**Exit criteria:** two tenants cannot read, write, list, search, or infer each other's resources; RLS-last-defence test passes.

### Sprint 2: Course Authoring, Weeks 5-6

#### Sprint 2 Subtask Tracker

| Parent Task | Subtask | Status |
|---|---|---|
| Courses module | Add backend `courses` package exports | Complete |
| Course models | Add course, section, lesson, content block, and audit event models | Complete |
| Course migrations | Add tenant-owned tables with RLS helpers and grants | Complete |
| Course schemas | Add text, video, image, and quiz block schemas | Complete |
| Course services | Add course CRUD repositories and services | Complete |
| Course services | Add deterministic section reorder without transient position collisions | Complete |
| Course services | Add cursor pagination for course lists | Complete |
| Course services | Add draft-to-publish workflow validation | Complete |
| Course routes | Add protected course-authoring API routes under `/api/v1/courses` | Complete |
| Course audit | Record create/update/delete/publish audit events | Complete |
| Course tests | Add model/schema/repository/service/route tests | Complete |
| Course tests | Add isolation coverage declarations for all course-owned routes | Complete |
| Course tests | Add real cross-tenant route attack tests for course APIs | Complete |
| Media metadata | Add tenant-scoped media object metadata model and API hooks | Complete |
| Admin frontend | Add functional admin course list foundation | Complete |
| Admin frontend | Add functional course builder foundation | Complete |

- [x] Create `courses` module.
- [x] Implement course, section, lesson, and content block models.
- [x] Implement text, video, image, and quiz block schemas.
- [x] Implement CRUD repositories and services.
- [x] Implement drag/drop reorder with deterministic ordering.
- [x] Implement draft to publish workflow.
- [x] Implement media upload metadata with tenant-scoped object keys.
- [x] Add audit logs for create/update/delete/publish.
- [x] Add cursor pagination for course lists.
- [x] Add real isolation tests for all course-owned routes.
- [x] Add functional admin frontend course list and builder foundation.

**Exit criteria:** an Org Admin can build and publish a five-lesson course with full audit trail.

### Sprint 3: Learning Experience, Weeks 7-8

#### Sprint 3 Subtask Tracker

| Parent Task | Subtask | Status |
|---|---|---|
| Learning module | Add backend `learning` package exports | Complete |
| Learning models | Add enrolment, lesson progress, quiz attempt, completion, and certificate models | Complete |
| Learning migrations | Add tenant-owned learning tables with RLS helpers and grants | Complete |
| Learning schemas | Add enrolment, player, progress, quiz, completion, and certificate schemas | Complete |
| Learning services | Add idempotent enrolment service | Complete |
| Learning services | Add course player outline service | Complete |
| Learning services | Add lesson resume/progress service | Complete |
| Learning services | Add quiz scoring service | Complete |
| Learning services | Add course completion and certificate service | Complete |
| Learning routes | Add protected learning API routes under `/api/v1/learning` | Complete |
| Learning tests | Add model/schema/service/route tests and isolation coverage declarations | Complete |
| Learning tests | Add real cross-tenant route attack tests for learning APIs | Complete |
| Learner frontend | Add functional learner course player foundation | Complete |
| Learner frontend | Add functional quiz and completion UI foundation | Complete |

- [x] Create `learning` module.
- [x] Implement enrolments.
- [x] Implement course player API.
- [x] Implement lesson resume/progress tracking.
- [x] Implement quiz scoring.
- [x] Implement course completion rules.
- [x] Implement certificate PDF download workflow.
- [x] Add idempotency for enrolment, completion, and certificate issuance.
- [x] Add functional learner frontend course player.
- [x] Add functional quiz and completion UI.
- [x] Add real isolation tests for enrolments, progress, and certificates.

**Exit criteria:** learner can enrol, resume, complete a course, pass quiz flow, and download certificate; idempotency is tested.

### Sprint 4: AI Tutor, Weeks 9-10

#### Sprint 4 Subtask Tracker

| Parent Task | Subtask | Status |
|---|---|---|
| AI module | Add MVP `ai` package exports and module structure | Complete |
| AI content | Add lesson chunking by lesson version | Complete |
| AI storage | Add embeddings, conversations, messages, and tutor jobs models | Complete |
| AI migrations | Add tenant-owned AI tables with RLS helpers, pgvector, HNSW, and compound indexes | Complete |
| AI jobs | Add async tutor job enqueue foundation | Complete |
| AI jobs | Add Dramatiq embedding and tutor execution workers | Complete |
| AI jobs | Mark tutor jobs failed and publish failed SSE events on provider errors | Complete |
| AI retrieval | Add tenant/course-scoped retrieval repository foundation | Complete |
| AI retrieval | Add true hybrid vector plus Postgres full-text retrieval | Complete |
| AI graph | Add tutor graph orchestration skeleton | Complete |
| AI graph | Wire provider-backed LangGraph tutor execution | Complete |
| AI providers | Add OpenAI and Anthropic provider abstraction | Complete |
| AI providers | Implement provider-backed LLM and embedding calls with mocked tests | Complete |
| AI providers | Select provider at tutor job runtime with explicit advisory fallback | Complete |
| AI providers | Persist and stream tutor provider/advisory metadata | Complete |
| AI storage | Add embedding-provider provenance and retrieval filter | Complete |
| AI jobs | Add maintenance actor for provider-change re-embedding | Complete |
| AI streaming | Add tenant-scoped SSE event route foundation | Complete |
| AI streaming | Wire Redis Pub/Sub fanout for tutor jobs | Complete |
| AI conversations | Add conversation history service | Complete |
| AI cache | Add tenant/course semantic cache foundation | Complete |
| AI cache | Verify repeated tutor question reuses semantic cache without provider call | Complete |
| AI citations | Add citation extraction from retrieved chunks | Complete |
| AI guardrails | Add scope refusal and quiz-answer guardrail | Complete |
| AI observability | Add trace metadata and eval dataset scaffold | Complete |
| AI observability | Wire LangSmith tracing for tutor graph runs | Complete |
| AI observability | Run recorded 20-question tutor eval against a real provider | Complete |
| Tutor frontend | Add functional tutor UI panel in learner course player | Complete |
| Tutor frontend | Add functional tutor route/component wired to job SSE | Complete |
| AI tests | Add route isolation declarations and retrieval scope tests | Complete |
| AI tests | Add live cross-tenant vector retrieval integration tests | Complete |
| AI tests | Add prompt-injection regression tests | Complete |

- [x] Create MVP `ai` module structure.
- [x] Implement lesson chunking by lesson version.
- [x] Add embeddings table with pgvector and tenant/course scope.
- [x] Add HNSW index and compound tenant/course indexes.
- [x] Implement embedding worker.
- [x] Implement hybrid retrieval.
- [x] Implement provider-backed LangGraph tutor graph.
- [x] Implement provider abstraction for OpenAI and Anthropic.
- [x] Implement provider-backed LLM and embedding calls.
- [x] Implement SSE streaming via Redis Pub/Sub.
- [x] Implement conversation history.
- [x] Implement semantic cache.
- [x] Implement citation extraction.
- [x] Implement scope refusal and quiz-answer guardrail.
- [x] Run verified 20-question tutor eval against a real provider.
- [x] Add repeat-query cache-rate measurement.
- [x] Add functional tutor UI panel in learner course player.
- [x] Wire tutor UI to API job creation and Redis-backed SSE events.
- [x] Add cross-tenant vector retrieval tests.
- [x] Add prompt-injection regression tests.

**Exit criteria:** tutor answers with citations on a 20-question eval set; repeat-query cache hit rate exceeds 40%; no AI work blocks HTTP handlers. The recorded OpenAI eval at `docs/runbooks/ai-tutor-eval-latest.json` passed 20 / 20 with `advisory=false`, `errors=[]`, and `pass_rate=1.0`; this evidence is a local key-backed run and is not reproducible from a fresh clone without a real provider key. Repeat-query cache behavior is covered by `test_tutor_actor_reuses_semantic_cache_without_provider_call`, which proves a second identical tutor job uses the semantic cache and skips the provider call.

### Sprint 5: Billing, Branding, Analytics, and MVP Polish, Weeks 11-12

#### Sprint 5 Subtask Tracker

| Parent Task | Subtask | Status |
|---|---|---|
| Billing module | Add backend `billing` package exports | Complete |
| Billing models | Add data-driven billing plan and tenant subscription models | Complete |
| Billing migrations | Add plan, subscription, and billing audit tables | Complete |
| Billing migrations | Seed MVP pricing hypotheses as plan rows | Complete |
| Billing services | Add plan catalog and current subscription services | Complete |
| Billing services | Add Stripe checkout provider port with local/mock implementation | Complete |
| Billing services | Add subscription webhook sync foundation | Complete |
| Billing routes | Add protected billing API routes under `/api/v1/billing` | Complete |
| Billing tests | Add model response, route registration, and isolation coverage tests | Complete |
| Billing provider | Implement signed Stripe checkout session creation | Complete |
| Billing provider | Verify Stripe webhook signatures and event mapping | Complete |
| Billing provider | Remove unsigned subscription webhook duplicate | Complete |
| Billing provider | Add negative Stripe signature verification tests | Complete |
| Billing provider | Add plan upgrade/downgrade subscription change flow | Complete |
| Plan limits | Enforce learner and storage limits in domain services | Complete |
| Plan limits | Enforce admin-seat limits on Org Admin invitations | Complete |
| Tenant branding | Add current tenant branding API with audit logging | Complete |
| Tenant branding | Apply tenant name, logo, primary colour, and locale to web shell | Complete |
| Admin users | Add tenant-scoped learner/admin invitation endpoint with audit logging | Complete |
| Admin analytics | Add per-course completion analytics API and dashboard | Complete |
| Admin reports | Add per-learner progress report API and dashboard table | Complete |
| Admin reports | Add learner progress CSV export | Complete |
| Admin reports | Neutralize formula-leading CSV cells | Complete |
| Notifications | Add Resend transactional email provider and auth token emails | Complete |
| Onboarding | Add self-serve onboarding wizard | Complete |
| Pricing | Add pricing page backed by the plan catalog with fallback hypotheses | Complete |
| Observability | Add Sentry/OTel dashboard runbook | Complete |
| Playwright | Add and run Sprint 5 critical-path smoke specs | Complete |

- [x] Create `billing` module.
- [x] Implement Stripe checkout.
- [x] Implement subscription webhook handling.
- [x] Implement plan upgrade/downgrade.
- [x] Implement per-seat plan limits.
- [x] Implement tenant branding settings.
- [x] Apply branding to web app.
- [x] Implement completion analytics.
- [x] Implement per-learner progress report.
- [x] Implement CSV export.
- [x] Implement transactional email through Resend.
- [x] Implement onboarding wizard.
- [x] Implement marketing/pricing page only as needed for self-serve checkout.
- [x] Finalize Sentry/OTel dashboards.
- [x] Run critical-path Playwright tests.

**Exit criteria:** first design partner can sign up, pay, brand tenant, create course, invite learner, complete course, use tutor, and view progress. Sprint 5 audit identified and remediated the unsigned billing webhook P0 by deleting `POST /api/v1/billing/webhooks/stripe/subscription`; signed webhook failure tests, signed-path coverage, and CSV formula neutralization are in place. Verification passed with Ruff, mypy strict, backend non-integration tests, Docker-backed integration tests against PostgreSQL 16 + pgvector with RLS, frontend lint/type/unit tests, and Sprint 5 Playwright smoke specs. Isolation coverage only enforces `tenant-owned`-tagged routes, so any route that sets tenant context from request data must be protected by a signature check or be tenant-owned and permission-gated.

### MVP Readiness Remediation

- [x] Add Redis-backed AI tutor request limits by tenant and learner.
- [x] Add Redis-backed per-tenant monthly AI token budget reservation with warning metadata.
- [x] Expose AI limit settings in `.env.example`.
- [ ] Expand frontend tests to cover the named MVP journeys in Part 9.
- [ ] Execute and record the manual MVP verification checklist in Part 9.
- [ ] Make Docker-backed integration tests clean-rerun friendly against a reused local database.

**Exit criteria:** CI remains green, AI tutor abuse/cost controls are enforced before provider work is queued, required frontend journeys map to Part 9, manual readiness evidence is recorded under `docs/runbooks/`, and local Docker-backed verification can be rerun without rebuilding the database from scratch.

### Phase 2: Months 4-6

- [ ] SSO with SAML 2.0 and OIDC.
- [ ] Audit log export.
- [ ] Advanced analytics.
- [ ] SCORM 1.2 import.
- [ ] xAPI statements.
- [ ] Discussion forums.
- [ ] AI-assisted course authoring with verification workflow.
- [ ] Zoom/Google Meet live-class integration.
- [ ] Custom domains.
- [ ] EU regional deployment option.
- [ ] Accessibility audit.

### Phase 3: Months 7-9

- [ ] Course marketplace foundation.
- [ ] Stripe Connect.
- [ ] Public course pages.
- [ ] MCP server for external AI agent access.
- [ ] Agentic AI skills through LangGraph and MCP tools.
- [ ] SOC 2 Type 1 audit period.
- [ ] Audit WORM export and compliance evidence workflow.
- [ ] Mobile PWA polish.
- [ ] Additional regions only with committed demand.

---

## Part 9: Verification Plan

### Automated Tests

```bash
# Backend
cd api
uv run pytest
uv run pytest tests/isolation -v
uv run ruff check .
uv run ruff format --check .
uv run mypy app --strict

# Frontend
cd web
npm test
npm run lint
npm run typecheck
npx playwright test
```

### Required Backend Test Suites

| File / Suite | Coverage |
|---|---|
| `tests/test_health.py` | Health checks and app boot |
| `tests/tenancy/test_resolver.py` | Subdomain, reserved slugs, 404 behavior |
| `tests/tenancy/test_rls.py` | RLS helper, raw SQL last-defence |
| `tests/isolation/` | Cross-tenant attack tests per route |
| `tests/auth/` | Signup, login, magic link, password reset |
| `tests/rbac/` | Org Admin and Learner permissions |
| `tests/courses/` | Course/section/lesson/block CRUD and publish |
| `tests/learning/` | Enrolment, progress, quiz scoring, certificates |
| `tests/ai/` | Retrieval, tutor graph, citations, guardrails |
| `tests/billing/` | Stripe checkout, webhooks, idempotency |
| `tests/audit/` | Transactional audit entries and append-only constraints |
| `tests/rate_limit/` | Token bucket behavior and tenant isolation |

### Required Frontend Test Suites

| File / Suite | Coverage |
|---|---|
| `web/tests/auth.test.tsx` | Login/signup UI and validation |
| `web/tests/course-builder.test.tsx` | Course builder forms and state |
| `web/tests/course-player.test.tsx` | Player, progress, quiz states |
| `web/tests/tutor.test.tsx` | SSE tutor UI states |
| `web/tests/branding.test.tsx` | Tenant theme application |
| `web/e2e/signup-to-course.spec.ts` | Signup to published course |
| `web/e2e/learner-completion.spec.ts` | Learner completion and certificate |
| `web/e2e/admin-reporting.spec.ts` | Progress report and CSV export |

### Manual Verification Checklist

1. Create Tenant A and Tenant B.
2. Authenticate as Tenant B and attempt to access Tenant A resources by known IDs.
3. Confirm all cross-tenant attempts return indistinguishable `404`.
4. Query through app role raw SQL with no tenant context and confirm zero tenant rows.
5. Publish a course with text, video, image, and quiz lessons.
6. Enrol a learner, resume progress, complete the course, and download a certificate.
7. Ask the tutor course-scoped questions and confirm citations.
8. Ask the tutor out-of-scope and quiz-answer questions and confirm guardrails.
9. Verify audit records for publishing, enrolment, completion, billing, and admin changes.
10. Verify logs contain `request_id` and `tenant_id` but no sensitive data.
11. Exhaust a tenant AI rate limit and confirm another tenant is unaffected.
12. Run frontend on mobile, tablet, and desktop widths for no layout breakage.

### Pull Request Checklist

- [ ] Tenant-safe queries and storage paths.
- [ ] RBAC enforced on all new endpoints.
- [ ] Cross-tenant isolation tests added for tenant-owned routes.
- [ ] Tests added or updated for changed code.
- [ ] No sensitive data in logs, errors, responses, traces, or AI prompts.
- [ ] Logs use structured format with `request_id` and `tenant_id`.
- [ ] All types fully defined, no `Any`/`any` without justified exception.
- [ ] No dead code or commented-out blocks.
- [ ] Database migrations are reversible.
- [ ] Tenant-owned migrations enable and force RLS.
- [ ] API response follows standard envelope.
- [ ] Cursor pagination used for list endpoints.
- [ ] `Idempotency-Key` supported where required.
- [ ] Audit log written in the same transaction where required.

---

## Design Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D-001 | Architecture | Modular monolith | Lower cognitive and operational load; extraction possible later |
| D-002 | Tenancy | Shared DB/schema plus 3-layer isolation | Best fit for SMB self-serve; RLS protects against application bugs |
| D-003 | Jobs | Dramatiq with Redis | Simpler and reliable versus Celery for MVP |
| D-004 | Vector store | pgvector | Avoids extra datastore until scale demands one |
| D-005 | Hosting | Fly.io/Railway, Vercel, Neon/Supabase | Operationally feasible solo; portable later |
| D-006 | Video | Mux or Cloudflare Stream | Avoid DIY encoding and adaptive bitrate |
| D-007 | Mobile | PWA only | Native apps deferred until DAU justifies cost |
| D-008 | SCORM/xAPI | Phase 2 | Not required for first SMB design partners |
| D-009 | Live classes | Zoom/Meet first | Avoid building video conferencing product |
| D-010 | Marketplace | Phase 3 | Payments/compliance complexity deferred |
| D-011 | AI orchestration | LangGraph | Stateful graphs, streaming, HITL, checkpointing |
| D-012 | AI observability | LangSmith | Tracing, evals, prompt versions, cost dashboards |
| D-013 | External AI access | MCP server in Phase 3 | Tenant-scoped standard tool access |
| D-014 | Real-time | SSE first | Simpler than WebSockets for one-way streams |
| D-015 | Audit consistency | Transactional outbox | Business mutation and audit record commit together |
| D-016 | Sensitive fields | Structured encryption envelopes | Future-compatible with KMS migration |
| D-017 | Package management | uv | Fast, lockfile-first Python workflow |
| D-018 | API contract | `{data,error,meta}` envelope | Consistent REST and future MCP shape |
| D-019 | Rate limits | Redis token bucket by tenant | Burst-friendly and noisy-neighbour resistant |
| D-020 | Audit immutability | WORM storage for sensitive events | Tamper-evident compliance evidence |
| D-021 | Encryption | AES-256 at rest | Auditor-friendly SOC 2 evidence |
| D-022 | Isolation testing | Zero-trust per-endpoint tests | Assumes any tenant token may be compromised |
| D-023 | Residency | US MVP, EU Phase 2 | Avoid premature multi-region cost while preserving path |
| D-024 | MVP auth token transport | Bearer JWT returned in response body until auth hardening | Accepted only for current MVP skeleton; httpOnly Secure SameSite cookie access/refresh sessions must be revisited before Phase 2. |
| D-025 | RLS tenant variable scope | Transaction-local `set_config(..., true)` before each cursor execution | Self-resets on transaction end and reduces pooled-connection tenant bleed risk. |
| D-026 | AI provider runtime | Worker-selected provider with advisory fallback and embedding provenance | Keeps HTTP handlers non-blocking, makes degraded mode explicit, and prevents retrieval from comparing query vectors against embeddings from a different provider. |

---

## References

### Root Source Documents

- `OmniXtra_Project_Charter_v1.2.docx` - Product, architecture, delivery, security, sprint, and decision source of truth.
- `docs/adr/ADR-002_Multi-Tenant_Isolation.md` - Controlling decision record for tenant isolation enforcement, RLS, database roles, bypass discipline, and testing.
- `docs/adr/ADR-002_Multi-Tenant_Isolation.docx` - Original ADR-002 source artifact.

### Future Documentation Locations

- `docs/adr/` - Architecture Decision Records.
- `docs/runbooks/` - Operational runbooks.
- `docs/architecture/` - Mermaid architecture diagrams.
- `api/app/` - Backend application.
- `web/` - Frontend application.

### Required Future Runbooks

- Adding a tenant-owned table.
- Database failover.
- Redis outage.
- Stripe webhook backlog.
- Abuse/rate-limit incident.
- AI cost spike.
- Customer data export.
- Customer deletion/anonymisation.
- Audit WORM restore drill.
- Regional tenant provisioning.
