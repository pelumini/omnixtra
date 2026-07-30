# ADR-002: Multi-Tenant Isolation

Status: Proposed, awaiting sign-off

Date: 16 May 2026

Related: Charter sections 6, 6.7, 9.5; Decision Log D-002, D-022

Implements in: Sprint 1, Weeks 3-4

## Context

OmniXtra uses a shared-database, shared-schema multi-tenant model with `tenant_id` discrimination. This ADR controls how tenant isolation is enforced for application code, database access, migrations, tests, and approved bypass paths.

## Decision

Tenant isolation is enforced at three independent, fail-closed layers:

1. Request context: middleware resolves the active tenant and binds it to request scope.
2. ORM query filter: SQLAlchemy injects tenant predicates for tenant-owned models and auto-populates `tenant_id` on inserts.
3. PostgreSQL RLS: forced row-level security compares row `tenant_id` to a session-local tenant variable.

Application runtime connections must never use a database role with `BYPASSRLS`.

## Database Roles

| Role | Used By | RLS | Rule |
|---|---|---|---|
| `omnixtra_app` | FastAPI runtime and workers | Enforced | Default application role. No `BYPASSRLS`. |
| `omnixtra_migrations` | Alembic | Enforced | Data migrations touching tenant rows set tenant context explicitly per batch. |
| `omnixtra_superadmin` | Internal support tooling only | Bypassed | Separate read-only connection, externally audit logged, never used by app runtime. |

## Tenant-Owned vs Global Tables

Tenant-owned tables carry `tenant_id`, inherit tenant-scoped ORM behavior, enable and force RLS, and require isolation tests.

Global tables are limited to tenants, plan/pricing reference data, system configuration, and system-level audit logs.

## Bypass Discipline

Any tenant-isolation bypass must be explicit, named, grep-able, reviewed, and covered by CI enforcement. Bypass is not allowed for analytics, debugging, support convenience, or quick fixes in application code.

## Open Sign-Off Items Before Deep Sprint 1 Work

- Decide whether `omnixtra_superadmin` has full read access or only redacted read access.
- Confirm tenant deletion policy. Current recommendation: soft delete immediately, scheduled hard delete after 30 days.
- Confirm the RLS benchmark target and index strategy. Current target: roughly under 5% isolation overhead.
- Confirm future marketplace cross-tenant visibility is handled by a separate ADR and custom RLS policies.

## Source Artifact

The original Word document is stored next to this file as `ADR-002_Multi-Tenant_Isolation.docx`.
