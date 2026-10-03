import { Check, CreditCard } from "lucide-react";

import type { BillingPlan } from "../schemas";

type PricingPageProps = {
  plans: BillingPlan[];
  loadError: string | null;
};

const fallbackPlans: BillingPlan[] = [
  {
    currency: "usd",
    id: "00000000-0000-0000-0000-000000000101",
    included_admin_seats: 3,
    included_learners: 50,
    included_storage_gb: 10,
    monthly_price_cents: 4900,
    name: "Starter",
    slug: "starter",
    trial_days: 14,
  },
  {
    currency: "usd",
    id: "00000000-0000-0000-0000-000000000102",
    included_admin_seats: 10,
    included_learners: 250,
    included_storage_gb: 50,
    monthly_price_cents: 14900,
    name: "Growth",
    slug: "growth",
    trial_days: 14,
  },
  {
    currency: "usd",
    id: "00000000-0000-0000-0000-000000000103",
    included_admin_seats: 25,
    included_learners: 1000,
    included_storage_gb: 200,
    monthly_price_cents: 39900,
    name: "Business",
    slug: "business",
    trial_days: 14,
  },
];

export function PricingPage({ plans, loadError }: PricingPageProps) {
  const visiblePlans = plans.length > 0 ? plans : fallbackPlans;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-xl font-semibold">Pricing</h1>
          <p className="mt-1 text-sm text-gray-600">Self-serve subscription plans</p>
        </div>
        <div className="grid size-10 place-items-center bg-[var(--primary)] text-white">
          <CreditCard aria-hidden="true" className="size-5" />
        </div>
      </header>

      {loadError ? (
        <div className="border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {visiblePlans.map((plan) => (
          <article className="grid content-start gap-4 border border-[var(--border)] bg-white p-4" key={plan.slug}>
            <div>
              <h2 className="text-base font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-semibold">
                ${Math.round(plan.monthly_price_cents / 100)}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
            </div>
            <ul className="grid gap-2 text-sm text-gray-700">
              <PlanFeature label={`${plan.trial_days}-day trial`} />
              <PlanFeature label={`${plan.included_admin_seats} admin seats`} />
              <PlanFeature label={`${plan.included_learners} learners`} />
              <PlanFeature label={`${plan.included_storage_gb} GB media storage`} />
            </ul>
            <a
              className="inline-flex h-10 items-center justify-center bg-[var(--primary)] px-4 text-sm font-medium text-white"
              href={`/admin?plan=${plan.slug}`}
            >
              Select
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}

function PlanFeature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check aria-hidden="true" className="size-4 text-[var(--primary)]" />
      <span>{label}</span>
    </li>
  );
}
