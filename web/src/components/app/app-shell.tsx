"use client";

import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  HelpCircle,
  Home,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

import { canManageBilling, canManageMembers } from "@/lib/permissions";
import { homeForOrgRole } from "@/lib/routing/home";
import type { OrgRole, TenantBranding } from "@/lib/schemas";

type AppShellProps = {
  branding: TenantBranding;
  children: ReactNode;
  initialCollapsed?: boolean;
  viewerRole: OrgRole;
};

type AppNavItem = {
  href: string;
  icon: typeof BarChart3;
  label: string;
  roles: OrgRole[];
};

const navItems: AppNavItem[] = [
  { href: "/admin", icon: Home, label: "Dashboard", roles: ["tenant_admin"] },
  { href: "/my-courses", icon: GraduationCap, label: "My Courses", roles: ["tenant_admin", "member"] },
  { href: "/admin/courses", icon: BookOpen, label: "Courses", roles: ["tenant_admin", "member"] },
  { href: "/admin/members", icon: Users, label: "Members", roles: ["tenant_admin"] },
  { href: "/pricing", icon: CreditCard, label: "Billing", roles: ["tenant_admin"] },
];

export function AppShell({
  branding,
  children,
  initialCollapsed = false,
  viewerRole,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const homeHref = homeForOrgRole(viewerRole);
  const visibleItems = navItems.filter((item) => {
    if (!item.roles.includes(viewerRole)) {
      return false;
    }
    if (item.label === "Members") {
      return canManageMembers(viewerRole);
    }
    if (item.label === "Billing") {
      return canManageBilling(viewerRole);
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f8fb]">
      <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)]">
        <aside
          className={`border-b border-[var(--color-primary-dark)] bg-[var(--primary)] text-white md:sticky md:top-14 md:flex md:h-[calc(100vh-3.5rem)] md:self-start md:flex-col md:border-b-0 md:border-r ${
            collapsed ? "md:w-24" : "md:w-72"
          }`}
        >
          <div className="flex min-h-16 items-center gap-3 border-b border-white/15 px-4">
            <Link
              aria-label={`${branding.tenant_name} home`}
              className="flex min-w-0 items-center gap-3 text-white"
              href={homeHref}
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-md bg-white bg-contain bg-center bg-no-repeat text-sm font-bold text-[var(--primary)]"
                style={
                  branding.logo_url
                    ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties)
                    : undefined
                }
              >
                {branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}
              </span>
              {!collapsed ? (
                <span className="truncate text-base font-semibold">{branding.tenant_name}</span>
              ) : null}
            </Link>
            <button
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              className="ml-auto hidden size-9 place-items-center rounded-md border border-white/25 text-white hover:bg-white/10 md:grid"
              onClick={() => setCollapsed((value) => !value)}
              type="button"
            >
              {collapsed ? (
                <ChevronRight aria-hidden="true" className="size-4" />
              ) : (
                <ChevronLeft aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:grid md:overflow-visible md:py-4">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className={`flex h-12 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10 ${
                    collapsed ? "md:justify-center" : ""
                  }`}
                  href={item.href}
                  key={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden px-3 pb-4 md:block">
            <Link
              className={`flex h-12 items-center gap-3 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10 ${
                collapsed ? "justify-center" : ""
              }`}
              href="/admin"
              title={collapsed ? "Help Center" : undefined}
            >
              <HelpCircle aria-hidden="true" className="size-5 shrink-0" />
              {!collapsed ? <span>Help Center</span> : null}
            </Link>
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
