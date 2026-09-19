# OmniXtra Product Requirements Document

**Product:** OmniXtra AI-Native Learning Management Platform
**Version:** v2026.08.23
**Status:** Current MVP PRD, aligned to implemented remediation through August 23, 2026
**Source of truth:** `AGENTS.md`, ADR-002, ADR-003, current implementation, and current UX remediation tracker

---

## 1. Product Summary

OmniXtra is an AI-native, multi-tenant Learning Management System for organizations that need to launch branded training academies quickly. The MVP focuses on self-serve academy creation, invitation-based access, role-aware course authoring, learner course delivery, completion reporting, billing foundations, tenant branding, and a course-grounded AI tutor.

The product is academy-first from the user's point of view. Internal architecture may use tenant terminology, but visible UX should speak in terms of academies, members, courses, learners, and course teams.

OmniXtra must not copy another LMS experience verbatim. External references can inform interaction patterns, but OmniXtra's visual identity, language, and flow must remain distinct, with the brand green as the primary accent.

## 2. Current Product Positioning

OmniXtra helps teams create a branded learning academy, invite members, publish standard learning content, and give learners an AI tutor grounded in the organization's course material.

Core value propositions:

- Launch a branded academy without implementation drag.
- Invite admins, course teams, and learners through controlled membership flows.
- Let a user be a learner in one course and a course owner or facilitator in another.
- Create practical course content using direct standard content types.
- Track progress, completion, and learner activity from an operational admin dashboard.
- Provide advisory AI tutor help inside the learner course context.

## 3. Primary Personas

| Persona | Role | Primary job |
|---|---|---|
| Tenant Owner / Academy Admin | Owns academy setup and operations | Create academy, manage branding, invite members, manage billing, view reports |
| Course Owner | Owns one or more courses | Create and maintain course content, publish courses, track course-specific progress |
| Facilitator | Supports a course | Help manage learning delivery without broad academy admin powers |
| Learner | Consumes assigned courses | Resume learning, complete lessons/quizzes, use AI tutor, download certificates |
| Invited Member | Joins through invitation | Accept invite, create login credentials, enter the correct academy context |

## 4. Roles And Authorization Model

OmniXtra uses the accepted ADR-003 three-plane model.

### 4.1 Authentication Plane

The `users` table answers: who can log in?

Requirements:

- Email/password authentication for MVP.
- Magic-link and password-reset support.
- Secure httpOnly cookie sessions.
- Refresh-token rotation and replay detection.
- Login and auth-related rate limiting.

### 4.2 Membership Plane

The `memberships` table answers: which academy does this user belong to, and what org role do they hold?

MVP org roles:

- `tenant_admin`
- `member`

Tenant admins can manage academy-wide concerns such as branding, members, billing, and reports. Members have minimal academy-wide power; their actual course capabilities come from course enrolments.

### 4.3 Course Authorization Plane

The `enrolments` table answers: what can this user do in this course?

Course roles:

- `course_owner`
- `facilitator`
- `learner`

A single person can be a course owner in Course A, a facilitator in Course B, and a learner in Course C.

### 4.4 No-Leak Rule

Unauthorized or cross-tenant access to tenant-owned resources must return indistinguishable `404` responses where revealing existence would leak information. Frontend visibility is never authorization.

## 5. Information Architecture

### 5.1 Public Apex

`/` on bare `localhost:3001` or the production apex is a marketing homepage.

Requirements:

- High-intent marketing page.
- No generic member sign-in CTA.
- Primary CTA: create an academy.
- Secondary CTA: join with invitation.
- Marketing header may link to platform, AI tutor, and pricing sections.
- Authenticated academy routing must not affect the apex marketing page.

### 5.2 Academy Hosts

Academy subdomains such as `eap.localhost:3001` are working academy contexts.

Logged-out academy root:

- Shows the branded academy sign-in form.
- Does not show broad marketing or academy creation choices.

Authenticated academy root:

- Tenant admin redirects to `/admin`.
- Member redirects to `/my-courses`.

### 5.3 Admin Surface

