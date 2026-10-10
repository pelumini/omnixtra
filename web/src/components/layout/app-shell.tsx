"use client";

import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOutAndRedirect } from "@/lib/auth/sign-out";
import { homeForOrgRole } from "@/lib/routing/home";

import { mainItems, otherItems, visibleNavItems } from "./nav-items";

import type { AppNavItem } from "./nav-items";
import type { TenantBranding } from "@/lib/schemas/academy";
import type { OrgRole } from "@/lib/schemas/common";
import type { CSSProperties, ReactNode } from "react";

type AppShellProps = { branding: TenantBranding; children: ReactNode; initialCollapsed?: boolean; viewerRole: OrgRole };
export function AppShell({ branding, children, initialCollapsed = false, viewerRole }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const root = document.documentElement;
    const previousWidth = root.style.getPropertyValue("--app-sidebar-width");
    root.style.setProperty("--app-sidebar-width", collapsed ? "5rem" : "13rem");
    return () => {
      if (previousWidth) {
        root.style.setProperty("--app-sidebar-width", previousWidth);
      } else {
        root.style.removeProperty("--app-sidebar-width");
      }
    };
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-weak-100)] md:-mt-14">
      <div className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)]">
        <aside className={`relative hidden border-b border-[var(--color-stroke-soft-200)] bg-white text-[var(--color-text-sub-500)] md:sticky md:top-0 md:flex md:h-screen md:self-start md:flex-col md:border-b-0 md:border-r ${collapsed ? "md:w-20" : "md:w-52"}`}>
          <div className="hidden h-16 items-center border-b border-[var(--color-stroke-soft-200)] px-4 md:flex">
            <Link aria-label={`${branding.tenant_name} home`} className={`flex min-w-0 items-center gap-3 text-[var(--foreground)] ${collapsed ? "justify-center" : ""}`} href={homeForOrgRole(viewerRole)}>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-bold text-white" style={branding.logo_url ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties) : undefined}>
                {branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}
              </span>
              {!collapsed ? <span className="truncate text-base font-bold">{branding.tenant_name}</span> : null}
            </Link>
            <button aria-expanded={!collapsed} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className="absolute -right-3 top-10 z-10 grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white shadow-sm hover:bg-[var(--color-bg-weak-100)]" onClick={() => setCollapsed((value) => !value)} type="button">
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:grid md:overflow-visible md:py-5">
            <NavGroup collapsed={collapsed} items={visibleNavItems(mainItems, viewerRole)} label="MAIN" pathname={pathname} />
            <NavGroup collapsed={collapsed} items={visibleNavItems(otherItems, viewerRole)} label="OTHERS" pathname={pathname} />
            <button className={`flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#d3294b] hover:bg-[#fff1f3] ${collapsed ? "md:justify-center" : ""}`} onClick={signOutAndRedirect} title={collapsed ? "Logout Account" : undefined} type="button">
              <LogOut aria-hidden="true" className="size-5 shrink-0" />
              {!collapsed ? <span>Logout Account</span> : null}
            </button>
          </nav>
        </aside>
        <div className="min-w-0 overflow-hidden pt-14 md:pt-16">{children}</div>
      </div>
    </div>
  );
}

function NavGroup({ collapsed, items, label, pathname }: { collapsed: boolean; items: AppNavItem[]; label?: string; pathname: string }) {
  return <div className="contents md:block">
    {!collapsed && label ? <p className="hidden px-3 pb-2 pt-5 text-[10px] font-bold uppercase text-[var(--color-text-soft-400)] md:block">{label}</p> : null}
    <div className="contents md:grid md:gap-1">{items.map((item) => {
      const Icon = item.icon;
      const active = isActivePath(pathname, item.href);
      return <Link aria-current={active ? "page" : undefined} className={`relative flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors ${active ? "bg-[var(--color-primary-lighter)] text-[var(--primary)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--primary)]" : "hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--foreground)]"} ${collapsed ? "md:justify-center" : ""}`} href={item.href} key={item.label} title={collapsed ? item.label : undefined}>
        <Icon aria-hidden="true" className="size-5 shrink-0" />{!collapsed ? <span>{item.label}</span> : null}
      </Link>;
    })}</div>
  </div>;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
