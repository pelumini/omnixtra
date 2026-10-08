import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { InvitationPending } from "@/features/auth";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { ReactNode } from "react";

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (E2E_FIXTURES_ENABLED) {
    return <>{children}</>;
  }

  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const session = await getSessionOrNull(context);

  if (session === null) {
    redirect("/login");
  }
  if (session.membership === null) {
    return <InvitationPending session={session} />;
  }

  const branding = await getBrandingOrDefault(context, fallbackBranding);

  return (
    <AppShell branding={branding} viewerRole={session.membership.org_role}>
      {children}
    </AppShell>
  );
}
