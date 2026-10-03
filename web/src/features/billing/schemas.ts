import { z } from "zod";

import { metaSchema } from "@/lib/schemas/common";

export const billingPlanSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  monthly_price_cents: z.number().int().nonnegative(),
  currency: z.string(),
  included_admin_seats: z.number().int().nonnegative(),
  included_learners: z.number().int().nonnegative(),
  included_storage_gb: z.number().int().nonnegative(),
  trial_days: z.number().int().nonnegative(),
});

export const billingPlansEnvelopeSchema = z.object({
  data: z.array(billingPlanSchema),
  error: z.null(),
  meta: metaSchema,
});

export const billingSubscriptionSchema = z.object({
  id: z.string().uuid(),
  plan_slug: z.string(),
  status: z.string(),
  stripe_customer_id: z.string().nullable(),
  stripe_subscription_id: z.string().nullable(),
  current_period_start: z.string().datetime().nullable(),
  current_period_end: z.string().datetime().nullable(),
  trial_ends_at: z.string().datetime().nullable(),
  cancel_at_period_end: z.boolean(),
  seats_used: z.number().int().nonnegative(),
});

export const billingSubscriptionEnvelopeSchema = z.object({
  data: billingSubscriptionSchema.nullable(),
  error: z.null(),
  meta: metaSchema,
});

export type BillingPlan = z.infer<typeof billingPlanSchema>;
export type BillingSubscription = z.infer<typeof billingSubscriptionSchema>;
