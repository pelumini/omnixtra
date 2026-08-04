import os
from http.cookies import SimpleCookie
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE
from app.auth.services import hash_auth_token
from app.main import create_app
from app.tenancy.isolation import covers_isolation

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
def test_tenant_creation_login_and_protected_route_with_tenant_host() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_slug = f"e2e-{uuid4().hex[:12]}"
    email = f"learner-{tenant_slug}@example.com"
    client = TestClient(create_app())

    tenant_response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": "E2E Tenant",
            "tenant_slug": tenant_slug,
            "full_name": "E2E Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert tenant_response.status_code == 200

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

    cookie_courses_response = client.get(
        "/api/v1/courses",
        headers={
            "cookie": f"{ACCESS_TOKEN_COOKIE}={access_token}",
            "host": f"{tenant_slug}.localhost",
        },
    )

    assert cookie_courses_response.status_code == 200

    cookies = _cookies(login_response.headers.get_list("set-cookie"))
    assert cookies[ACCESS_TOKEN_COOKIE]["httponly"] is True
    assert cookies[ACCESS_TOKEN_COOKIE]["secure"] is True
    assert cookies[ACCESS_TOKEN_COOKIE]["samesite"] == "lax"
    assert cookies[REFRESH_TOKEN_COOKIE]["httponly"] is True
    assert cookies[REFRESH_TOKEN_COOKIE]["secure"] is True
    assert cookies[REFRESH_TOKEN_COOKIE]["samesite"] == "lax"

    original_refresh_token = cookies[REFRESH_TOKEN_COOKIE].value
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        headers={
            "cookie": f"{REFRESH_TOKEN_COOKIE}={original_refresh_token}",
            "host": f"{tenant_slug}.localhost",
        },
    )

    assert refresh_response.status_code == 200
    rotated_cookies = _cookies(refresh_response.headers.get_list("set-cookie"))
    assert rotated_cookies[REFRESH_TOKEN_COOKIE].value != original_refresh_token

    replay_response = client.post(
        "/api/v1/auth/refresh",
        headers={
            "cookie": f"{REFRESH_TOKEN_COOKIE}={original_refresh_token}",
            "host": f"{tenant_slug}.localhost",
        },
    )

    assert replay_response.status_code == 401


@pytest.mark.integration
@covers_isolation("POST", "/api/v1/tenant/invitations")
def test_invitation_accept_uses_token_role_not_body_role() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_slug = f"invite-role-{uuid4().hex[:12]}"
    client = TestClient(create_app())
    tenant = _create_tenant(client, tenant_slug)
    invited_email = f"member-{tenant_slug}@example.com"

    invitation_response = _invite(
        client,
        tenant,
        email=invited_email,
        org_role="member",
    )
    assert invitation_response.status_code == 200
    token = invitation_response.json()["data"]["token"]

    accept_response = client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": token,
            "email": invited_email,
            "full_name": "Invited Member",
            "password": TEST_PASSWORD,
            "org_role": "tenant_admin",
        },
        headers={"host": f"{tenant_slug}.localhost"},
    )

    assert accept_response.status_code == 200
    assert _membership_role(tenant["tenant_id"], invited_email) == "member"


@pytest.mark.integration
@covers_isolation("POST", "/api/v1/tenant/invitations")
def test_invitation_accept_rejects_expired_used_and_cross_tenant_tokens() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    run_id = uuid4().hex[:12]
    tenant_a = _create_tenant(client, f"invite-a-{run_id}")
    tenant_b = _create_tenant(client, f"invite-b-{run_id}")

    expired_email = f"expired-{run_id}@example.com"
    expired_invitation = _invite(client, tenant_a, email=expired_email, org_role="member")
    assert expired_invitation.status_code == 200
    expired_token = expired_invitation.json()["data"]["token"]
    _expire_invitation(tenant_a["tenant_id"], expired_token)
    expired_response = _accept_invitation(client, tenant_a["slug"], expired_token, expired_email)
    assert expired_response.status_code == 401

    used_email = f"used-{run_id}@example.com"
    used_invitation = _invite(client, tenant_a, email=used_email, org_role="member")
    assert used_invitation.status_code == 200
    used_token = used_invitation.json()["data"]["token"]
    first_accept = _accept_invitation(client, tenant_a["slug"], used_token, used_email)
    assert first_accept.status_code == 200
    second_accept = _accept_invitation(client, tenant_a["slug"], used_token, used_email)
    assert second_accept.status_code == 400

    cross_email = f"cross-{run_id}@example.com"
    cross_invitation = _invite(client, tenant_a, email=cross_email, org_role="member")
    assert cross_invitation.status_code == 200
    cross_token = cross_invitation.json()["data"]["token"]
    cross_response = _accept_invitation(client, tenant_b["slug"], cross_token, cross_email)
    assert cross_response.status_code == 404
    assert _membership_role(tenant_b["tenant_id"], cross_email) is None


def _cookies(headers: list[str]) -> SimpleCookie[str]:
    cookies: SimpleCookie[str] = SimpleCookie()
    for header in headers:
        cookies.load(header)
    return cookies


def _create_tenant(client: TestClient, slug: str) -> dict[str, str]:
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
    return {
        "slug": slug,
        "tenant_id": data["tenant_id"],
        "access_token": data["access_token"],
    }


def _invite(
    client: TestClient,
    tenant: dict[str, str],
    *,
    email: str,
    org_role: str,
) -> object:
    return client.post(
        "/api/v1/tenant/invitations",
        json={"email": email, "org_role": org_role},
        headers={
            "host": f"{tenant['slug']}.localhost",
            "authorization": f"Bearer {tenant['access_token']}",
        },
    )


def _accept_invitation(client: TestClient, slug: str, token: str, email: str) -> object:
    return client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": token,
            "email": email,
            "full_name": "Invited User",
            "password": TEST_PASSWORD,
        },
        headers={"host": f"{slug}.localhost"},
    )


def _membership_role(tenant_id: str, email: str) -> str | None:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            SELECT memberships.org_role
            FROM memberships
            JOIN users ON users.id = memberships.user_id
            WHERE memberships.tenant_id = %s
              AND users.email = %s
              AND memberships.deleted_at IS NULL
              AND users.deleted_at IS NULL
            """,
            (tenant_id, email),
        )
        row = cursor.fetchone()
    return None if row is None else str(row[0])


def _expire_invitation(tenant_id: str, token: str) -> None:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            UPDATE invitations
            SET expires_at = now() - interval '1 minute'
            WHERE tenant_id = %s
              AND token_hash = %s
            """,
            (tenant_id, hash_auth_token(token)),
        )
