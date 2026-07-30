import hashlib
import hmac
from datetime import UTC, datetime
from uuid import UUID

import httpx
import pytest

from app.billing.models import BillingPlan, SubscriptionStatus, TenantSubscription
from app.billing.services import (
    CheckoutSessionCreate,
    StripeBillingProvider,
    change_subscription_plan,
    ensure_admin_capacity,
    ensure_learner_capacity,
    ensure_storage_capacity,
    increment_learner_usage,
    plan_response,
    stripe_event_to_subscription_event,
    subscription_response,
    verify_stripe_webhook_payload,
)
from app.core.config import get_settings
from app.core.exceptions import ValidationAppError

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
PLAN_ID = UUID("00000000-0000-0000-0000-000000000010")
SUBSCRIPTION_ID = UUID("00000000-0000-0000-0000-000000000020")


def test_plan_response_maps_data_driven_limits() -> None:
    plan = BillingPlan(
        id=PLAN_ID,
        slug="growth",
        name="Growth",
        monthly_price_cents=14900,
        currency="usd",
        included_admin_seats=10,
        included_learners=250,
        included_storage_gb=50,
        trial_days=14,
        status="active",
    )

    response = plan_response(plan)

    assert response.slug == "growth"
    assert response.included_learners == 250
    assert response.included_storage_gb == 50


def test_subscription_response_joins_subscription_to_plan_slug() -> None:
    period_end = datetime(2026, 8, 30, tzinfo=UTC)
    plan = BillingPlan(
        id=PLAN_ID,
        slug="starter",
        name="Starter",
        monthly_price_cents=4900,
        currency="usd",
        included_admin_seats=3,
        included_learners=50,
        included_storage_gb=10,
        trial_days=14,
        status="active",
    )
    subscription = TenantSubscription(
        id=SUBSCRIPTION_ID,
        tenant_id=TENANT_ID,
        plan_id=PLAN_ID,
        status=SubscriptionStatus.active.value,
        stripe_customer_id="cus_123",
        stripe_subscription_id="sub_123",
        current_period_end=period_end,
        cancel_at_period_end=False,
        seats_used=2,
    )

    response = subscription_response(subscription, plan)

    assert response.plan_slug == "starter"
    assert response.status == "active"
    assert response.current_period_end == period_end
    assert response.seats_used == 2


