"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import { logout } from "@/lib/api";
import { e2eAdminSession, e2eMemberSession } from "@/lib/e2e-fixtures";
import { canManageBilling, canManageMembers } from "@/lib/permissions";
import { sessionResponseSchema, type SessionResponse, type TenantBranding } from "@/lib/schemas";

type SessionHeaderProps = {
  branding: TenantBranding;
  initialSession: SessionResponse | null;
  fixtureMode?: boolean;
  refreshSession?: boolean;
};

export function SessionHeader({
  branding,
  fixtureMode = false,
  initialSession,
  refreshSession = true,
}: SessionHeaderProps) {
  const [session, setSession] = useState<SessionResponse | null>(initialSession);
  const membership = session?.membership ?? null;

  useEffect(() => {
    if (fixtureMode) {
      const path = window.location.pathname;
      if (
        path === "/e2e/permissions/member" ||
        path === "/e2e/permissions/member-direct-members" ||
        path === "/e2e/permissions/learner-course" ||
        path === "/e2e/permissions/learner-builder"
      ) {
        setSession(e2eMemberSession);
        return undefined;
      }
      setSession(e2eAdminSession);
      return undefined;
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
          ) : (
            <Link className="hover:text-[var(--primary)]" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
