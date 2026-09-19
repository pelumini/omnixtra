"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { logout } from "@/lib/api";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";
import { canManageBilling, canManageMembers } from "@/lib/permissions";
import { homeForSession } from "@/lib/routing/home";
import { sessionResponseSchema, type SessionResponse, type TenantBranding } from "@/lib/schemas";

type SessionHeaderProps = {
  branding: TenantBranding;
  initialSession: SessionResponse | null;
  fixtureMode?: boolean;
  refreshSession?: boolean;
  showAuthLink?: boolean;
};

export function SessionHeader({
  branding,
  fixtureMode = false,
  initialSession,
  refreshSession = true,
  showAuthLink = true,
}: SessionHeaderProps) {
  const [session, setSession] = useState<SessionResponse | null>(initialSession);
  const [isScrolled, setIsScrolled] = useState(false);
  const membership = session?.membership ?? null;
  const homeHref = homeForSession(session) ?? "/";

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
      void import("@/lib/e2e-fixtures").then(({ e2eAdminSession, e2eMemberSession }) => {
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
      });
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
        const parsed = sessionResponseSchema.safeParse((body as { data?: unknown }).data);
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-[var(--border)] bg-white transition-shadow ${
        isScrolled ? "shadow-sm" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4">
        <Link
          aria-label={`${branding.tenant_name} home`}
          className="flex min-w-0 items-center gap-3 text-[var(--foreground)] hover:text-[var(--primary)]"
          href={homeHref}
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-semibold text-[var(--primary-foreground)]"
            style={
              branding.logo_url
                ? ({ backgroundImage: `url(${branding.logo_url})` } as CSSProperties)
                : undefined
            }
          >
            {branding.logo_url ? null : branding.tenant_name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-sm font-semibold">{branding.tenant_name}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-slate-600">
          {membership ? (
            <>
              <Link className="hover:text-[var(--primary)]" href="/my-courses">
                My Courses
              </Link>
              <Link className="hover:text-[var(--primary)]" href="/admin/courses">
                Courses
              </Link>
              {canManageMembers(membership.org_role) ? (
                <Link className="hover:text-[var(--primary)]" href="/admin/members">
                  Members
                </Link>
              ) : null}
              {canManageBilling(membership.org_role) ? (
                <Link className="hover:text-[var(--primary)]" href="/pricing">
                  Billing
                </Link>
              ) : null}
            </>
          ) : !showAuthLink ? (
            <>
              <Link className="hidden hover:text-[var(--primary)] sm:inline" href="/#platform">
                Platform
              </Link>
              <Link className="hidden hover:text-[var(--primary)] sm:inline" href="/#ai-tutor">
                AI Tutor
              </Link>
              <Link className="hidden hover:text-[var(--primary)] sm:inline" href="/#pricing">
                Pricing
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] px-4 font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                href="/get-started"
              >
                Create academy
              </Link>
            </>
          ) : null}
          {session ? (
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md border border-[var(--border)] px-3 py-2 text-[var(--foreground)] hover:border-[var(--primary)]">
                {session.user.full_name}
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg">
                <p className="font-medium text-[var(--foreground)]">{session.user.full_name}</p>
                <p className="mt-1 text-xs text-slate-500">{session.user.email}</p>
                {membership ? (
                  <p className="mt-2 text-xs uppercase text-slate-500">
                    {membership.org_role.replace("_", " ")}
                  </p>
                ) : null}
                <button
                  className="mt-3 w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
                  onClick={signOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </details>
          ) : showAuthLink ? (
            <Link className="hover:text-[var(--primary)]" href="/login">
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
