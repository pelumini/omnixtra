import { headers } from "next/headers";

import { MembersView } from "@/components/admin/members-view";
import { getBillingPlans, getBillingSubscription, getMemberships } from "@/lib/api";
import type { BillingPlan, Membership, OrgRole } from "@/lib/schemas";

const starterAdminSeats = 3;

export default async function AdminMembersPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const context = { cookie, host };
  let memberships: Membership[] = [];
  let loadError: string | null = null;
  let viewerRole: OrgRole = "tenant_admin";
  let adminSeatsIncluded = starterAdminSeats;

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
    viewerRole = "member";
    loadError = error instanceof Error ? error.message : "Members could not be loaded";
  }

  return (
    <MembersView
      initialMembers={memberships}
      loadError={loadError}
      seats={{
        adminSeatsIncluded,
        adminSeatsUsed: memberships.filter((member) => member.org_role === "tenant_admin").length,
      }}
      viewerRole={viewerRole}
    />
  );
}

function includedAdminSeats(plans: BillingPlan[], planSlug: string) {
  return plans.find((plan) => plan.slug === planSlug)?.included_admin_seats ?? starterAdminSeats;
}
