import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID

import httpx
from sqlalchemy import column, func, select, table
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
    PlanChangeRequest,
    StripeSubscriptionEvent,
    SubscriptionResponse,
)
from app.core.config import get_settings
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import NotFoundError, ValidationAppError
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

    async def change_subscription_plan(
        self,
        *,
        subscription: TenantSubscription,
        target_plan: BillingPlan,
        idempotency_key: str,
    ) -> None:
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

    async def change_subscription_plan(
        self,
        *,
        subscription: TenantSubscription,
        target_plan: BillingPlan,
        idempotency_key: str,
    ) -> None:
        _ = (subscription, target_plan, idempotency_key)


class StripeBillingProvider:
    def __init__(self, *, client: httpx.AsyncClient | None = None) -> None:
        self.client = client

    async def create_checkout_session(
        self,
        request: CheckoutSessionCreate,
    ) -> CheckoutSessionResponse:
        settings = get_settings()
        if not settings.stripe_secret_key:
            msg = "Stripe secret key is not configured"
            raise ValidationAppError(msg)
        if request.plan.stripe_price_id is None:
            msg = "billing plan is missing Stripe price id"
            raise ValidationAppError(msg)
        payload = {
            "cancel_url": request.cancel_url,
            "client_reference_id": str(request.tenant_id),
            "line_items[0][price]": request.plan.stripe_price_id,
            "line_items[0][quantity]": "1",
            "metadata[plan_slug]": request.plan.slug,
            "metadata[tenant_id]": str(request.tenant_id),
            "mode": "subscription",
            "subscription_data[metadata][plan_slug]": request.plan.slug,
            "subscription_data[metadata][tenant_id]": str(request.tenant_id),
            "success_url": request.success_url,
        }
        data = await _post_stripe_form(
            "https://api.stripe.com/v1/checkout/sessions",
            payload,
            api_key=settings.stripe_secret_key,
            idempotency_key=request.idempotency_key,
            client=self.client,
        )
        session_id = _required_str(data, "id")
        url = _required_str(data, "url")
        return CheckoutSessionResponse(provider_session_id=session_id, url=url)

    async def change_subscription_plan(
        self,
        *,
        subscription: TenantSubscription,
        target_plan: BillingPlan,
        idempotency_key: str,
    ) -> None:
        settings = get_settings()
        if not settings.stripe_secret_key:
            msg = "Stripe secret key is not configured"
            raise ValidationAppError(msg)
        if subscription.stripe_subscription_id is None:
            msg = "current subscription is missing Stripe subscription id"
            raise ValidationAppError(msg)
        if target_plan.stripe_price_id is None:
            msg = "target billing plan is missing Stripe price id"
            raise ValidationAppError(msg)
        subscription_item_id = await _stripe_subscription_item_id(
            subscription.stripe_subscription_id,
            api_key=settings.stripe_secret_key,
            client=self.client,
        )
        await _post_stripe_form(
            f"https://api.stripe.com/v1/subscriptions/{subscription.stripe_subscription_id}",
            {
                "items[0][id]": subscription_item_id,
                "items[0][price]": target_plan.stripe_price_id,
                "metadata[plan_slug]": target_plan.slug,
                "metadata[tenant_id]": str(subscription.tenant_id),
                "proration_behavior": "create_prorations",
            },
            api_key=settings.stripe_secret_key,
            idempotency_key=idempotency_key,
            client=self.client,
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


async def change_subscription_plan(
    session: AsyncSession,
    request: PlanChangeRequest,
    provider: BillingProvider,
    *,
    actor_id: UUID | None = None,
    idempotency_key: str,
) -> SubscriptionResponse:
    subscription = await session.scalar(current_tenant_subscription())
    if subscription is None:
        msg = "current subscription not found"
        raise NotFoundError(msg)
    current_plan = await session.get(BillingPlan, subscription.plan_id)
    if current_plan is None:
        msg = "billing plan not found"
        raise NotFoundError(msg)
    target_plan = await require_plan(session, request.plan_slug)
    await _ensure_plan_change_capacity(session, subscription, target_plan)
    if target_plan.id != subscription.plan_id:
        await provider.change_subscription_plan(
            subscription=subscription,
            target_plan=target_plan,
            idempotency_key=idempotency_key,
        )
        subscription.plan_id = target_plan.id
    _audit(
        session,
        actor_id,
        "billing.subscription.plan_changed",
        f"Changed subscription plan from {current_plan.slug} to {target_plan.slug}",
        {
            "from_plan_slug": current_plan.slug,
            "idempotency_key": idempotency_key,
            "to_plan_slug": target_plan.slug,
        },
    )
    await session.commit()
    return subscription_response(subscription, target_plan)


async def _apply_stripe_subscription_event(
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


async def apply_signed_stripe_webhook(
    session: AsyncSession,
    *,
    payload: bytes,
    signature_header: str,
) -> SubscriptionResponse | None:
    event = verify_stripe_webhook_payload(payload, signature_header)
    event_type = str(event.get("type", ""))
    if event_type not in {
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        return None
    subscription_event = stripe_event_to_subscription_event(event)
    return await _apply_stripe_subscription_event(session, subscription_event)


def verify_stripe_webhook_payload(
    payload: bytes,
    signature_header: str,
    *,
    tolerance_seconds: int = 300,
    now: int | None = None,
) -> dict[str, object]:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        msg = "Stripe webhook secret is not configured"
        raise ValidationAppError(msg)
    timestamp, signatures = _parse_stripe_signature_header(signature_header)
    current_time = int(time.time()) if now is None else now
    if abs(current_time - timestamp) > tolerance_seconds:
        msg = "Stripe webhook signature timestamp is outside tolerance"
        raise ValidationAppError(msg)
    signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode()
    expected = hmac.new(
        settings.stripe_webhook_secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    if not any(hmac.compare_digest(expected, signature) for signature in signatures):
        msg = "Stripe webhook signature verification failed"
        raise ValidationAppError(msg)
    try:
        data = json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError as exc:
        msg = "Stripe webhook payload must be valid JSON"
        raise ValidationAppError(msg) from exc
    if not isinstance(data, dict):
        msg = "Stripe webhook payload must be an object"
        raise ValidationAppError(msg)
    return data


def stripe_event_to_subscription_event(event: dict[str, object]) -> StripeSubscriptionEvent:
    data = _mapping(_mapping(event.get("data")).get("object"))
    metadata = _mapping(data.get("metadata"))
    tenant_id = UUID(_required_str(metadata, "tenant_id"))
    plan_slug = _required_str(metadata, "plan_slug")
    status = str(data.get("status", "active"))
    subscription_id = str(data.get("subscription") or data.get("id") or "")
    if subscription_id == "":
        msg = "Stripe event is missing subscription id"
        raise ValidationAppError(msg)
    return StripeSubscriptionEvent(
        tenant_id=tenant_id,
        plan_slug=plan_slug,
        status=status,
        stripe_customer_id=_required_str(data, "customer"),
        stripe_subscription_id=subscription_id,
        current_period_start=_stripe_timestamp(data.get("current_period_start")),
        current_period_end=_stripe_timestamp(data.get("current_period_end")),
        trial_ends_at=_stripe_timestamp(data.get("trial_end")),
        cancel_at_period_end=bool(data.get("cancel_at_period_end", False)),
    )


async def ensure_learner_capacity(session: AsyncSession) -> None:
    result = await _current_plan_and_subscription(session)
    if result is None:
        return
    plan, subscription = result
    if subscription.seats_used >= plan.included_learners:
        msg = "learner limit exceeded for current plan"
        raise ValidationAppError(msg)


async def ensure_admin_capacity(session: AsyncSession) -> None:
    result = await _current_plan_and_subscription(session)
    if result is None:
        return
    plan, _subscription = result
    users = table(
        "users",
        column("role"),
        column("status"),
        column("deleted_at"),
    )
    admin_count = await session.scalar(
        select(func.count())
        .select_from(users)
        .where(
            users.c.role == "org_admin",
            users.c.status.in_(["active", "invited"]),
            users.c.deleted_at.is_(None),
        ),
    )
    if int(admin_count or 0) >= plan.included_admin_seats:
        msg = "admin seat limit exceeded for current plan"
        raise ValidationAppError(msg)


async def increment_learner_usage(session: AsyncSession) -> None:
    result = await _current_plan_and_subscription(session)
    if result is None:
        return
    _plan, subscription = result
    subscription.seats_used += 1


async def ensure_storage_capacity(
    session: AsyncSession,
    *,
    additional_bytes: int,
    current_storage_bytes: int,
) -> None:
    result = await _current_plan_and_subscription(session)
    if result is None:
        return
    plan, _subscription = result
    limit_bytes = plan.included_storage_gb * 1024 * 1024 * 1024
    if current_storage_bytes + additional_bytes > limit_bytes:
        msg = "storage limit exceeded for current plan"
        raise ValidationAppError(msg)


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


async def _current_plan_and_subscription(
    session: AsyncSession,
) -> tuple[BillingPlan, TenantSubscription] | None:
    subscription = await session.scalar(current_tenant_subscription())
    if subscription is None:
        return None
    plan = await session.get(BillingPlan, subscription.plan_id)
    if plan is None:
        msg = "billing plan not found"
        raise NotFoundError(msg)
    return plan, subscription


async def _ensure_plan_change_capacity(
    session: AsyncSession,
    subscription: TenantSubscription,
    target_plan: BillingPlan,
) -> None:
    if subscription.seats_used > target_plan.included_learners:
        msg = "learner limit exceeded for target plan"
        raise ValidationAppError(msg)
    current_storage_bytes = await _current_storage_bytes(session)
    target_storage_bytes = target_plan.included_storage_gb * 1024 * 1024 * 1024
    if current_storage_bytes > target_storage_bytes:
        msg = "storage limit exceeded for target plan"
        raise ValidationAppError(msg)


async def _current_storage_bytes(session: AsyncSession) -> int:
    course_media_assets = table(
        "course_media_assets",
        column("byte_size"),
        column("deleted_at"),
    )
    current_storage_bytes = await session.scalar(
        select(func.coalesce(func.sum(course_media_assets.c.byte_size), 0)).where(
            course_media_assets.c.deleted_at.is_(None),
        ),
    )
    return int(current_storage_bytes or 0)


async def _post_stripe_form(
    url: str,
    payload: dict[str, str],
    *,
    api_key: str,
    idempotency_key: str,
    client: httpx.AsyncClient | None,
) -> dict[str, object]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Idempotency-Key": idempotency_key,
    }
    if client is not None:
        response = await client.post(url, data=payload, headers=headers)
    else:
        async with httpx.AsyncClient(timeout=30.0) as transient_client:
            response = await transient_client.post(url, data=payload, headers=headers)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        msg = "Stripe checkout session creation failed"
        raise ValidationAppError(msg) from exc
    try:
        data = response.json()
    except ValueError as exc:
        msg = "Stripe response must be valid JSON"
        raise ValidationAppError(msg) from exc
    if not isinstance(data, dict):
        msg = "Stripe response must be a JSON object"
        raise ValidationAppError(msg)
    return data


async def _get_stripe_json(
    url: str,
    *,
    api_key: str,
    client: httpx.AsyncClient | None,
) -> dict[str, object]:
    headers = {"Authorization": f"Bearer {api_key}"}
    if client is not None:
        response = await client.get(url, headers=headers)
    else:
        async with httpx.AsyncClient(timeout=30.0) as transient_client:
            response = await transient_client.get(url, headers=headers)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        msg = "Stripe subscription retrieval failed"
        raise ValidationAppError(msg) from exc
    try:
        data = response.json()
    except ValueError as exc:
        msg = "Stripe response must be valid JSON"
        raise ValidationAppError(msg) from exc
    if not isinstance(data, dict):
        msg = "Stripe response must be a JSON object"
        raise ValidationAppError(msg)
    return data


async def _stripe_subscription_item_id(
    stripe_subscription_id: str,
    *,
    api_key: str,
    client: httpx.AsyncClient | None,
) -> str:
    data = await _get_stripe_json(
        f"https://api.stripe.com/v1/subscriptions/{stripe_subscription_id}",
        api_key=api_key,
        client=client,
    )
    items = _mapping(data.get("items"))
    item_rows = items.get("data")
    if not isinstance(item_rows, list) or not item_rows:
        msg = "Stripe subscription has no subscription items"
        raise ValidationAppError(msg)
    first_item = _mapping(item_rows[0])
    return _required_str(first_item, "id")


def _parse_stripe_signature_header(header: str) -> tuple[int, list[str]]:
    expected_parts = 2
    values: dict[str, list[str]] = {}
    for part in header.split(","):
        pieces = part.split("=", maxsplit=1)
        if len(pieces) != expected_parts:
            continue
        key, value = pieces
        values.setdefault(key, []).append(value)
    timestamp = values.get("t", [None])[0]
    signatures = values.get("v1", [])
    if timestamp is None or not signatures:
        msg = "Stripe signature header is malformed"
        raise ValidationAppError(msg)
    try:
        return int(timestamp), signatures
    except ValueError as exc:
        msg = "Stripe signature header is malformed"
        raise ValidationAppError(msg) from exc


def _mapping(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def _required_str(mapping: dict[str, object], key: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str) or value == "":
        msg = f"Stripe payload is missing {key}"
        raise ValidationAppError(msg)
    return value


def _stripe_timestamp(value: object) -> datetime | None:
    if not isinstance(value, int | float):
        return None
    return datetime.fromtimestamp(value, tz=UTC)


__all__ = [
    "BillingProvider",
    "CheckoutSessionCreate",
    "LocalBillingProvider",
    "StripeBillingProvider",
    "apply_signed_stripe_webhook",
    "change_subscription_plan",
    "create_checkout_session",
    "ensure_admin_capacity",
    "ensure_learner_capacity",
    "ensure_storage_capacity",
    "get_current_subscription",
    "increment_learner_usage",
    "list_plans",
    "plan_response",
    "require_plan",
    "stripe_event_to_subscription_event",
    "subscription_response",
    "verify_stripe_webhook_payload",
]
