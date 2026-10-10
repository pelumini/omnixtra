"use client";

import { usePathname } from "next/navigation";

import { SessionHeader } from "@/components/layout/session-header";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { SessionResponse } from "@/lib/schemas/auth";
import type { ReactNode } from "react";

type RouteChromeProps = {
  branding: TenantBranding;
  children: ReactNode;
  fixtureMode: boolean;
  initialSession: SessionResponse | null;
  refreshSession: boolean;
  showAuthLink: boolean;
};

const fullBleedAuthPaths = new Set(["/auth", "/forgot-password", "/get-started", "/join", "/login"]);

export function RouteChrome({ branding, children, fixtureMode, initialSession, refreshSession, showAuthLink }: RouteChromeProps) {
  const pathname = usePathname() ?? "";

  if (fullBleedAuthPaths.has(pathname)) {
    return children;
  }

  return <>
    <SessionHeader branding={branding} fixtureMode={fixtureMode} initialSession={initialSession} refreshSession={refreshSession} showAuthLink={showAuthLink} />
    <div className={showAuthLink ? "pt-14" : "pt-20"}>{children}</div>
  </>;
}
