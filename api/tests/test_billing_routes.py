from app.main import create_app


def test_billing_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/billing/plans" in paths
    assert "/api/v1/billing/subscription" in paths
    assert "/api/v1/billing/checkout-sessions" in paths
    assert "/api/v1/billing/webhooks/stripe/subscription" in paths
