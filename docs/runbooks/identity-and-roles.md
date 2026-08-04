# Identity And Roles Runbook

## Three Planes

OmniXtra separates identity, membership, and course authorization.

| Plane | Table | Answers |
|---|---|---|
| Authentication | `users` | Who is this person, and can they log in? |
| Membership | `memberships` | Which tenant do they belong to, and what org role do they have? |
| Course | `enrolments` | What can they do in this specific course? |

## Organization Creation

`POST /api/v1/tenants` creates:

- one tenant;
- one first user;
- one `tenant_admin` membership;
- one refresh session.

This replaces the retired `/api/v1/auth/signup` route.

## Invitation Lifecycle

1. A `tenant_admin` calls `POST /api/v1/tenant/invitations`.
2. The invitation stores email, org role, token hash, expiry, and used timestamp.
3. The raw token is sent to the invitee.
4. The invitee calls `POST /api/v1/auth/invitations/accept`.
5. The server creates the user and membership using the role from the stored invitation.
6. The accept request body never carries `org_role`; the stored invitation is authoritative.
7. If the email already belongs to the tenant, accepting is an idempotent no-op.

## Org Permissions

Add org-level permissions in `api/app/auth/rbac.py`.

Use org permissions for tenant-wide actions such as:

- managing branding;
- inviting users;
- viewing tenant reports;
- managing billing.

Routes must use `require_permission("permission:name")`. The dependency reads `memberships`, not `users.role`.

Org role is authoritative on `memberships` everywhere, including billing admin-seat enforcement. `users.role` is deprecated and retained only for backfill history.

## Course Permissions

Add course permissions in `api/app/learning/permissions.py`.

Use course permissions for course-specific actions such as:

- editing lessons;
- publishing a course;
- viewing course progress;
- managing course enrolments.

Course permission checks must read the caller's `enrolments.course_role` for the specific course. A user can be `course_owner` in one course and `learner` in another.

## No-Leak Rule

Missing enrolment or insufficient course permission returns `404`, not `403`, so the response does not reveal whether another tenant or another course resource exists.