Admin pages use the shared authenticated app shell.

Primary admin navigation:

- Dashboard
- My Courses
- Courses
- Members
- Billing

Navigation must be role-filtered:

- Tenant admins see dashboard, courses, members, billing, and my courses.
- Members see my courses and courses as allowed by membership/course enrolment.

### 5.4 Member Home

Non-admin members use a blended teach-and-learn home at `/my-courses`, not a pure learner-only page.

The page must surface:

- Courses the user is taking.
- Courses the user facilitates.
- Courses the user owns.

Sections with no matching courses should not render as misleading empty panels.

## 6. Core MVP User Journeys

### 6.1 Create An Academy

Route: `/get-started`

Flow:

1. New academy owner opens academy creation.
2. Enters academy name and subdomain.
3. Enters admin full name, email, and password.
4. Backend calls `POST /api/v1/tenants`.
5. System creates academy, first user, first `tenant_admin` membership, and session.
6. Local development redirects through the localhost-safe handoff.
7. User lands in the new academy admin area.

UX requirements:

- Use academy vocabulary, not tenant/organization copy.
- Form validation must show user-friendly messages, never raw keys like `min_length`.
- Submit button must become stateful while creating.
- First-run admin state should help the admin create a course, invite the team, and add branding.

### 6.2 Sign In To An Academy

Route: academy host `/login`

Flow:

1. User opens their academy-specific login URL.
2. Enters email and password.
3. System authenticates and sets session cookies.
4. User routes to the correct home based on membership and course context.

Bare `localhost:3001/login` must not pretend to be a working academy login. It should guide the user to open their academy sign-in page or use academy creation/invitation flows.

### 6.3 Invite Members

Route: `/admin/members`

Flow:

1. Tenant admin opens Members.
2. Admin views active members, pending invitations, and admin-seat usage.
3. Admin opens invite form.
4. Admin enters email and selects org role.
5. Backend creates invitation using stored role.
6. UI shows invitation sent and pending member row.
7. Admin can copy invitation link.

Rules:

- Accept request body must never carry `org_role`.
- Stored invitation role is authoritative.
- Admin-seat limits are enforced from `memberships.org_role`.
- Pending invite copy link is admin-only.

### 6.4 Accept Invitation

Route: `/join?token=...`

Flow:

1. Invitee opens link on academy subdomain.
2. Web SSR sends forwarded host to API so tenant context resolves correctly.
3. API returns allow-listed preview: academy name and invited email.
4. Invitee creates credentials.
5. Backend creates user and membership according to invitation.
6. Used, expired, nonexistent, or cross-tenant tokens show a generic invalid invitation state.

### 6.5 Create Courses

Route: `/admin/courses`

The Courses page is a table-first operational page when courses exist. For a new academy with no courses, the course creation panel opens by default.

When the user clicks Add course, OmniXtra must show direct standard content choices, not reference-style category groups.

Required first content choices:

- Content
- Web content
- Video
- Image
- Quiz

Explicitly forbidden for OmniXtra MVP:

- TalentCraft-style category grouping.
- "Learning Activities" as a top-level course creation category.
- "More" category buckets.
- AI course generation presented as available functionality.

Current backend-safe mapping:

- Content maps to text-backed course content.
- Web content maps to text-backed link content until a native web-content block exists.
- Video maps to video block payloads.
- Image maps to image block payloads.
- Quiz maps to quiz block payloads.

### 6.6 Build And Publish A Course

Route: `/admin/courses/{course_id}`

Capabilities:

- Edit course title and description.
- Register media metadata.
- Add sections.
- Add lessons.
- Add standard content blocks.
- Publish course.

MVP block/content support:

- Text/content.
- Web content link support through text-backed content.
- Video.
- Image.
- Quiz.

Publishing rules:

- Course must contain at least one lesson.
- Mutations require course-level permission through enrolment role.
- Publishing and course mutations produce audit entries.

### 6.7 Learn From Courses

Route: learner course player

Capabilities:

