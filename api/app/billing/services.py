from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.models import BillingAuditEvent, BillingPlan, TenantSubscription
from app.billing.repositories import (
    active_billing_plans,
    billing_plan_by_slug,
    current_tenant_subscription,
    subscription_by_stripe_id,
)
from app.billing.schemas import (
    BillingPlanResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    StripeSubscriptionEvent,
    SubscriptionResponse,
)
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import NotFoundError
from app.tenancy.context import require_tenant_id


@dataclass(frozen=True)
class CheckoutSessionCreate:
    tenant_id: UUID
    plan: BillingPlan
    success_url: str
    cancel_url: str
    idempotency_key: str


class BillingProvider(Protocol):
    async def create_checkout_session(
        self,
        request: CheckoutSessionCreate,
    ) -> CheckoutSessionResponse:
        pass


class LocalBillingProvider:
    async def create_checkout_session(
        self,
        request: CheckoutSessionCreate,
    ) -> CheckoutSessionResponse:
        provider_session_id = f"local_checkout_{request.tenant_id}_{request.plan.slug}"
        return CheckoutSessionResponse(
            provider_session_id=provider_session_id,
            url=f"https://billing.local/checkout/{provider_session_id}",
        )


async def list_plans(session: AsyncSession) -> list[BillingPlanResponse]:
    plans = list((await session.scalars(active_billing_plans())).all())
    return [plan_response(plan) for plan in plans]


async def get_current_subscription(session: AsyncSession) -> SubscriptionResponse | None:
    subscription = await session.scalar(current_tenant_subscription())
    if subscription is None:
        return None
    plan = await session.get(BillingPlan, subscription.plan_id)
    if plan is None:
        msg = "billing plan not found"
        raise NotFoundError(msg)
    return subscription_response(subscription, plan)


async def create_checkout_session(
    session: AsyncSession,
    request: CheckoutSessionRequest,
    provider: BillingProvider,
    *,
    actor_id: UUID | None = None,
    idempotency_key: str,
) -> CheckoutSessionResponse:
    tenant_id = UUID(require_tenant_id())
    plan = await require_plan(session, request.plan_slug)
    checkout = await provider.create_checkout_session(
        CheckoutSessionCreate(
            tenant_id=tenant_id,
            plan=plan,
            success_url=str(request.success_url),
            cancel_url=str(request.cancel_url),
            idempotency_key=idempotency_key,
        ),
    )
    _audit(
        session,
        actor_id,
        "billing.checkout_session.created",
        f"Created checkout session for {plan.slug}",
        {
            "plan_slug": plan.slug,
            "provider_session_id": checkout.provider_session_id,
            "idempotency_key": idempotency_key,
        },
    )
    await session.commit()
    return checkout


async def apply_stripe_subscription_event(
    session: AsyncSession,
    event: StripeSubscriptionEvent,
) -> SubscriptionResponse:
    set_tenant_id(str(event.tenant_id))
    try:
        plan = await require_plan(session, event.plan_slug)
        subscription = await session.scalar(
            subscription_by_stripe_id(event.stripe_subscription_id),
        )
        if subscription is None:
            subscription = TenantSubscription(
                plan_id=plan.id,
                status=event.status,
                stripe_customer_id=event.stripe_customer_id,
                stripe_subscription_id=event.stripe_subscription_id,
                current_period_start=event.current_period_start,
                current_period_end=event.current_period_end,
                trial_ends_at=event.trial_ends_at,
                cancel_at_period_end=event.cancel_at_period_end,
            )
            session.add(subscription)
        else:
            subscription.plan_id = plan.id
            subscription.status = event.status
            subscription.stripe_customer_id = event.stripe_customer_id
            subscription.current_period_start = event.current_period_start
            subscription.current_period_end = event.current_period_end
            subscription.trial_ends_at = event.trial_ends_at
            subscription.cancel_at_period_end = event.cancel_at_period_end
        await session.flush()
        _audit(
            session,
            None,
            "billing.subscription.synced",
            f"Synced subscription {event.stripe_subscription_id}",
            {
                "plan_slug": plan.slug,
                "status": event.status,
                "stripe_subscription_id": event.stripe_subscription_id,
            },
        )
        await session.commit()
        return subscription_response(subscription, plan)
    finally:
        clear_tenant_id()


async def require_plan(session: AsyncSession, slug: str) -> BillingPlan:
    plan = await session.scalar(billing_plan_by_slug(slug))
    if plan is None:
        msg = "billing plan not found"
        raise NotFoundError(msg)
    return plan


def plan_response(plan: BillingPlan) -> BillingPlanResponse:
    return BillingPlanResponse(
        id=plan.id,
        slug=plan.slug,
        name=plan.name,
        monthly_price_cents=plan.monthly_price_cents,
        currency=plan.currency,
        included_admin_seats=plan.included_admin_seats,
        included_learners=plan.included_learners,
        included_storage_gb=plan.included_storage_gb,
        trial_days=plan.trial_days,
    )


def subscription_response(
    subscription: TenantSubscription,
    plan: BillingPlan,
) -> SubscriptionResponse:
    return SubscriptionResponse(
        id=subscription.id,
        plan_slug=plan.slug,
        status=subscription.status,
        stripe_customer_id=subscription.stripe_customer_id,
        stripe_subscription_id=subscription.stripe_subscription_id,
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        trial_ends_at=subscription.trial_ends_at,
        cancel_at_period_end=subscription.cancel_at_period_end,
        seats_used=subscription.seats_used,
    )


def _audit(
    session: AsyncSession,
    actor_id: UUID | None,
    action: str,
    summary: str,
    event_data: dict[str, object],
) -> None:
    session.add(
        BillingAuditEvent(
            actor_id=actor_id,
            action=action,
            summary=summary,
            event_data=event_data,
        ),
    )


__all__ = [
    "BillingProvider",
    "CheckoutSessionCreate",
    "LocalBillingProvider",
    "apply_stripe_subscription_event",
    "create_checkout_session",
    "get_current_subscription",
    "list_plans",
    "plan_response",
    "require_plan",
    "subscription_response",
]
