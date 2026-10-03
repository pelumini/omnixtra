import { headers } from "next/headers";

import { getBillingPlans, PricingPage, type BillingPlan } from "@/features/billing";

export default async function PricingRoute() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  let plans: BillingPlan[] = [];
  let loadError: string | null = null;

  try {
    const response = await getBillingPlans({ cookie, host });
    plans = response.data;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Plan catalog could not be loaded";
  }

  return <PricingPage loadError={loadError} plans={plans} />;
}
