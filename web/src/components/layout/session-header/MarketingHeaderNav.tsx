import { Menu, X } from "lucide-react";
import Link from "next/link";

import type { SessionResponse } from "@/lib/schemas/auth";

type PublicNavLink = { href: string; label: string };
type MarketingHeaderNavProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => Promise<void>;
  onToggleMobile: () => void;
  publicNavLinks: PublicNavLink[];
  session: SessionResponse | null;
  mobileOnly?: boolean;
};

export function MarketingHeaderNav({ mobileOpen, mobileOnly = false, onCloseMobile, onSignOut, onToggleMobile, publicNavLinks, session }: MarketingHeaderNavProps) {
  if (mobileOnly) {
    return mobileOpen ? <div className="border-t border-[var(--border)] bg-white lg:hidden" id="mobile-menu"><nav className="landing-container flex flex-col gap-1 py-3 text-sm">{publicNavLinks.map((link) => <Link className="rounded-md px-2 py-2.5 text-[var(--foreground)] hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--primary)]" href={link.href} key={link.href} onClick={onCloseMobile}>{link.label}</Link>)}<Link className="rounded-md px-2 py-2.5 font-semibold text-[var(--foreground)] hover:bg-[var(--color-bg-weak-100)] hover:text-[var(--primary)]" href="/auth" onClick={onCloseMobile}>Sign in</Link><Link className="landing-button landing-button-primary mt-2 w-full" href="/get-started" onClick={onCloseMobile}>Create your academy</Link></nav></div> : null;
  }
  return (
      <nav className="ml-auto flex items-center gap-4 text-sm text-[var(--color-text-sub-500)] lg:gap-8">
        <span className="hidden items-center gap-6 lg:flex xl:gap-8">
          {publicNavLinks.map((link) => <Link className="hover:text-[var(--primary)]" href={link.href} key={link.href}>{link.label}</Link>)}
          <Link className="font-semibold text-[var(--color-text-main-900)] hover:text-[var(--primary)]" href="/auth">Sign in</Link>
        </span>
        <Link className="landing-button landing-button-primary hidden sm:inline-flex" href="/get-started">Create your academy</Link>
        <button aria-controls="mobile-menu" aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close menu" : "Open menu"} className="grid size-10 place-items-center rounded-md text-[var(--color-text-main-900)] hover:text-[var(--primary)] lg:hidden" onClick={onToggleMobile} type="button">
          {mobileOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
        {session ? <details className="relative"><summary className="cursor-pointer list-none rounded-md border border-[var(--border)] px-3 py-2 text-[var(--foreground)] hover:border-[var(--primary)]">{session.user.full_name}</summary><div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg"><p className="font-medium text-[var(--foreground)]">{session.user.full_name}</p><p className="mt-1 text-xs text-slate-500">{session.user.email}</p><button className="mt-3 w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]" onClick={onSignOut} type="button">Sign out</button></div></details> : null}
      </nav>
  );
}
