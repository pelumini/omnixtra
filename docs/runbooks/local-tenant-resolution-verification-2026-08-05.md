# Local Tenant Resolution Verification, 2026-08-05

## Finding

The original localhost signup flow failed because the browser created the tenant
from the bare host and then navigated to `{academy}.localhost:3001/admin`.
Host-scoped cookies set for `localhost` were not sent to the tenant subdomain,
so SSR rendered the admin page without a session and redirected to `/login`.

Two attempted cookie-only fixes were rejected by real clients:

- `Domain=.localhost` was rejected by PowerShell/.NET and not stored by Chromium.
- `Secure` cookies over plain `http://{academy}.localhost` were not persisted by Chromium.

## Implemented Local Strategy

- Browser tenant API calls use the matching tenant host, for example
  `http://acme.localhost:8000`.
- `POST /api/v1/tenants` is exempt from pre-existing tenant lookup so the
  prospective tenant host can be used before the tenant row exists.
- Local cookies are host-scoped and non-Secure only when `APP_ENV=local`.
- Production domains continue to use Secure parent-scoped cookies from
  `APP_BASE_DOMAIN`, for example `.omnixtra.app`.
- Signup uses a localhost-only first-party handoff route,
  `/auth/local-signup`, to establish the access-token cookie on the tenant web
  host when browser policy rejects the API response cookie.

## Verification

- Docker Compose rebuild completed for API, worker, and web.
- `docker compose ps` showed API and web healthy.
- Browser signup proof:
  - Created academy from `http://localhost:3001/get-started`.
  - API tenant creation returned `200` from
    `http://{academy}.localhost:8000/api/v1/tenants`.
  - Local handoff returned `307` to
    `http://{academy}.localhost:3001/admin`.
  - Final URL was `http://{academy}.localhost:3001/admin`.
  - Admin dashboard heading was visible.
  - Chromium stored `omnixtra_access` as an httpOnly, SameSite=Lax,
    tenant-host cookie.
- Browser login proof:
  - Tenant-scoped login at `http://{academy}.localhost:3001/login` landed on
    `/admin`.
  - Dashboard heading was visible.
  - Chromium stored `omnixtra_access` and `omnixtra_refresh` cookies for the
    tenant host.
- Bare localhost login proof:
  - `http://localhost:3001/login` showed the academy-host guidance.
  - The Sign in button was disabled.
- Authenticated shell proof, 2026-08-06:
  - Signup landed on `http://{academy}.localhost:3001/admin`.
  - Chromium stored `omnixtra_access` on `{academy}.localhost`.
  - Browser network included `/auth/session`; tenant-host calls returned `200`.
  - Header showed the account menu and no `Sign in` link.
  - Reload preserved the dashboard and account menu.
  - Sign-out redirected to `/login` and cleared the web-host cookie.

## Automated Checks

- `uv --cache-dir ..\.uv-cache run ruff check app tests`
- `uv --cache-dir ..\.uv-cache run ruff format --check app tests`
- `uv --cache-dir ..\.uv-cache run mypy app --strict`
- `uv --cache-dir ..\.uv-cache run pytest`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `PLAYWRIGHT_PORT=3101 npm.cmd run e2e -- e2e/my-courses-routing.spec.ts`
