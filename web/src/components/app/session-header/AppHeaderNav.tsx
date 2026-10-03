import Link from "next/link";

import type { SessionResponse } from "@/lib/schemas/auth";

type AppHeaderNavProps = {
  canManageBilling: boolean;
  canManageMembers: boolean;
  membership: SessionResponse["membership"];
  onSignOut: () => Promise<void>;
  session: SessionResponse | null;
  showAuthLink: boolean;
};

export function AppHeaderNav({
  canManageBilling,
  canManageMembers,
  membership,
  onSignOut,
  session,
  showAuthLink,
}: AppHeaderNavProps) {
  return (
    <nav className="ml-auto flex items-center gap-4 text-sm text-[var(--color-text-sub-500)] lg:gap-8">
      {membership ? <><Link className="hover:text-[var(--primary)]" href="/my-courses">My Courses</Link>
      <Link className="hover:text-[var(--primary)]" href="/admin/courses">Courses</Link>
      {canManageMembers ? <Link className="hover:text-[var(--primary)]" href="/admin/members">Members</Link> : null}
      {canManageBilling ? <Link className="hover:text-[var(--primary)]" href="/pricing">Billing</Link> : null}</> : null}
      {session ? <details className="relative">
        <summary className="cursor-pointer list-none rounded-md border border-[var(--border)] px-3 py-2 text-[var(--foreground)] hover:border-[var(--primary)]">{session.user.full_name}</summary>
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg">
          <p className="font-medium text-[var(--foreground)]">{session.user.full_name}</p>
          <p className="mt-1 text-xs text-slate-500">{session.user.email}</p>
          {membership ? <p className="mt-2 text-xs uppercase text-slate-500">{membership.org_role.replace("_", " ")}</p> : null}
          <button className="mt-3 w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]" onClick={onSignOut} type="button">Sign out</button>
        </div>
      </details> : showAuthLink ? <Link className="hover:text-[var(--primary)]" href="/login">Sign in</Link> : null}
    </nav>
  );
}
