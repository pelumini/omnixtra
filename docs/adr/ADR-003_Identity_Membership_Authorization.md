# ADR-003: Identity, Membership & Authorization

**Status**: Accepted  
**Date**: 2026-05-26  
**Related**: Charter sections 5-6, ADR-002, Decision Log D-002

## Decision

OmniXtra uses a three-plane model:

- Authentication: tenant-owned `users` answer who can log in.
- Membership: tenant-owned `memberships` answer which tenant a user belongs to and whether their org role is `tenant_admin` or `member`.
- Course authorization: tenant-owned `enrolments` answer what a user can do in one specific course through `course_owner`, `facilitator`, or `learner`.

Accepted decisions D-A through D-G:

- D-A: identity remains tenant-scoped for MVP.
- D-B: org roles are exactly `tenant_admin` and `member`.
- D-C: course roles live on enrolments, never on users or memberships.
- D-D: authorization checks named permissions, never role-string equality.
- D-E: identity plane is built in-house for MVP behind clean internal boundaries.
- D-F: duplicate invitations for an existing tenant member are idempotent no-ops.
- D-G: `users` and `memberships` remain separate tables from day one.

## Consequences

The broad `/api/v1/auth/signup` route is retired. Organization creation uses `POST /api/v1/tenants`; ordinary users join by invitation through `POST /api/v1/auth/invitations/accept`.

Tenant isolation remains governed by ADR-002. `memberships`, `invitations`, and `enrolments` are tenant-owned and require RLS plus route-level isolation coverage.
