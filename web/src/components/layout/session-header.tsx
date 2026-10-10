"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { signOutAndRedirect } from "@/lib/auth/sign-out";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";
import { homeForSession } from "@/lib/routing/home";
import { sessionResponseSchema, type SessionResponse } from "@/lib/schemas/auth";

import { AppHeaderNav } from "./session-header/AppHeaderNav";
import { MarketingHeaderNav } from "./session-header/MarketingHeaderNav";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { CSSProperties } from "react";

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
  const pathname = usePathname() ?? "";
  const isShellHeader =
    membership !== null &&
    (pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname === "/my-courses" ||
      pathname.startsWith("/my-courses/"));
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

  const marketingNavProps = { mobileOpen, onCloseMobile: closeMobile, onSignOut: signOutAndRedirect, onToggleMobile: () => setMobileOpen((open) => !open), publicNavLinks, session };

  return (
    <header className={`fixed right-0 top-0 z-50 border-b border-[var(--border)] bg-white transition-[left,box-shadow] ${isShellHeader ? "left-0 h-14 md:left-[var(--app-sidebar-width,13rem)] md:h-16" : "left-0"} ${isScrolled ? "shadow-sm" : "shadow-none"}`}>
      <div className={`${isShellHeader ? "flex h-full items-center px-4 sm:px-6" : `landing-container flex items-center gap-3 ${isPublicHeader ? "h-20" : "min-h-14"}`}`}>
        {!isShellHeader ? <Link aria-label={`${branding.tenant_name} home`} className="flex min-w-0 items-center gap-3 text-[var(--foreground)] hover:text-[var(--primary)]" href={homeHref}>
          {isPublicHeader ? <Image alt="OmniXtra" className="h-auto w-36 sm:w-44" height={44} priority src="/images/landing/OmniXtra_logo_brand.svg" width={188} /> : <><span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-bold text-[var(--primary-foreground)]" style={branding.logo_url ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties) : undefined}>{branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}</span><span className="max-w-48 truncate text-base font-bold">{branding.tenant_name}</span></>}
        </Link> : null}
        {membership ? <AppHeaderNav membership={membership} onSignOut={signOutAndRedirect} session={session} showAuthLink={showAuthLink} /> : !showAuthLink ? <MarketingHeaderNav {...marketingNavProps} /> : <AppHeaderNav membership={null} onSignOut={signOutAndRedirect} session={session} showAuthLink={showAuthLink} />}
      </div>
    </header>
  );
}