@pytest.mark.anyio
async def test_stripe_checkout_provider_posts_signed_session_request(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    plan = BillingPlan(
        id=PLAN_ID,
        slug="starter",
        name="Starter",
        monthly_price_cents=4900,
        currency="usd",
        included_admin_seats=3,
        included_learners=50,
        included_storage_gb=10,
        trial_days=14,
        stripe_price_id="price_123",
        status="active",
    )

    async def handler(request: httpx.Request) -> httpx.Response:
        body = request.content.decode("utf-8")
        assert request.headers["authorization"] == "Bearer sk_test_123"
        assert request.headers["idempotency-key"] == "checkout-key"
        assert "metadata%5Btenant_id%5D=" in body
        assert "line_items%5B0%5D%5Bprice%5D=price_123" in body
        return httpx.Response(
            200,
            json={"id": "cs_test_123", "url": "https://checkout.stripe.test"},
        )

    provider = StripeBillingProvider(
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    response = await provider.create_checkout_session(
        CheckoutSessionCreate(
            tenant_id=TENANT_ID,
            plan=plan,
            success_url="https://app.example/success",
            cancel_url="https://app.example/cancel",
            idempotency_key="checkout-key",
        ),
    )

    assert response.provider_session_id == "cs_test_123"
    assert response.url == "https://checkout.stripe.test"
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_stripe_provider_updates_subscription_item_price(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
    subscription = _subscription(seats_used=1)
    subscription.stripe_subscription_id = "sub_123"
    target_plan = _plan(included_learners=50, included_storage_gb=10)
    target_plan.stripe_price_id = "price_growth"
    requests: list[tuple[str, str, str]] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        body = request.content.decode("utf-8")
        requests.append((request.method, str(request.url), body))
        assert request.headers["authorization"] == "Bearer sk_test_123"
        if request.method == "GET":
            return httpx.Response(200, json={"items": {"data": [{"id": "si_123"}]}})
        assert request.headers["idempotency-key"] == "plan-change-key"
        assert "items%5B0%5D%5Bid%5D=si_123" in body
        assert "items%5B0%5D%5Bprice%5D=price_growth" in body
        return httpx.Response(200, json={"id": "sub_123"})

    provider = StripeBillingProvider(
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    await provider.change_subscription_plan(
        subscription=subscription,
        target_plan=target_plan,
        idempotency_key="plan-change-key",
    )

    assert [request[0] for request in requests] == ["GET", "POST"]
    get_settings.cache_clear()


def test_stripe_webhook_signature_verification_accepts_valid_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    payload = b'{"type":"customer.subscription.updated","data":{"object":{}}}'
    timestamp = 1_000
    signature = _stripe_signature(payload, timestamp=timestamp, secret="whsec_test")

    event = verify_stripe_webhook_payload(payload, f"t={timestamp},v1={signature}", now=timestamp)

    assert event["type"] == "customer.subscription.updated"
    get_settings.cache_clear()


def test_stripe_event_maps_subscription_payload() -> None:
    event = {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "cancel_at_period_end": False,
                "current_period_end": 1_785_366_000,
                "current_period_start": 1_782_774_000,
                "customer": "cus_123",
                "id": "sub_123",
                "metadata": {"plan_slug": "growth", "tenant_id": str(TENANT_ID)},
                "status": "active",
            },
        },
    }

    mapped = stripe_event_to_subscription_event(event)

    assert mapped.tenant_id == TENANT_ID
    assert mapped.plan_slug == "growth"
    assert mapped.stripe_subscription_id == "sub_123"


@pytest.mark.anyio
async def test_ensure_learner_capacity_rejects_full_plan() -> None:
    plan = _plan(included_learners=1, included_storage_gb=10)
    subscription = _subscription(seats_used=1)
    session = _BillingLimitSession(subscription=subscription, plan=plan)

    with pytest.raises(ValidationAppError, match="learner limit"):
        await ensure_learner_capacity(session)


@pytest.mark.anyio
async def test_ensure_admin_capacity_rejects_full_plan() -> None:
    plan = _plan(included_learners=50, included_storage_gb=10)
    plan.included_admin_seats = 1
    subscription = _subscription(seats_used=0)
    session = _AdminLimitSession(subscription=subscription, plan=plan, admin_count=1)

    with pytest.raises(ValidationAppError, match="admin seat limit"):
        await ensure_admin_capacity(session)


@pytest.mark.anyio
async def test_increment_learner_usage_updates_subscription_usage() -> None:
    plan = _plan(included_learners=2, included_storage_gb=10)
    subscription = _subscription(seats_used=0)
    session = _BillingLimitSession(subscription=subscription, plan=plan)

    await increment_learner_usage(session)

    assert subscription.seats_used == 1


@pytest.mark.anyio
async def test_ensure_storage_capacity_rejects_overage() -> None:
    plan = _plan(included_learners=50, included_storage_gb=1)
    subscription = _subscription(seats_used=0)
    session = _BillingLimitSession(subscription=subscription, plan=plan)

    with pytest.raises(ValidationAppError, match="storage limit"):
        await ensure_storage_capacity(
            session,
            additional_bytes=2,
            current_storage_bytes=1024 * 1024 * 1024,
        )


@pytest.mark.anyio
async def test_change_subscription_plan_rejects_downgrade_below_usage() -> None:
    current_plan = _plan(included_learners=50, included_storage_gb=10)
    target_plan = _plan(included_learners=1, included_storage_gb=10)
    target_plan.id = UUID("00000000-0000-0000-0000-000000000011")
    target_plan.slug = "starter-small"
    subscription = _subscription(seats_used=2)
    session = _PlanChangeSession(
        subscription=subscription,
        current_plan=current_plan,
        target_plan=target_plan,
    )

    with pytest.raises(ValidationAppError, match="learner limit"):
        await change_subscription_plan(
            session,
            request=type("PlanChange", (), {"plan_slug": "starter-small"})(),
            provider=_NoopBillingProvider(),
            idempotency_key="plan-change-key",
        )


def _stripe_signature(payload: bytes, *, timestamp: int, secret: str) -> str:
    signed_payload = f"{timestamp}.{payload.decode('utf-8')}".encode()
    return hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()


def _plan(*, included_learners: int, included_storage_gb: int) -> BillingPlan:
    return BillingPlan(
        id=PLAN_ID,
        slug="starter",
        name="Starter",
        monthly_price_cents=4900,
        currency="usd",
        included_admin_seats=3,
        included_learners=included_learners,
        included_storage_gb=included_storage_gb,
        trial_days=14,
        status="active",
    )


def _subscription(*, seats_used: int) -> TenantSubscription:
    return TenantSubscription(
        id=SUBSCRIPTION_ID,
        tenant_id=TENANT_ID,
        plan_id=PLAN_ID,
        status=SubscriptionStatus.active.value,
        stripe_customer_id="cus_123",
        stripe_subscription_id="sub_123",
        seats_used=seats_used,
    )


class _BillingLimitSession:
    def __init__(self, *, subscription: TenantSubscription, plan: BillingPlan) -> None:
        self.subscription = subscription
        self.plan = plan

    async def scalar(self, _statement: object) -> TenantSubscription:
        return self.subscription

    async def get(self, _model: object, _identifier: object) -> BillingPlan:
        return self.plan


class _PlanChangeSession:
    def __init__(
        self,
        *,
        subscription: TenantSubscription,
        current_plan: BillingPlan,
        target_plan: BillingPlan,
    ) -> None:
        self.subscription = subscription
        self.current_plan = current_plan
        self.target_plan = target_plan

    async def scalar(self, _statement: object) -> TenantSubscription | BillingPlan | int:
        if getattr(_statement, "column_descriptions", [{}])[0].get("entity") is BillingPlan:
            return self.target_plan
        return self.subscription

    async def get(self, _model: object, _identifier: object) -> BillingPlan:
        return self.current_plan

    def add(self, _instance: object) -> None:
        pass

    async def commit(self) -> None:
        pass


class _NoopBillingProvider:
    async def create_checkout_session(
        self,
        request: CheckoutSessionCreate,
    ) -> object:
        _ = request
        return object()

    async def change_subscription_plan(
        self,
        *,
        subscription: TenantSubscription,
        target_plan: BillingPlan,
        idempotency_key: str,
    ) -> None:
        _ = (subscription, target_plan, idempotency_key)


class _AdminLimitSession:
    def __init__(
        self,
        *,
        subscription: TenantSubscription,
        plan: BillingPlan,
        admin_count: int,
    ) -> None:
        self.subscription = subscription
        self.plan = plan
        self.admin_count = admin_count
        self.scalar_calls = 0

    async def scalar(self, _statement: object) -> TenantSubscription | int:
        self.scalar_calls += 1
        return self.subscription if self.scalar_calls == 1 else self.admin_count

    async def get(self, _model: object, _identifier: object) -> BillingPlan:
        return self.plan
