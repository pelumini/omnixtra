import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { InvitationPending } from "@/components/app/invitation-pending";
import { PublicLanding } from "@/components/app/public-landing";
import { SignInView } from "@/components/auth/sign-in-view";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";
import { homeForSession } from "@/lib/routing/home";
import type { TenantBranding } from "@/lib/schemas/academy";
import { tenantSlugFromHost } from "@/lib/tenant-host";

type HomeProps = {
  searchParams?: Promise<{
    e2e_session?: string;
  }>;
};

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "your academy",
  time_zone: "UTC",
};

export default async function Home({ searchParams }: HomeProps) {
  if (E2E_FIXTURES_ENABLED) {
    const e2eSession = (await searchParams)?.e2e_session;
    if (e2eSession === "admin") {
      redirect("/admin");
    }
    if (e2eSession === "member") {
      redirect("/my-courses?e2e=member");
    }
    if (e2eSession === "pending") {
      const { e2ePendingSession } = await import("@/lib/e2e-fixtures");
      return <InvitationPending session={e2ePendingSession} />;
    }
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const isAcademyHost = tenantSlugFromHost(host) !== null;
  if (!isAcademyHost) {
    return <PublicLanding />;
  }

  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host,
  };
  const session = await getSessionOrNull(context);

  if (session === null) {
    const branding = await getBrandingOrDefault(context, fallbackBranding);
    return <SignInView academyName={branding.tenant_name} />;
  }
  if (session.membership === null) {
    return <InvitationPending session={session} />;
  }
  redirect(homeForSession(session) ?? "/");
}
