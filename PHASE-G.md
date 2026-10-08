# Scoped agent task — skeleton the brand slot during loading (kill the "Academy" flash)

**Repo:** OmniXtra `web/` · **Branch:** `fix/brand-loading-slot` · **Type:** small UI change to the shells + the loading files, no new dependencies, no behavior change

## Background (why)
The app shells (`AdminShell`, `AppShell`) are rendered per-page, so each navigation re-mounts the sidebar via the route's `loading.tsx`, which passes a **placeholder** branding (`tenant_name: "Academy"`, `primary_color: "#584ce1"`). The result: on every nav the sidebar brand briefly shows **"A Academy"** before the real page swaps in the tenant's brand (e.g. "B Beko"). We want that brand slot to render as a **skeleton shimmer** during loading instead of a misleading fake name.

(Not in scope: the proper fix of hoisting the shells into persistent layouts — deliberately deferred.)

## Changes

### 1. `AdminShell` and `AppShell` — add an optional `brandLoading` prop
Find where each shell renders the **tenant brand identity** in the sidebar (the logo / initial avatar + the tenant name text — the "A Academy" / "B Beko" element). Add an optional prop:

```ts
brandLoading?: boolean;
```

When `brandLoading` is `true`, render a **`Skeleton`** (from `@/components/ui/skeletons`, the same primitive the loading files already use) in place of **just the brand logo/initial and the tenant-name text** — e.g. a small square skeleton for the avatar and a short bar skeleton for the name, sized to match the real brand element so there's no layout shift. Everything else (the nav items, collapse button, layout) renders exactly as today.

- Default `brandLoading` to `false` so all existing usages (the real pages) are unchanged.
- Other `branding` fields (e.g. `primary_color` used for accents) can stay as-is; only the visible brand **name + logo/initial** become a skeleton under `brandLoading`.

### 2. The five `loading.tsx` files — pass `brandLoading`
In each of:
- `web/src/app/(app)/admin/loading.tsx`
- `web/src/app/(app)/admin/members/loading.tsx`
- `web/src/app/(app)/my-courses/loading.tsx`
- `web/src/app/(app)/pricing/loading.tsx`
- `web/src/app/(app)/learn/courses/[courseId]/loading.tsx`

pass **`brandLoading`** to the `AdminShell`/`AppShell` they render. Keep the existing `loadingBranding` object for the remaining required props (so the component contract is satisfied) — only the brand name/logo is now skeletoned via the flag. (Also check whether `admin/courses/loading.tsx` — the original reference — should get the same treatment for consistency; if it renders a shell with placeholder branding, add `brandLoading` there too and note it.)

## Invariants
- Real pages are visually unchanged (`brandLoading` defaults false).
- No layout shift: the skeleton brand must occupy the same footprint as the real brand element.
- Reuse the existing `Skeleton` primitive and tokens — no new component, no new deps, no restyle of the shells beyond the brand slot.

## OUT of scope
- Hoisting shells into persistent layouts (parked).
- Any nav, routing, data-fetch, or page-content change.

## Definition of done (verify gate)
```
npm run verify
npm run build
```
- `brandLoading` prop exists on both shells; defaults false; skeletons only the brand name + logo/initial.
- All five (or six, incl. courses) loading files pass it.
- Build + lint pass; real pages unchanged.

## Report back
1. Where the brand identity is rendered in each shell and how you skeletoned it.
2. The list of loading files updated (and whether `admin/courses` was included).
3. `verify`/`build` output + `git diff --stat`.