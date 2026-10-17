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
const courseBuilderPath = /^\/admin\/courses\/[^/]+$/;

export function RouteChrome({ branding, children, fixtureMode, initialSession, refreshSession, showAuthLink }: RouteChromeProps) {
  const pathname = usePathname() ?? "";
  const isTenantSignIn = pathname === "/" && showAuthLink && initialSession === null;
  const isLandingPage = pathname === "/" && !showAuthLink;

  if (courseBuilderPath.test(pathname)) {
    return <div className="h-[100dvh] w-full overflow-hidden">{children}</div>;
  }

  if (fullBleedAuthPaths.has(pathname) || isTenantSignIn) {
    return children;
  }

  return <>
    {isLandingPage ? <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 size-px" id="landing-header-sentinel" /> : null}
    <SessionHeader branding={branding} fixtureMode={fixtureMode} initialSession={initialSession} observeLandingElevation={isLandingPage} refreshSession={refreshSession} showAuthLink={showAuthLink} />
    <div className={showAuthLink ? "pt-14" : "pt-20"}>{children}</div>
  </>;
}
