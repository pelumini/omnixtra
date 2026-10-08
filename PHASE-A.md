# Scoped agent task — hoist the app shell into a persistent layout (kill brand + nav flash at the source)

**Repo:** OmniXtra `web/` · **Branch:** `refactor/hoist-app-shell` · **Type:** structural refactor of the `(app)` route group. No new dependencies. **Behavior-preserving** (see Invariants). URLs must not change.

## Background (why)
Today the sidebar shell (`AppShell`, and its thin alias `AdminShell`) is rendered **inside each page**. Because a Next.js `loading.tsx` is a Suspense fallback rendered **before** any data resolves, every navigation re-mounts the shell via the route's `loading.tsx`, which can only feed the shell **hardcoded placeholder** values (`tenant_name: "Academy"`, `viewerRole: "member"`). Result: on every nav the brand flashes "Academy"→real, and on shared routes the nav flashes the wrong role's items→real.

The fix is structural: render the shell **once** in a persistent layout that fetches the real branding + role, so navigating between child pages never re-mounts it. A layout does **not** re-render on navigation between its children, and it **can** be async — so it's the correct home for the shell.

This retires the `brandLoading` placeholder mechanism we added earlier; it becomes dead code and comes out.

## STEP 0 — investigate & report FIRST (do not edit yet)
Print findings for each before making changes — these drive correctness:

1. **How do the data helpers fetch?** Open `@/lib/auth/session` (`getSessionOrNull`) and `@/lib/auth/branding` (`getBrandingOrDefault`). Report whether each ultimately uses `fetch()` (which Next **auto-memoizes per request**, so a layout+page double-call is already deduped) or something else (DB client, axios, etc.). This decides whether we need `cache()` — see Change 5.
2. **Who imports `AdminShell`?** `grep -rn "admin-shell" web/src`. List every consumer. After this refactor the pages stop rendering it; report whether anything other than the pages/loading files we're changing still uses it.
3. **Confirm the shelled set.** Verify (via `grep -rn "AdminShell\|AppShell" web/src/app`) that the ONLY routes rendering a shell today are everything under `(app)/admin/**` plus `(app)/my-courses`. Confirm `onboarding`, `pricing`, and `learn/courses/[courseId]` render **no** shell.
4. **Confirm `AppShell` is a client component** (`"use client"`, uses `usePathname`/`useState`) and that `AdminShell` just re-renders `<AppShell viewerRole=…/>`.

Report these four, then proceed.

## The changes

### 1. Create the shell route group + layout
- Create route group **`web/src/app/(app)/(shell)/`** and **move** these folders into it unchanged:
  - `(app)/admin/` → `(app)/(shell)/admin/`
  - `(app)/my-courses/` → `(app)/(shell)/my-courses/`
  - (Route groups `(…)` are invisible to the URL, so `/admin`, `/admin/members`, `/my-courses`, etc. are **unchanged**. All imports use the `@/` alias, so moving folders breaks no imports — verify none use relative `../` that would shift.)
- Leave `onboarding`, `pricing`, and `learn` **where they are**, directly under `(app)` — they stay shell-less exactly as today.

- Create **`web/src/app/(app)/(shell)/layout.tsx`** (async server component) that renders the shell once:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { InvitationPending } from "@/features/auth";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";

