import type { Metadata } from "next";
import { headers } from "next/headers";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";

import { SessionHeader } from "@/components/app/session-header";
import { getAuthSession, getTenantBranding } from "@/lib/api";
import { e2eAdminSession, e2eFixturesEnabled } from "@/lib/e2e-fixtures";
import type { SessionResponse, TenantBranding } from "@/lib/schemas";

import "./globals.css";

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

  return (
    <html lang={branding.locale}>
      <body style={{ "--primary": branding.primary_color } as CSSProperties}>
        <SessionHeader
          branding={branding}
          initialSession={session}
          refreshSession={!e2eFixturesEnabled()}
        />
        {children}
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
  if (e2eFixturesEnabled()) {
    return e2eAdminSession;
  }
  try {
    const response = await getAuthSession(context);
    return response.data;
  } catch {
    return null;
  }
}
