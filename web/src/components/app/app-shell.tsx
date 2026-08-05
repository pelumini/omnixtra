import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { canManageBilling, canManageMembers } from "@/lib/permissions";
import type { OrgRole, TenantBranding } from "@/lib/schemas";

type AppShellProps = {
  branding: TenantBranding;
  children: ReactNode;
  viewerRole: OrgRole;
};

export function AppShell({ branding, children, viewerRole }: AppShellProps) {
  const adminNav = canManageMembers(viewerRole);

  return (
    <>
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4">
          <div
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-md bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-semibold text-[var(--primary-foreground)]"
            style={
              branding.logo_url
                ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties)
                : undefined
            }
          >
            {branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {branding.tenant_name}
          </span>
          <nav className="ml-auto flex items-center gap-4 text-sm text-slate-600">
            <Link className="hover:text-[var(--primary)]" href="/my-courses">
              My Courses
            </Link>
            <Link className="hover:text-[var(--primary)]" href="/admin/courses">
              Courses
            </Link>
            {adminNav ? (
              <Link className="hover:text-[var(--primary)]" href="/admin/members">
                Members
              </Link>
            ) : null}
            {canManageBilling(viewerRole) ? (
              <Link className="hover:text-[var(--primary)]" href="/pricing">
                Billing
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
