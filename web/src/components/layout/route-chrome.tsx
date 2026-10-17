"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

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
    return <BuilderViewport>{children}</BuilderViewport>;
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

function BuilderViewport({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previous = {
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
      rootHeight: root.style.height,
      rootOverflow: root.style.overflow,
    };
    root.style.height = "100%";
    root.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    window.scrollTo({ left: 0, top: 0 });

    return () => {
      root.style.height = previous.rootHeight;
      root.style.overflow = previous.rootOverflow;
      body.style.height = previous.bodyHeight;
      body.style.overflow = previous.bodyOverflow;
    };
  }, []);

  return <div className="h-[100dvh] w-full overflow-hidden">{children}</div>;
}
