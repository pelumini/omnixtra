"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { AppHeaderNav } from "@/components/app/session-header/AppHeaderNav";
import { MarketingHeaderNav } from "@/components/app/session-header/MarketingHeaderNav";
import { logout } from "@/lib/api/auth";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";
import { canManageBilling, canManageMembers } from "@/lib/permissions";
import { homeForSession } from "@/lib/routing/home";
import type { TenantBranding } from "@/lib/schemas/academy";
import { sessionResponseSchema, type SessionResponse } from "@/lib/schemas/auth";

type SessionHeaderProps = {
  branding: TenantBranding;
  initialSession: SessionResponse | null;
  fixtureMode?: boolean;
  refreshSession?: boolean;
  showAuthLink?: boolean;
};

export function SessionHeader({ branding, fixtureMode = false, initialSession, refreshSession = true, showAuthLink = true }: SessionHeaderProps) {
  const [session, setSession] = useState<SessionResponse | null>(initialSession);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const membership = session?.membership ?? null;
  const homeHref = homeForSession(session) ?? "/";
  const isPublicHeader = !showAuthLink && session === null;
  const closeMobile = () => setMobileOpen(false);

  const publicNavLinks = [
    { href: "/#platform", label: "Platform" },
    { href: "/#ai-tutor", label: "AI tutor" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#faq", label: "FAQ" },
  ];

  useEffect(() => {
    function syncScrollState() {
      setIsScrolled(window.scrollY > 0);
    }

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });
    return () => window.removeEventListener("scroll", syncScrollState);
  }, []);

  useEffect(() => {
    if (E2E_FIXTURES_ENABLED && fixtureMode) {
      let cancelled = false;
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      void import("@/lib/e2e-fixtures").then(
        ({ e2eAdminSession, e2eMemberSession }) => {
          if (cancelled) {
            return;
          }
          if (
            path === "/e2e/permissions/member" ||
            path === "/e2e/permissions/member-direct-members" ||
            path === "/e2e/permissions/learner-course" ||
            path === "/e2e/permissions/learner-builder" ||
            (path === "/my-courses" && search.get("e2e") !== "admin")
          ) {
            setSession(e2eMemberSession);
            return;
          }
          if (
            path === "/admin" ||
            path === "/e2e/session-header" ||
            path.startsWith("/e2e/permissions/") ||
            (path === "/my-courses" && search.get("e2e") === "admin")
          ) {
            setSession(e2eAdminSession);
            return;
          }
          setSession(null);
        },
      );
      return () => {
        cancelled = true;
      };
    }
    if (!refreshSession) {
      return undefined;
    }
    let cancelled = false;
    async function loadSession() {
      try {
        const response = await fetch("/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setSession(null);
          }
          return;
        }
        const body: unknown = await response.json();
        const parsed = sessionResponseSchema.safeParse(
          (body as { data?: unknown }).data,
        );
        if (!cancelled) {
          setSession(parsed.success ? parsed.data : null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [fixtureMode, refreshSession]);

  async function signOut() {
    try {
      await logout();
    } catch {
      // The local signup handoff may only have a web-host access cookie.
    }
    await fetch("/auth/local-signout", { method: "POST" });
    window.location.assign("/login");
  }

  const marketingNavProps = { mobileOpen, onCloseMobile: closeMobile, onSignOut: signOut, onToggleMobile: () => setMobileOpen((open) => !open), publicNavLinks, session };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-white transition-shadow ${isScrolled ? "shadow-sm" : "shadow-none"}`}>
      <div className={`landing-container flex items-center gap-3 ${isPublicHeader ? "h-20" : "min-h-14"}`}>
        <Link aria-label={`${branding.tenant_name} home`} className="flex min-w-0 items-center gap-3 text-[var(--foreground)] hover:text-[var(--primary)]" href={homeHref}>
          {isPublicHeader ? <Image alt="OmniXtra" className="h-auto w-36 sm:w-44" height={44} priority src="/images/landing/OmniXtra_logo_brand.svg" width={188} /> : <><span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-semibold text-[var(--primary-foreground)]" style={branding.logo_url ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties) : undefined}>{branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}</span><span className="truncate text-sm font-semibold">{branding.tenant_name}</span></>}
        </Link>
        {membership ? <AppHeaderNav canManageBilling={canManageBilling(membership.org_role)} canManageMembers={canManageMembers(membership.org_role)} membership={membership} onSignOut={signOut} session={session} showAuthLink={showAuthLink} /> : !showAuthLink ? <MarketingHeaderNav {...marketingNavProps} /> : <AppHeaderNav canManageBilling={false} canManageMembers={false} membership={null} onSignOut={signOut} session={session} showAuthLink={showAuthLink} />}
      </div>
      {isPublicHeader && mobileOpen ? <MarketingHeaderNav {...marketingNavProps} mobileOnly /> : null}
    </header>
  );
}
