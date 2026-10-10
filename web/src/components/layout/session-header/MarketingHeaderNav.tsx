import { Menu, X } from "lucide-react";
import Link from "next/link";

import { Dropdown } from "@/components/ui/dropdown";

import type { SessionResponse } from "@/lib/schemas/auth";

type PublicNavLink = { href: string; label: string };
type MarketingHeaderNavProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => Promise<void>;
  onToggleMobile: () => void;
  publicNavLinks: PublicNavLink[];
  session: SessionResponse | null;
};

export function MarketingHeaderNav({
  mobileOpen,
  onCloseMobile,
  onSignOut,
  onToggleMobile,
  publicNavLinks,
  session,
}: MarketingHeaderNavProps) {
  return (
    <nav className="ml-auto flex items-center gap-4 text-sm text-[var(--color-text-sub-500)] lg:gap-8">
      <span className="hidden items-center gap-6 lg:flex xl:gap-8">
        {publicNavLinks.map((link) => (
          <Link className="hover:text-[var(--primary)]" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
        <Link className="font-semibold text-[var(--color-text-main-900)] hover:text-[var(--primary)]" href="/auth">
          Sign in
        </Link>
      </span>
      <Link className="landing-button landing-button-primary hidden sm:inline-flex" href="/get-started">
        Create your academy
      </Link>
      <Dropdown
        onOpenChange={(open) => {
          if (open !== mobileOpen) {
            if (open) {
              onToggleMobile();
            } else {
              onCloseMobile();
            }
          }
        }}
        open={mobileOpen}
        panelClassName="fixed inset-x-0 top-20 border-t border-[var(--border)] bg-white lg:hidden"
        rootClassName="relative lg:hidden"
        trigger={mobileOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        triggerClassName="grid size-10 place-items-center rounded-md text-[var(--color-text-main-900)] hover:text-[var(--primary)]"
        triggerLabel={mobileOpen ? "Close menu" : "Open menu"}
      >
        {(close) => (
          <div className="landing-container flex flex-col gap-1 py-3">
            {publicNavLinks.map((link) => (
              <Link className="rounded-md px-2 py-2.5 text-[var(--foreground)] hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--primary)]" href={link.href} key={link.href} onClick={close} role="menuitem">
                {link.label}
              </Link>
            ))}
            <Link className="rounded-md px-2 py-2.5 font-semibold text-[var(--foreground)] hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--primary)]" href="/auth" onClick={close} role="menuitem">
              Sign in
            </Link>
            <Link className="landing-button landing-button-primary mt-2 w-full" href="/get-started" onClick={close} role="menuitem">
              Create your academy
            </Link>
          </div>
        )}
      </Dropdown>
      {session ? (
        <Dropdown
          panelClassName="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg"
          trigger={session.user.full_name}
          triggerClassName="rounded-md border border-[var(--border)] px-3 py-2 text-[var(--foreground)] hover:border-[var(--primary)]"
          triggerLabel="Open user menu"
        >
          {(close) => (
            <>
              <p className="font-medium text-[var(--foreground)]">{session.user.full_name}</p>
              <p className="mt-1 text-xs text-slate-500">{session.user.email}</p>
              <button
                className="mt-3 w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
                onClick={() => {
                  close();
                  void onSignOut();
                }}
                role="menuitem"
                type="button"
              >
                Sign out
              </button>
            </>
          )}
        </Dropdown>
      ) : null}
    </nav>
  );
}
