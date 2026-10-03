# Scoped agent task — Phase 5a: relocate four clean domains into `features/`

**Repo:** OmniXtra `web/` · **Branch:** `refactor/phase-5a-features` · **Type:** pure relocation, **zero behavior change**, **no new dependencies**

Introduce the `src/features/` layer by moving four self-contained domain verticals — **`courses`, `learning`, `billing`, `members`** — out of the current flat `lib/`+`components/` layout and into `features/<domain>/`, each with a public `index.ts` barrel. Repoint imports. **This is a move, not a rewrite.** `tsc --strict` is the safety net.

> Scope note: only these four domains move this phase. `auth`, `academy`, `analytics`, `common` schemas/api **stay in `lib/`** (they're cross-cutting — consumed by `lib/auth/` and `components/layout/`; moving them would make `lib` depend on a feature). The dashboard, marketing, auth/academy components, `components/layout/` reorg, route groups, and strict ESLint are **Phase 5b — do not touch them here.**

---

## Target layout (create these)

For each domain, create `src/features/<domain>/` with a `schemas.ts`, `api.ts`, a `components/` folder, and an `index.ts` barrel.

### `features/courses/`
- `schemas.ts` ← move `src/lib/schemas/courses.ts`
- `api.ts` ← move `src/lib/api/courses.ts`
- `components/course-builder.tsx` ← `src/components/admin/course-builder.tsx`
- `components/course-builder/` ← `src/components/admin/course-builder/` (the whole folder from Phase 4a)
- `components/course-detail.tsx` ← `src/components/admin/course-detail.tsx`
- `components/admin-course-list.tsx` ← `src/components/admin/admin-course-list.tsx`

### `features/learning/`
- `schemas.ts` ← `src/lib/schemas/learning.ts`
- `api.ts` ← `src/lib/api/learning.ts`
- `components/learner-course-player.tsx` ← `src/components/learning/learner-course-player.tsx`
- `components/my-courses-dashboard.tsx` ← `src/components/learning/my-courses-dashboard.tsx`
- `components/tutor-panel.tsx` ← `src/components/learning/tutor-panel.tsx`

### `features/billing/`
- `schemas.ts` ← `src/lib/schemas/billing.ts`
- `api.ts` ← `src/lib/api/billing.ts`
- `components/pricing-page.tsx` ← `src/components/billing/pricing-page.tsx`

### `features/members/`
- `schemas.ts` ← `src/lib/schemas/members.ts`
- `api.ts` ← `src/lib/api/members.ts`
- `components/members-view.tsx` ← `src/components/admin/members-view.tsx`

### `index.ts` barrel (each of the four)
Re-export the feature's public surface:
```ts
export * from "./schemas";
export * from "./api";
export { CourseBuilder } from "./components/course-builder";
// …each page-level component the feature exposes
```
**Do not** export internal sub-components (e.g. `course-builder/SectionForm`) from the barrel.

---

## Import rules (this is where the care goes)
- **Within a feature:** use **relative** imports (`./schemas`, `./api`, `./components/course-detail`). A feature never imports its own files via `@/features/<self>`.
- **From a page or another feature:** import from the **barrel** — `@/features/courses` — never a deep path into another feature.
- **Features still import `lib/` freely** — `@/lib/api/client`, `@/lib/schemas/common`, `@/lib/schemas/auth`, `@/lib/forms/*`, `@/lib/permissions`, etc. stay where they are; just update the paths for the four moved domains.
- **These four domains' `schemas.ts`/`api.ts` import `lib/` for shared pieces** (e.g. `features/courses/schemas.ts` imports `metaSchema` from `@/lib/schemas/common`; `features/courses/api.ts` imports the core from `@/lib/api/client`). Keep those as `@/lib/...`.
- Repoint **every** consumer — app pages (`app/admin/courses/**`, `app/my-courses/**`, `app/learn/**`, `app/pricing/**`, `app/admin/members/**`), any other component that referenced a moved file, and the **tests** — to the new `@/features/<domain>` barrel (or relative, within a feature).

## OUT of scope (do NOT touch)
- `auth`, `academy`, `analytics`, `common` schemas/api — stay in `lib/`.
- `components/admin/{admin-dashboard,admin-home,admin-first-run-checklist,admin-shell,onboarding-wizard}.tsx`, `components/app/**`, `components/auth/**`, `components/forms/**`, `components/ui/**` — stay put (Phase 5b).
- Route groups, `components/layout/`, strict ESLint — Phase 5b.
- Any component logic, JSX, API behavior, or exported names. No new deps. No `lib/` barrels.
- Leave any now-empty dirs (`components/billing/`, `components/learning/`) for the Phase 6 cleanup, or remove them if trivially empty — your call, note which.

---

## Definition of done (verify gate)
Paste the output of:
```
npm run verify      # lint + typecheck + vitest
```
All green. Specifically:
- `tsc --strict` + all 62 tests pass.
- `src/features/{courses,learning,billing,members}/` each exist with `schemas.ts`, `api.ts`, `components/`, `index.ts`.
- `grep -rn "@/lib/schemas/courses\|@/lib/api/courses\|@/lib/schemas/learning\|@/lib/api/learning\|@/lib/schemas/billing\|@/lib/api/billing\|@/lib/schemas/members\|@/lib/api/members" src` returns **nothing** (old paths fully repointed).
- No cross-feature deep imports: `grep -rnE "@/features/[a-z]+/(components|schemas|api)" src/features` should show a feature only reaching **its own** files relatively — cross-feature references go through `@/features/<other>` (the barrel).

**Environment guard:** if `npm run verify` can't run due to a broken `node_modules`, stop and report plainly — do **not** loop on `npm install`/`npm ci`.

## Report back
1. `verify` output.
2. The new `features/` tree.
3. Confirm: only the four named domains moved; `auth`/`academy`/`analytics`/`common` untouched in `lib/`; imports go barrel-for-cross, relative-for-within.
4. Any cross-feature dependency you introduced (e.g. `learning` needing a `courses` type) and that it routes through the barrel.
5. `git diff --stat`.

Stop after this phase. Do not start Phase 5b.