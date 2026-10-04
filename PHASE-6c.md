# Scoped agent task — Phase 6c: route groups (the final restructure step)

**Repo:** OmniXtra `web/` · **Branch:** `refactor/phase-6c-route-groups` · **Type:** filesystem reorganization of `app/`, **zero behavior change**, **no new dependencies**

Organize `src/app/` routes into the `(marketing)` / `(app)` / `(auth)` route groups. Route-group folders are **parenthesized → they do not appear in URLs**, so this is purely organizational. **No URL changes. No change to which chrome wraps which route.**

> Pre-step (tiny, unrelated): if not already fixed, in `features/marketing/components/landing/MarketingFooter.tsx` replace the corrupted `Â©` with a clean copyright — write it as `{"©"} 2026 OmniXtra. All rights reserved.` so the source stays pure-ASCII. Confirm `grep -rl $'\xc3\x82' src/` returns nothing.

---

## The key constraint — keep the single root layout
- **`src/app/layout.tsx` STAYS at the app root** (not inside any group). It must keep wrapping every route exactly as today — it already renders the correct header conditionally (via `showAuthLink`/session), so leaving it at the root means the rendered chrome is **identical** for every route.
- **Do NOT add per-group `layout.tsx` files.** We are not redistributing the chrome into group layouts this phase — that would be a behavior change. One root layout, full stop.
- `globals.css`, `favicon.ico`, `icon.svg`, `apple-icon.png` stay at the app root alongside `layout.tsx`.

## Moves — wrap route folders in groups (URLs unchanged)

### `src/app/(marketing)/`
- `page.tsx` ← `src/app/page.tsx` (the host-aware root: apex → landing, tenant host → sign-in/redirect). It still serves `/`.

### `src/app/(app)/`
- `admin/` (and everything under it), `my-courses/`, `learn/`, `pricing/`, `onboarding/` ← move each folder here.

### `src/app/(auth)/`
- `login/`, `join/`, `get-started/`, `auth/` (including the route handlers `auth/session/route.ts`, `auth/local-signup/route.ts`, `auth/local-signout/route.ts`) ← move each here.

### STAYS at `src/app/` root (do NOT move)
- `layout.tsx`, `globals.css`, `favicon.ico`, `icon.svg`, `apple-icon.png`.
- `e2e/` — the test route surface (Playwright's harness populates it). **Do not reorganize or touch it.**

---

## Why this is safe (and the one thing to watch)
- Pages use `@/…` absolute imports, so **moving the files does not break any imports** — no repointing needed.
- Group names in parentheses are **stripped from the URL**: `(app)/admin/page.tsx` still serves `/admin`, `(auth)/login` still serves `/login`, `(marketing)/page.tsx` still serves `/`. Verify this holds — a duplicated route or a changed URL is the failure mode.
- **The ESLint `boundaries` config references `src/app/**` as the `app` element** — route groups are still under `src/app/`, so the layer rules keep matching. Confirm lint stays green.

## OUT of scope
- Per-group layouts, any layout/chrome redistribution, colocation changes.
- Any component logic, JSX, API behavior, exported names, or `features/`/`lib/`/`components/` changes.
- Touching `e2e/` or the Playwright specs.

---

## Definition of done (verify gate)
Paste the output of:
```
npm run verify      # lint (strict) + typecheck + vitest
```
- Lint passes 0 errors (boundaries still green), `tsc --strict` + 62 tests pass.
- `src/app/` top level contains only: `(marketing)/`, `(app)/`, `(auth)/`, `e2e/`, `layout.tsx`, `globals.css`, and the icon files.
- **Route-resolution check** — confirm the URLs are unchanged by listing them: every page still resolves at the same path (`/`, `/admin`, `/admin/courses`, `/admin/courses/[courseId]`, `/admin/members`, `/my-courses`, `/learn/courses/[courseId]`, `/pricing`, `/onboarding`, `/login`, `/join`, `/get-started`, `/auth`, and the `/auth/*` route handlers). No path should gain a `(group)` segment.

**Note on E2E:** Playwright is CI-only — do not run it locally. URLs are unchanged, so the specs should pass on push; flag if any spec hard-codes a filesystem path rather than a URL.

**Environment guard:** use the single unrestricted Vitest run if the sandbox blocks it; do **not** loop on installs.

## Report back
1. `verify` output.
2. The new `src/app/` tree.
3. Confirm: root `layout.tsx` unmoved, no per-group layouts added, every URL unchanged (list them), `e2e/` untouched, footer `©` fixed.
4. `git diff --stat`.

This is the last restructure phase. After it verifies, the refactor is complete.