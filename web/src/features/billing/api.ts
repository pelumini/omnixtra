import {
  apiUrl,
  requestHeaders,
  type RequestContext,
  throwIfApiError,
} from "@/lib/api/client";
import {
  billingPlansEnvelopeSchema,
  billingSubscriptionEnvelopeSchema,
} from "./schemas";

export async function getBillingPlans(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/billing/plans`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return billingPlansEnvelopeSchema.parse(body);
}

export async function getBillingSubscription(context: RequestContext = {}) {
  const response = await fetch(`${apiUrl()}/api/v1/billing/subscription`, {
    cache: "no-store",
    credentials: "include",
    headers: requestHeaders(context),
  });
  const body: unknown = await response.json();
  throwIfApiError(response, body);

  return billingSubscriptionEnvelopeSchema.parse(body);
}
