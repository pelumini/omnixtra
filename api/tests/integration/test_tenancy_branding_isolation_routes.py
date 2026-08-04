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
@covers_isolation("POST", "/api/v1/tenants")
@covers_isolation("GET", "/api/v1/tenant/memberships")
@covers_isolation("POST", "/api/v1/tenant/invitations")
@covers_isolation("GET", "/api/v1/tenant/branding")
@covers_isolation("PATCH", "/api/v1/tenant/branding")
def test_tenant_b_does_not_see_tenant_a_branding() -> None:
    if not os.getenv(APP_DATABASE_URL_ENV):
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    run_id = uuid4().hex[:12]
    tenant_a = _signup(isolation_client, f"brand-a-{run_id}")
    tenant_b = _signup(isolation_client, f"brand-b-{run_id}")

    update_response = isolation_client.patch(
        "/api/v1/tenant/branding",
        json={
            "logo_url": "https://cdn.example/tenant-a.png",
            "primary_color": "#224466",
            "locale": "en-GB",
            "time_zone": "Europe/London",
        },
        headers=_headers(tenant_a.slug, tenant_a.access_token),
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["primary_color"] == "#224466"

    tenant_b_branding = isolation_client.get(
        "/api/v1/tenant/branding",
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert tenant_b_branding.status_code == 200
    assert tenant_b_branding.json()["data"]["tenant_name"] == tenant_b.slug.title()
    assert tenant_b_branding.json()["data"]["primary_color"] == "#116149"
    assert tenant_b_branding.json()["data"]["logo_url"] is None

    memberships_response = isolation_client.get(
        "/api/v1/tenant/memberships",
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert memberships_response.status_code == 200
    assert len(memberships_response.json()["data"]) == 1

    invitation_response = isolation_client.post(
        "/api/v1/tenant/invitations",
        json={"email": f"member-{tenant_b.slug}@example.com", "org_role": "member"},
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert invitation_response.status_code == 200
    assert invitation_response.json()["data"]["accepted"] is True


@dataclass(frozen=True)
class TenantAccount:
    slug: str
    tenant_id: UUID
    access_token: str


def _signup(client: IsolationTestClient, slug: str) -> TenantAccount:
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": slug.title(),
            "tenant_slug": slug,
            "full_name": "Tenant Admin",
            "email": f"admin-{slug}@example.com",
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