- See course outline.
- Resume progress.
- Mark lesson progress.
- Answer quizzes.
- Complete course.
- Download certificate when available.
- Use AI tutor in course context.

### 6.8 Use AI Tutor

The AI tutor is course-grounded and advisory.

Requirements:

- Tutor jobs run asynchronously through Dramatiq.
- HTTP handlers must not block on LLM calls.
- Results stream over tenant-scoped SSE via Redis Pub/Sub.
- Retrieval is tenant-scoped and course-scoped.
- Tutor answers include citations when available.
- Tutor refuses out-of-scope prompts.
- Tutor must not provide direct quiz-answer leakage.
- AI token/rate limits are enforced before provider work is queued.
- Paid-tenant private content may be sent to external providers only with tenant consent.

Current evidence:

- Recorded OpenAI eval passed 20/20 with `pass_rate=1.0`.
- Semantic cache behavior is covered by tests.

## 7. UI And Visual Standards

### 7.1 Brand

Primary brand colour:

- OmniXtra green: `#116149`

Supporting accents may be used sparingly:

- Gold for secondary status/accent.
- Neutral slate/white/soft gray for operational surfaces.

Avoid turning OmniXtra into a blue-dominant interface based on references.

### 7.2 Typography

Primary font:

- Inter

Secondary/display/UI font:

- Geist

Requirements:

- Inter is the inherited site-wide body font.
- Geist is available as the secondary/display layer for headings, labels, controls, table headers, and compact UI affordances.
- Typography is configured globally through the Next.js root layout and global CSS/Tailwind font tokens.

### 7.3 Admin UI

Admin UI should feel professional, operational, and dense enough for repeated use.

Current standard:

- Fixed global header.
- Authenticated app shell with OmniXtra green navigation rail.
- Sticky/collapsible sidebar.
- Main content scrolls beneath fixed header.
- Header shows subtle bottom shadow when scrolled.
- Dashboard uses widget cards for portal activity, quick actions, overview, timeline, users, and course progress.
- Courses uses searchable/filterable operations table.
- Members uses access-management summary cards and member directory.

### 7.4 Forms And Feedback

All forms must use the site-wide form standard:

- React Hook Form.
- Zod resolver.
- Shared form controls.
- `noValidate`.
- Centralized validation message resolution.
- Disabled fieldsets while submitting.
- Stateful submit buttons with context-specific pending labels.
- Toast or inline feedback where appropriate.
- Raw validation keys must never render in UI.

### 7.5 Loading And Empty States

Requirements:

- Use skeletons for meaningful async page loading.
- Empty states should provide the next useful action.
- First-run admin state should guide course creation, team invitation, and branding setup.
- Buttons and shared controls must show cursor, disabled, and processing states.

## 8. Backend And API Requirements

### 8.1 Architecture

OmniXtra remains a modular monolith:

- `api/` FastAPI backend.
- `web/` Next.js frontend.
- PostgreSQL 16 + pgvector.
- Redis 7.
- Dramatiq worker.
- Docker Compose for local services.

### 8.2 Tenant Isolation

Tenant isolation is mandatory at three layers:

- Request context tenant resolution.
- ORM tenant filters and insert population.
- PostgreSQL RLS with per-cursor tenant variable discipline.

Cross-tenant access must not reveal existence.

### 8.3 API Response Contract

All API responses use the standard envelope:

```json
{
  "data": {},
  "error": null,
  "meta": {
    "request_id": "req_abc123"
  }
}
```

Error envelopes must be typed and safe.

### 8.4 Important Routes

Identity and membership:

