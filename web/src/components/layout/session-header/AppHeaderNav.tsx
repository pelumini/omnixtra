"use client";

import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { mainItems, otherItems, visibleNavItems } from "@/components/layout/nav-items";
import { Dropdown } from "@/components/ui/dropdown";

import type { SessionResponse } from "@/lib/schemas/auth";

type AppHeaderNavProps = {
  membership: SessionResponse["membership"];
  onSignOut: () => Promise<void>;
  session: SessionResponse | null;
  showAuthLink: boolean;
};

const routeTitles: Array<[prefix: string, title: string]> = [
  ["/admin/members", "Members"],
  ["/admin/courses", "Courses"],
  ["/my-courses", "My Courses"],
  ["/onboarding", "Settings"],
  ["/pricing", "Billing"],
  ["/admin", "Dashboard"],
];

export function AppHeaderNav({ membership, onSignOut, session, showAuthLink }: AppHeaderNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const title = routeTitles.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "Academy";

  if (!session) {
    return showAuthLink ? <Link className="ml-auto text-sm hover:text-[var(--primary)]" href="/login">Sign in</Link> : null;
  }

  const role = membership?.org_role === "tenant_admin" ? "Admin" : "Member";
  const initials = session.user.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";

  return (
    <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-5">
      {membership ? <Dropdown
        onOpenChange={setDrawerOpen}
        open={drawerOpen}
        panelClassName="fixed inset-0 top-14 z-40 bg-black/30 md:hidden"
        rootClassName="relative mr-auto md:hidden"
        trigger={<Menu aria-hidden="true" className="size-5" />}
        triggerClassName="grid size-10 place-items-center rounded-md text-[var(--color-icon-sub-500)] hover:bg-[var(--color-bg-weak-100)]"
        triggerLabel="Open navigation menu"
      >
        {(close) => <>
          <button aria-label="Close navigation menu" className="absolute inset-0 cursor-default" onClick={close} type="button" />
          <div className="relative flex h-full w-[min(20rem,85vw)] flex-col overflow-y-auto bg-white px-4 py-5 text-[var(--color-text-sub-500)] shadow-xl">
            <MobileNavGroup items={visibleNavItems(mainItems, membership.org_role)} label="MAIN" onSelect={close} pathname={pathname} />
            <MobileNavGroup items={visibleNavItems(otherItems, membership.org_role)} label="OTHERS" onSelect={close} pathname={pathname} />
            <button className="mt-2 flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-[#d3294b] hover:bg-[#fff1f3]" onClick={() => { close(); void onSignOut(); }} role="menuitem" type="button">
              <LogOut aria-hidden="true" className="size-5" /> Logout Account
            </button>
          </div>
        </>}
      </Dropdown> : null}
      <p className="mr-auto hidden truncate text-xl font-semibold text-[var(--foreground)] md:block">{title}</p>
      {/* TODO: replace with notifications popover when the notifications backend exists. */}
      <button aria-label="Notifications" className="grid size-10 place-items-center rounded-full text-[var(--color-icon-sub-500)] hover:bg-[var(--color-bg-weak-100)]" type="button">
        <Bell aria-hidden="true" className="size-5" />
      </button>
      <Dropdown
        panelClassName="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg"
        trigger={<>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-40 truncate text-sm font-medium leading-5 text-[var(--foreground)]">{session.user.full_name}</span>
            <span className="block text-xs leading-4 text-[var(--color-text-sub-500)]">{role}</span>
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-primary-lighter)] text-xs font-bold text-[var(--primary)]">{initials}</span>
          <ChevronDown aria-hidden="true" className="hidden size-4 text-[var(--color-icon-sub-500)] sm:block" />
        </>}
        triggerClassName="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[var(--color-bg-weak-100)]"
        triggerLabel="Open user menu"
      >
        {(close) => <>
          <p className="font-semibold text-[var(--foreground)]">{session.user.full_name}</p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-sub-500)]">{session.user.email}</p>
          <p className="mt-2 text-xs font-semibold uppercase text-[var(--color-text-sub-500)]">{role}</p>
          <button className="mt-3 flex w-full items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-semibold hover:border-[var(--primary)]" onClick={() => { close(); void onSignOut(); }} role="menuitem" type="button">
            <LogOut aria-hidden="true" className="size-4" /> Sign out
          </button>
        </>}
      </Dropdown>
    </div>
  );
}

function MobileNavGroup({ items, label, onSelect, pathname }: { items: ReturnType<typeof visibleNavItems>; label: string; onSelect: () => void; pathname: string }) {
  return <div>
    <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase text-[var(--color-text-soft-400)]">{label}</p>
    <div className="grid gap-1">{items.map((item) => {
      const Icon = item.icon;
      const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link aria-current={active ? "page" : undefined} className={`relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${active ? "bg-[var(--color-primary-lighter)] text-[var(--primary)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--primary)]" : "hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--foreground)]"}`} href={item.href} key={item.label} onClick={onSelect} role="menuitem">
        <Icon aria-hidden="true" className="size-5" /> {item.label}
      </Link>;
    })}</div>
  </div>;
}
