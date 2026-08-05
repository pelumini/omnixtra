import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";

import { getTenantBranding } from "@/lib/api";
import type { TenantBranding } from "@/lib/schemas";

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
  const branding = await loadBranding(requestHeaders.get("host") ?? undefined);

  return (
    <html lang={branding.locale}>
      <body style={{ "--primary": branding.primary_color } as CSSProperties}>
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4">
            <div
              aria-hidden="true"
              className="grid size-8 place-items-center bg-[var(--primary)] bg-contain bg-center bg-no-repeat text-sm font-semibold text-[var(--primary-foreground)]"
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
            <nav className="ml-auto flex items-center gap-3 text-sm text-gray-600">
              <Link className="hover:text-[var(--primary)]" href="/login">
                Sign in
              </Link>
            </nav>
          </div>
        </header>
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