- `POST /api/v1/tenants`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/tenant/invitations`
- `GET /api/v1/auth/invitations/{token}`
- `POST /api/v1/auth/invitations/accept`

Courses:

- `GET /api/v1/courses`
- `POST /api/v1/courses`
- `GET /api/v1/courses/{course_id}`
- `PATCH /api/v1/courses/{course_id}`
- `POST /api/v1/courses/{course_id}/lessons`
- `GET /api/v1/courses/{course_id}/lessons`
- `POST /api/v1/courses/{course_id}/blocks`
- `POST /api/v1/courses/{course_id}/media`
- `POST /api/v1/courses/{course_id}/publish`

Learning:

- My courses.
- Course player.
- Progress.
- Quiz attempts.
- Completion.
- Certificates.

Billing:

- Plan catalog.
- Current subscription.
- Signed Stripe checkout and webhook handling.

Admin:

- Completion analytics.
- Learner progress report.
- CSV export.

AI:

- Tutor job creation.
- Tutor SSE stream.
- Conversation history.

## 9. Local Development And Testing

Local services:

- API: `http://localhost:8000`
- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
- Web: `http://localhost:3001`
- Academy web: `http://{academy}.localhost:3001`
- Adminer: `http://localhost:8082`
- PostgreSQL host port: `15432`
- Redis host port: `16379`

Local tenant-authenticated flows use wildcard localhost subdomains:

- Web: `{academy}.localhost:3001`
- Browser API: `{academy}.localhost:8000`

Server-side web fetches must use `API_INTERNAL_URL`; browser-visible API calls must use `NEXT_PUBLIC_API_URL`.

Playwright policy:

- Agents do not run local Playwright.
- Playwright is CI-only unless a human deliberately opts in with `PLAYWRIGHT_ALLOW_LOCAL_E2E=1`.
- Local definition of done is fast verification: lint, typecheck, unit tests, backend integration tests where configured.

## 10. Billing And Plans

MVP billing includes:

- Data-driven plan catalog.
- Stripe checkout provider boundary.
- Signed webhook verification.
- Plan upgrade/downgrade foundation.
- Admin-seat limits.
- Learner/storage limit enforcement foundations.
- Pricing page backed by plan catalog.

Initial plan hypotheses remain:

| Plan | Price | Included capacity |
|---|---:|---|
| Starter | $49/mo | 3 admin seats, 50 learners, 10 GB video |
| Growth | $149/mo | 10 admin seats, 250 learners, 50 GB video |
| Business | $399/mo | 25 admin seats, 1000 learners, 200 GB video |
| Enterprise | Custom | Contract-defined |

## 11. Explicit MVP Exclusions

The following should not appear as available MVP functionality:

- SSO and MFA.
- Custom roles.
- SCORM/xAPI import.
- AI course generation.
- Rich branching scenarios.
- Course marketplace.
- Native mobile apps.
- Live classes.
- Forums/social learning.
- Gamification.
- Custom domains.
- Email white-labeling.
- Custom CSS.
- MCP agentic execution.
- Voice tutor.
- Deep/custom analytics dashboards.

## 12. Acceptance Criteria

MVP is product-ready when:

- A new admin can create an academy and land in an authenticated admin home.
- The academy root routes logged-out users to branded sign-in and authenticated users to the correct role home.
- Admin can invite members and copy pending invitation links.
- Invitee can preview and accept invitation without carrying role in request body.
- Admin can create a course using direct standard content choices.
- Course owner can add course content and publish.
- Learner can access enrolled courses from `/my-courses`.
- Learner can progress through course content, complete quizzes, and download certificate where available.
- Tutor answers are tenant/course scoped, advisory, streamed, cited, and guarded.
- Admin can view dashboard widgets, completion analytics, learner progress, and CSV export.
- Billing page and plan limits are wired to backend plan data.
- Tenant isolation tests and route coverage gates pass.
- Frontend fast verification passes.
- Backend lint, type, tests, and Docker-backed integration checks pass where configured.

## 13. Current Open Product Follow-Ups

These are not blockers for the current PRD but should guide next planning:

- Decide whether to add a native `web_content` block type instead of mapping web content into text-backed content.
- Continue making course builder UX more visual and less form-heavy.
- Add richer preview/publish workflow once content creation stabilizes.
- Add SSO settings UX when Phase 2 SSO implementation is resumed.
- Mature branding settings beyond name/logo/primary colour.
- Add real media upload storage flow beyond metadata registration.
- Prepare staging deployment checklist and production configuration once local MVP flows are accepted.
