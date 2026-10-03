import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { MembersView } from "@/features/members";
import { InvitationPending } from "@/components/app/invitation-pending";
import { getTenantBranding } from "@/lib/api/academy";
import { getAuthSession } from "@/lib/api/auth";
import { getBillingPlans, getBillingSubscription, type BillingPlan } from "@/features/billing";
import { getMemberships, type Membership } from "@/features/members";
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
  const authSession = await loadSession(context);

  if (authSession === null) {
    redirect("/login");
  }
  if (authSession.data.membership === null) {
    return <InvitationPending session={authSession.data} />;
  }

  let memberships: Membership[] = [];
  let loadError: string | null = null;
  const viewerRole: OrgRole = authSession.data.membership.org_role;
  let adminSeatsIncluded = starterAdminSeats;
  const branding = await loadBranding(context);

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

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}

async function loadBranding(context: { cookie?: string; host?: string }) {
  try {
    const response = await getTenantBranding(context);
    return response.data;
  } catch {
    return fallbackBranding;
  }
}
