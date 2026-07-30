from uuid import UUID

from sqlalchemy import Select, select

from app.billing.models import BillingPlan, BillingPlanStatus, TenantSubscription


def active_billing_plans() -> Select[tuple[BillingPlan]]:
    return (
        select(BillingPlan)
        .where(BillingPlan.status == BillingPlanStatus.active.value)
        .order_by(BillingPlan.monthly_price_cents)
    )


def billing_plan_by_slug(slug: str) -> Select[tuple[BillingPlan]]:
    return select(BillingPlan).where(
        BillingPlan.slug == slug,
        BillingPlan.status == BillingPlanStatus.active.value,
    )


def current_tenant_subscription() -> Select[tuple[TenantSubscription]]:
    return select(TenantSubscription).where(TenantSubscription.deleted_at.is_(None))


def subscription_by_stripe_id(stripe_subscription_id: str) -> Select[tuple[TenantSubscription]]:
    return select(TenantSubscription).where(
        TenantSubscription.stripe_subscription_id == stripe_subscription_id,
        TenantSubscription.deleted_at.is_(None),
    )


def subscription_by_id(subscription_id: UUID) -> Select[tuple[TenantSubscription]]:
    return select(TenantSubscription).where(
        TenantSubscription.id == subscription_id,
        TenantSubscription.deleted_at.is_(None),
    )


__all__ = [
    "active_billing_plans",
    "billing_plan_by_slug",
    "current_tenant_subscription",
    "subscription_by_id",
    "subscription_by_stripe_id",
]
