from datetime import UTC, datetime
from uuid import UUID

from app.billing.models import BillingPlan, SubscriptionStatus, TenantSubscription
from app.billing.services import plan_response, subscription_response

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
