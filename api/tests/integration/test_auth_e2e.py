import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
def test_signup_login_and_protected_route_with_tenant_host() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_slug = f"e2e-{uuid4().hex[:12]}"
    email = f"learner-{tenant_slug}@example.com"
    client = TestClient(create_app())

    signup_response = client.post(
        "/api/v1/auth/signup",
        json={
            "tenant_name": "E2E Tenant",
            "tenant_slug": tenant_slug,
            "full_name": "E2E Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert signup_response.status_code == 200

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
        headers={"host": f"{tenant_slug}.localhost"},
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["data"]["access_token"]

    courses_response = client.get(
        "/api/v1/courses",
        headers={
            "authorization": f"Bearer {access_token}",
            "host": f"{tenant_slug}.localhost",
        },
    )

    assert courses_response.status_code == 200
