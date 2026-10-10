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
@covers_isolation("POST", "/api/v1/tenant/users")
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
    memberships = memberships_response.json()["data"]
    assert memberships == [
        {
            "email": f"admin-{tenant_b.slug}@example.com",
            "full_name": "Tenant Admin",
            "id": memberships[0]["id"],
            "invitation_token": None,
            "org_role": "tenant_admin",
            "status": "active",
            "user_id": memberships[0]["user_id"],
        },
    ]

    tenant_a_invitation_response = isolation_client.post(
        "/api/v1/tenant/users",
        json={
            "email": f"member-{tenant_a.slug}@example.com",
            "first_name": "Tenant A",
            "last_name": "Member",
            "phone": "+44000000001",
            "org_role": "member",
        },
        headers=_headers(tenant_a.slug, tenant_a.access_token),
    )
    assert tenant_a_invitation_response.status_code == 200

    invitation_response = isolation_client.post(
        "/api/v1/tenant/users",
        json={
            "email": f"member-{tenant_b.slug}@example.com",
            "first_name": "Tenant B",
            "last_name": "Member",
            "phone": "+44000000002",
            "org_role": "member",
        },
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert invitation_response.status_code == 200
    invitation_data = invitation_response.json()["data"]
    assert invitation_data["email"] == f"member-{tenant_b.slug}@example.com"
    assert invitation_data["org_role"] == "member"
    assert invitation_data["status"] == "invited"
    assert invitation_data["activation_link"]

    memberships_with_pending_response = isolation_client.get(
        "/api/v1/tenant/memberships",
        headers=_headers(tenant_b.slug, tenant_b.access_token),
    )
    assert memberships_with_pending_response.status_code == 200
    memberships_with_pending = memberships_with_pending_response.json()["data"]
    assert [member["email"] for member in memberships_with_pending] == [
        f"admin-{tenant_b.slug}@example.com",
        f"member-{tenant_b.slug}@example.com",
    ]
    assert memberships_with_pending[0]["full_name"] == "Tenant Admin"
    assert memberships_with_pending[0]["status"] == "active"
    assert memberships_with_pending[1]["full_name"] == "Tenant B Member"
    assert memberships_with_pending[1]["status"] == "invited"
    assert memberships_with_pending[1]["invitation_token"] is None
    assert f"member-{tenant_a.slug}@example.com" not in {
        member["email"] for member in memberships_with_pending
    }


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
            "first_name": "Tenant",
            "last_name": "Admin",
            "phone": "+44000000000",
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
