from fastapi.testclient import TestClient

from app.main import create_app


def test_billing_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/billing/plans" in paths
    assert "/api/v1/billing/subscription" in paths
    assert "/api/v1/billing/subscription/plan" in paths
    assert "/api/v1/billing/checkout-sessions" in paths
    assert "/api/v1/billing/webhooks/stripe" in paths
    assert "/api/v1/billing/webhooks/stripe/subscription" not in paths


def test_unsigned_stripe_subscription_webhook_is_not_routable() -> None:
    response = TestClient(create_app()).post(
        "/api/v1/billing/webhooks/stripe/subscription",
        json={
            "tenant_id": "00000000-0000-0000-0000-000000000001",
            "plan_slug": "starter",
            "status": "active",
            "stripe_customer_id": "cus_attack",
            "stripe_subscription_id": "sub_attack",
            "cancel_at_period_end": False,
        },
    )

    assert response.status_code in {404, 405}
