import os
from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.tenancy.isolation import covers_isolation
from tests.isolation_client import IsolationTestClient

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/billing/plans")
@covers_isolation("GET", "/api/v1/billing/subscription")
@covers_isolation("POST", "/api/v1/billing/checkout-sessions")
def test_tenant_b_does_not_see_tenant_a_subscription() -> None:
    if not os.getenv(APP_DATABASE_URL_ENV):
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    tenant_a = _signup(client, "billing-a")
    tenant_b = _signup(client, "billing-b")

    webhook_response = client.post(
        "/api/v1/billing/webhooks/stripe/subscription",
        json={
            "tenant_id": str(tenant_a.tenant_id),
            "plan_slug": "starter",
            "status": "active",
            "stripe_customer_id": "cus_billing_a",
            "stripe_subscription_id": "sub_billing_a",
            "cancel_at_period_end": False,
        },
    )
    assert webhook_response.status_code == 200

    subscription_a = isolation_client.get(
        "/api/v1/billing/subscription",
        headers=_headers(tenant_a.slug, tenant_a.access_token),
    )
    assert subscription_a.status_code == 200
    assert subscription_a.json()["data"]["stripe_subscription_id"] == "sub_billing_a"

    subscription_b = isolation_client.get(
        "/api/v1/billing/subscription",
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert subscription_b.status_code == 200
    assert subscription_b.json()["data"] is None

    plans_response = isolation_client.get(
        "/api/v1/billing/plans",
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert plans_response.status_code == 200
    assert [plan["slug"] for plan in plans_response.json()["data"]] == [
        "starter",
        "growth",
        "business",
    ]

    checkout_response = isolation_client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "plan_slug": "growth",
            "success_url": "https://example.test/success",
            "cancel_url": "https://example.test/cancel",
        },
        headers={
            **_headers(tenant_b.slug, tenant_b.access_token),
            "idempotency-key": f"checkout-{uuid4()}",
        },
    )
    assert checkout_response.status_code == 200
    assert checkout_response.json()["data"]["provider_session_id"].startswith("local_checkout_")


@dataclass(frozen=True)
class TenantAccount:
    slug: str
    tenant_id: UUID
    access_token: str


def _signup(client: TestClient, slug: str) -> TenantAccount:
    email = f"admin@{slug}.test"
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "tenant_name": slug.title(),
            "tenant_slug": slug,
            "full_name": "Billing Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": f"{slug}.localhost"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    return TenantAccount(
        slug=slug,
        tenant_id=UUID(data["user"]["tenant_id"]),
        access_token=data["access_token"],
    )


def _headers(slug: str, access_token: str) -> dict[str, str]:
    return {"host": f"{slug}.localhost", "authorization": f"Bearer {access_token}"}