import type { ReactNode } from "react";
import type { TenantBranding } from "@/lib/schemas/academy";

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function ShellLayout({ children }: { children: ReactNode }) {
  // E2E fixture pages render their own shell (they read searchParams the layout can't see).
  // Pass through so the test surface is byte-identical to today.
  if (E2E_FIXTURES_ENABLED) {
    return <>{children}</>;
  }

  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };

  const session = await getSessionOrNull(context);
  if (session === null) {
    redirect("/login");
  }
  if (session.membership === null) {
    return <InvitationPending session={session} />;
  }

  const branding = await getBrandingOrDefault(context, fallbackBranding);

  return (
    <AppShell branding={branding} viewerRole={session.membership.org_role}>
      {children}
    </AppShell>
  );
}
```

- Confirm `E2E_FIXTURES_ENABLED` is the correct exported constant (it's imported this way in `my-courses/page.tsx`). Match whatever the codebase exports (`E2E_FIXTURES_ENABLED` constant vs `e2eFixturesEnabled()` function — `admin/page.tsx` uses the function form; use whichever is canonical and consistent).

### 2. Unwrap the shell from every page under `(shell)`
For each page (`admin/page.tsx`, `admin/members/page.tsx`, `admin/courses/page.tsx`, `admin/courses/[courseId]/page.tsx`, `my-courses/page.tsx`):
- Remove the `<AdminShell …>` / `<AppShell …>` wrapper from the JSX and return the **inner content directly** (the `<main>…</main>` / feature component that was the child).
- **Keep every existing guard exactly as-is**: the `getSessionOrNull` + `redirect("/login")`, the `membership === null → InvitationPending`, and (admin pages) the `org_role !== "tenant_admin" → DeniedState` checks all stay in the page. They are defense-in-depth and the role gate. `DeniedState` is now returned as the page body and will render **inside** the persistent shell — this is intended (keeps nav available).
- **Drop any now-unused `branding` fetch and `fallbackBranding` const.** After unwrapping, a page needs `branding` only if it passes branding data to its content (e.g. `my-courses` passes `branding.tenant_name` to `MyCoursesDashboard` → it keeps the branding fetch). Admin pages used `branding` **only** for the shell → remove their `getBrandingOrDefault` call and their local `fallbackBranding`. Keep `session`/`viewerRole` fetches wherever the page passes `viewerRole` to a feature component (`AdminCourseList`, members list, etc.) or uses `session.user`.
- Remove now-unused imports (`AdminShell`/`AppShell`, `getBrandingOrDefault`, `TenantBranding`) per page.
- **E2E branches:** leave the `e2eFixturesEnabled()` / `?e2e=` branches in `admin/page.tsx` and `my-courses/page.tsx` **untouched** — they still render their own shell, and the layout passes through under E2E (Change 1). Do not alter fixture behavior.

### 3. Loading files → content-only skeletons
For every `loading.tsx` now under `(shell)` (`admin/loading.tsx`, `admin/members/loading.tsx`, `admin/courses/loading.tsx`, `admin/courses/[courseId]/loading.tsx`, `my-courses/loading.tsx`):
- Remove the `<AdminShell>`/`<AppShell>` wrapper, the `brandLoading` prop, the `loadingBranding` object, and the shell import.
- Return **only** the inner content skeleton (the `<main>…skeleton…</main>` that was the child). The persistent shell from the layout stays mounted around it, so no shell appears (or flashes) in the loading state.
- `pricing/loading.tsx` and `learn/courses/[courseId]/loading.tsx` are already shell-less — **leave them unchanged.**

### 4. Remove the dead `brandLoading` mechanism
- Remove the `brandLoading` prop (and its skeleton branch) from `app-shell.tsx`, and from `admin-shell.tsx`.
- If STEP 0 shows **nothing** imports `AdminShell` after Changes 2–3, **delete `admin-shell.tsx`** and have the layout use `AppShell` directly (it already does above). If something still legitimately uses `AdminShell`, keep the file but strip `brandLoading`. Report which.
- Update `web/tests/admin-shell.test.tsx`: the "skeletons only the brand identity while branding is loading" test is now obsolete — remove it. If `AdminShell` is deleted, relocate any still-relevant shell assertions to a test that renders `AppShell` directly (or the layout). Keep coverage that the shell renders nav + children + real brand name; just drop the `brandLoading` assertions.

### 5. Request dedupe (only if needed — decided by STEP 0)
- If `getSessionOrNull` / `getBrandingOrDefault` use `fetch()` under the hood, **do nothing** — Next's per-request fetch memoization already dedupes the layout+page calls. State this in the report.
- If they do **not** use `fetch` (e.g. direct client), wrap the request-scoped accessor in React `cache()` keyed on the **primitive** cookie/host strings (not a fresh `{cookie,host}` object, which would defeat memoization) so layout and page share one call. Keep this minimal and report exactly what you added.

## Invariants (must hold)
- **URLs unchanged.** Route groups are invisible; verify `/admin`, `/admin/members`, `/admin/courses`, `/admin/courses/[id]`, `/my-courses` all still resolve.
- **Tenant resolution untouched.** The `await headers()` → `{cookie, host}` → `getBrandingOrDefault(context)` path (which drives the `x-tenant-host`/`x-forwarded-host` SSR headers downstream) moves verbatim into the layout. **Do not touch** `client.ts`, `tenant-host.ts`, `middleware.ts`, or `next.config.ts`.
- **Auth preserved.** Unauthenticated → `/login`; no membership → `InvitationPending`; non-admin on admin route → `DeniedState`. All still enforced (layout for the shell; pages keep their own guards).
- **E2E byte-identical.** Fixture branches untouched; layout passes through when E2E is enabled.
- **No layout shift / no new visual style.** Reuse existing skeleton primitives and tokens. The shell markup itself is unchanged apart from removing the `brandLoading` branch.
- No new dependencies. Smallest diff that achieves the hoist.

## OUT of scope (do NOT do these here)
- Bringing `pricing`/Billing into the shell (that's a deliberate **separate** follow-up).
- Changing the lesson viewer (`learn/courses/[courseId]`) or onboarding — they stay shell-less.
- Any nav item, routing, data-fetch semantics, RLS, or backend change.

## Definition of done (verify gate)
```
npm run verify
npm run build
```
- `verify` + `build` pass (existing max-lines warnings may remain; no new errors).
- A single `(app)/(shell)/layout.tsx` renders `AppShell` once with real branding + role; no page or loading file renders the shell anymore.
- `brandLoading` is gone from the codebase; obsolete test removed/relocated.
- Fixture/e2e behavior unchanged.

## Report back
1. The STEP 0 findings (4 items), especially the fetch/dedupe decision and the `AdminShell` consumer list.
2. Tree of `(app)` before/after (showing the `(shell)` group), and the final `layout.tsx`.
3. Per-page: what was unwrapped and which `branding`/imports were dropped.
4. Whether `admin-shell.tsx` was deleted or kept, and what happened to `admin-shell.test.tsx`.
5. `verify` + `build` output + `git diff --stat`.