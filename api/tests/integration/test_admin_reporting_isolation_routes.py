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
@covers_isolation("GET", "/api/v1/admin/analytics/completions")
@covers_isolation("GET", "/api/v1/admin/reports/learner-progress")
@covers_isolation("GET", "/api/v1/admin/reports/learner-progress.csv")
@covers_isolation("POST", "/api/v1/tenant/users")
def test_admin_reporting_routes_are_tenant_scoped() -> None:
    if not os.getenv(APP_DATABASE_URL_ENV):
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"report-{run_id}")
    headers = _headers(tenant.slug, tenant.access_token)

    analytics_response = isolation_client.get(
        "/api/v1/admin/analytics/completions",
        headers=headers,
    )
    assert analytics_response.status_code == 200
    assert analytics_response.json()["data"] == []

    progress_response = isolation_client.get(
        "/api/v1/admin/reports/learner-progress",
        headers=headers,
    )
    assert progress_response.status_code == 200
    assert progress_response.json()["data"] == []

    csv_response = isolation_client.get(
        "/api/v1/admin/reports/learner-progress.csv",
        headers=headers,
    )
    assert csv_response.status_code == 200
    assert "learner_id,learner_name,learner_email" in csv_response.text

    invite_response = isolation_client.post(
        "/api/v1/tenant/users",
        json={
            "email": f"learner-{tenant.slug}@example.com",
            "first_name": "Report",
            "last_name": "Learner",
            "phone": "+44000000001",
            "org_role": "member",
        },
        headers=headers,
    )
    assert invite_response.status_code == 200
    assert invite_response.json()["data"]["status"] == "invited"


@dataclass(frozen=True)
class TenantAccount:
    slug: str
    tenant_id: UUID
    access_token: str


def _signup(client: TestClient, slug: str) -> TenantAccount:
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": slug.title(),
            "tenant_slug": slug,
            "full_name": "Reporting Admin",
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
