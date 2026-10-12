# Development Workflow

## Branch Model

- `main` is production. Update it only through reviewed `develop` to `main` merges; never commit to it directly.
- `develop` is the integration branch. All feature work lands and is tested here first.
- `feat/*`, `chore/*`, and `fix/*` are short-lived branches created from `develop`.

## Worktrees

Git worktrees live under `.worktrees/`. Use `.worktrees/develop-integration` to run the dev server and test the integrated application.

Run only one dev server at a time, from `develop-integration`. Do not start dev servers from feature worktrees; doing so caused the web port to drift between 3000 and 3001.

## The Loop

1. Branch from develop: `git checkout -b feat/<name> develop`.
2. Build the branch: `cd web && npm run build`.
3. From `.worktrees/develop-integration`, merge it: `git merge --no-ff feat/<name>`.
4. Test the integrated app at `http://localhost:3001`. Tenant URLs use `http://<tenant>.localhost:3001`.
5. After develop is verified, open a reviewed promotion to `main`.

## Dev Server

The web `dev` and `start` scripts are pinned to port 3001 with `next dev -p 3001` and `next start -p 3001`. This matches the Docker Compose web port.

If port 3001 is already in use, clear the stale server and restart:

```bash
npx kill-port 3001
npm run dev
```

## Hygiene

- Do not commit scratch or phase documents matching `PHASE*.md`.
- Keep feature branches small.
- Merge shared-component refactors before branches that consume them.
