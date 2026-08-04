import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import Response

from app.core.config import get_settings
from app.main import create_app
from app.tenancy.isolation import covers_isolation
from tests.isolation_client import IsolationTestClient

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/billing/plans")
@covers_isolation("GET", "/api/v1/billing/subscription")
@covers_isolation("PATCH", "/api/v1/billing/subscription/plan")
@covers_isolation("POST", "/api/v1/billing/checkout-sessions")
def test_tenant_b_does_not_see_tenant_a_subscription(monkeypatch: pytest.MonkeyPatch) -> None:
    if not os.getenv(APP_DATABASE_URL_ENV):
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    get_settings.cache_clear()
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    run_id = uuid4().hex[:12]
    tenant_a = _signup(client, f"billing-a-{run_id}")
    tenant_b = _signup(client, f"billing-b-{run_id}")

    webhook_response = _post_signed_subscription_webhook(
        client,
        tenant_id=tenant_a.tenant_id,
        stripe_customer_id="cus_billing_a",
        stripe_subscription_id="sub_billing_a",
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

    webhook_response_b = _post_signed_subscription_webhook(
        client,
        tenant_id=tenant_b.tenant_id,
        stripe_customer_id="cus_billing_b",
        stripe_subscription_id="sub_billing_b",
    )
    assert webhook_response_b.status_code == 200

    plan_change_response = isolation_client.patch(
        "/api/v1/billing/subscription/plan",
        json={"plan_slug": "growth"},
        headers={
            **_headers(tenant_b.slug, tenant_b.access_token),
            "idempotency-key": f"plan-change-{uuid4()}",
        },
    )
    assert plan_change_response.status_code == 200
    assert plan_change_response.json()["data"]["plan_slug"] == "growth"
    get_settings.cache_clear()


@pytest.mark.integration
@covers_isolation("POST", "/api/v1/tenant/invitations")
def test_admin_seat_limit_counts_tenant_admin_memberships(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    if not os.getenv(APP_DATABASE_URL_ENV):
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    get_settings.cache_clear()
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_test")
    client = TestClient(create_app())
    tenant = _signup(client, f"admin-seats-{uuid4().hex[:12]}")

    webhook_response = _post_signed_subscription_webhook(
        client,
        tenant_id=tenant.tenant_id,
        stripe_customer_id="cus_admin_seats",
        stripe_subscription_id="sub_admin_seats",
    )
    assert webhook_response.status_code == 200

    for index in range(2):
        email = f"tenant-admin-{index}-{tenant.slug}@example.com"
        invitation_response = _invite_admin(client, tenant, email)
        assert invitation_response.status_code == 200
        token = invitation_response.json()["data"]["token"]
        accept_response = _accept_invitation(client, tenant.slug, token, email)
        assert accept_response.status_code == 200

    rejected_response = _invite_admin(
        client,
        tenant,
        f"tenant-admin-over-{tenant.slug}@example.com",
    )

    assert rejected_response.status_code == 400
    assert "admin seat limit" in rejected_response.text
    get_settings.cache_clear()


@dataclass(frozen=True)
class TenantAccount:
    slug: str
    tenant_id: UUID
    access_token: str


def _signup(client: TestClient, slug: str) -> TenantAccount:
    email = f"admin-{slug}@example.com"
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": slug.title(),
            "tenant_slug": slug,
            "full_name": "Billing Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    return TenantAccount(
        slug=slug,
        tenant_id=UUID(data["tenant_id"]),
        access_token=data["access_token"],
    )


def _headers(slug: str, access_token: str) -> dict[str, str]:
    return {"host": f"{slug}.localhost", "authorization": f"Bearer {access_token}"}


def _invite_admin(client: TestClient, tenant: TenantAccount, email: str) -> Response:
    return client.post(
        "/api/v1/tenant/invitations",
        json={"email": email, "org_role": "tenant_admin"},
        headers=_headers(tenant.slug, tenant.access_token),
    )


def _accept_invitation(client: TestClient, slug: str, token: str, email: str) -> Response:
    return client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": token,
            "email": email,
            "full_name": "Tenant Admin",
            "password": TEST_PASSWORD,
        },
        headers={"host": f"{slug}.localhost"},
    )


def _post_signed_subscription_webhook(
    client: TestClient,
    *,
    tenant_id: UUID,
    stripe_customer_id: str,
    stripe_subscription_id: str,
) -> Response:
    timestamp = int(time.time())
    payload = json.dumps(
        {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "cancel_at_period_end": False,
                    "customer": stripe_customer_id,
                    "id": stripe_subscription_id,
                    "metadata": {"plan_slug": "starter", "tenant_id": str(tenant_id)},
                    "status": "active",
                },
            },
        },
        separators=(",", ":"),
    ).encode()
    signature = hmac.new(
        b"whsec_test",
        f"{timestamp}.{payload.decode('utf-8')}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return client.post(
        "/api/v1/billing/webhooks/stripe",
        content=payload,
        headers={
            "content-type": "application/json",
            "stripe-signature": f"t={timestamp},v1={signature}",
        },
    )
