import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { InvitationPending } from "@/features/auth";
import { getBillingPlans, getBillingSubscription, type BillingPlan } from "@/features/billing";
import { MembersView } from "@/features/members";
import { getMemberships, type Membership } from "@/features/members";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { OrgRole } from "@/lib/schemas/common";

const starterAdminSeats = 3;
const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function AdminMembersPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const context = { cookie, host };
  const authSession = await getSessionOrNull(context);

  if (authSession === null) {
    redirect("/login");
  }
  if (authSession.membership === null) {
    return <InvitationPending session={authSession} />;
  }

  let memberships: Membership[] = [];
  let loadError: string | null = null;
  const viewerRole: OrgRole = authSession.membership.org_role;
  let adminSeatsIncluded = starterAdminSeats;
  const branding = await getBrandingOrDefault(context, fallbackBranding);

  try {
    const [membershipsResponse, plansResponse, subscriptionResponse] = await Promise.all([
      getMemberships(context),
      getBillingPlans(context),
      getBillingSubscription(context),
    ]);
    memberships = membershipsResponse.data;
    adminSeatsIncluded = includedAdminSeats(
      plansResponse.data,
      subscriptionResponse.data?.plan_slug ?? "starter",
    );
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Members could not be loaded";
  }

  return (
    <AdminShell branding={branding} viewerRole={viewerRole}>
      <MembersView
        initialMembers={memberships}
        loadError={loadError}
        seats={{
          adminSeatsIncluded,
          adminSeatsUsed: memberships.filter((member) => member.org_role === "tenant_admin").length,
        }}
        viewerRole={viewerRole}
      />
    </AdminShell>
  );
}

function includedAdminSeats(plans: BillingPlan[], planSlug: string) {
  return plans.find((plan) => plan.slug === planSlug)?.included_admin_seats ?? starterAdminSeats;
}
