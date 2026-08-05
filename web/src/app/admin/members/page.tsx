import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MembersView } from "@/components/admin/members-view";
import { InvitationPending } from "@/components/app/invitation-pending";
import { getAuthSession, getBillingPlans, getBillingSubscription, getMemberships } from "@/lib/api";
import type { BillingPlan, Membership, OrgRole } from "@/lib/schemas";

const starterAdminSeats = 3;

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

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}
