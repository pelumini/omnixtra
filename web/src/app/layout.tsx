import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { headers } from "next/headers";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";

import { AppToaster } from "@/components/app/app-toaster";
import { SessionHeader } from "@/components/app/session-header";
import { getAuthSession, getTenantBranding } from "@/lib/api";
import { e2eFixturesEnabled } from "@/lib/e2e-enabled";
import type { SessionResponse, TenantBranding } from "@/lib/schemas";
import { tenantSlugFromHost } from "@/lib/tenant-host";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "OmniXtra",
  description: "AI-native learning management platform",
};

const defaultBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "OmniXtra",
  time_zone: "UTC",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const [branding, session] = await Promise.all([loadBranding(context.host), loadSession(context)]);
  const showAuthLink = tenantSlugFromHost(context.host ?? "") !== null;

  return (
    <html lang={branding.locale}>
      <body
        className={`${inter.variable} ${geist.variable} font-sans`}
        style={{ "--primary": branding.primary_color } as CSSProperties}
      >
        <SessionHeader
          branding={branding}
          fixtureMode={e2eFixturesEnabled()}
          initialSession={session}
          refreshSession={!e2eFixturesEnabled()}
          showAuthLink={showAuthLink}
        />
        <div className="pt-14">{children}</div>
        <AppToaster />
      </body>
    </html>
  );
}

async function loadBranding(host: string | undefined): Promise<TenantBranding> {
  try {
    const response = await getTenantBranding({ host });
    return response.data;
  } catch {
    return defaultBranding;
  }
}

async function loadSession(context: {
  cookie?: string;
  host?: string;
}): Promise<SessionResponse | null> {
  try {
    const response = await getAuthSession(context);
    return response.data;
  } catch {
    return null;
  }
}
