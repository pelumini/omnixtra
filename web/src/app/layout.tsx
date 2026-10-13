import { headers } from "next/headers";


import { AppToaster } from "@/components/layout/app-toaster";
import { RouteChrome } from "@/components/layout/route-chrome";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";
import { e2eFixturesEnabled } from "@/lib/e2e-enabled";
import { tenantSlugFromHost } from "@/lib/tenant-host";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";

import "@fontsource-variable/mulish";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniXtra",
  description: "AI-native learning management platform",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const [branding, session] = await Promise.all([
    getBrandingOrDefault({ host: context.host }),
    getSessionOrNull(context),
  ]);
  const showAuthLink = tenantSlugFromHost(context.host ?? "") !== null;

  return (
    <html lang={branding.locale}>
      <body
        className="font-sans"
        style={{ "--tenant-primary": branding.primary_color } as CSSProperties}
      >
        <RouteChrome
          branding={branding}
          fixtureMode={e2eFixturesEnabled()}
          initialSession={session}
          refreshSession={!e2eFixturesEnabled()}
          showAuthLink={showAuthLink}
        >
          {children}
        </RouteChrome>
        <AppToaster />
      </body>
    </html>
  );
}
