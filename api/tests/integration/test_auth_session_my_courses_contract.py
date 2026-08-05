import os
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.auth.routes import _rate_limit_buckets
from app.auth.services import hash_auth_token
from app.core.security import create_access_token
from app.main import create_app
from app.tenancy.isolation import covers_isolation
from tests.isolation_client import IsolationTestClient

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/auth/session")
def test_auth_session_reports_allow_list_and_membership_states() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"session-{run_id}")
    admin_headers = _headers(tenant.slug, tenant.access_token)

    admin_response = isolation_client.get("/api/v1/auth/session", headers=admin_headers)
    assert admin_response.status_code == 200
    admin_data = admin_response.json()["data"]
    assert admin_data["membership"] == {
        "tenant_id": tenant.tenant_id,
        "org_role": "tenant_admin",
    }
    assert set(admin_data["user"]) == {"id", "email", "full_name"}
    assert "password_hash" not in admin_data["user"]
    assert "access_token" not in admin_data["user"]

    member = _accept_invitation(
        client,
        tenant,
        email=f"member-{run_id}@example.com",
        org_role="member",
    )
    member_response = client.get(
        "/api/v1/auth/session",
        headers=_headers(tenant.slug, member.access_token),
    )
    assert member_response.status_code == 200
    assert member_response.json()["data"]["membership"]["org_role"] == "member"

    user_without_membership = _insert_user_without_membership(
        tenant.tenant_id,
        email=f"pending-{run_id}@example.com",
    )
    pending_token = create_access_token(
        subject=UUID(user_without_membership),
        tenant_id=UUID(tenant.tenant_id),
        role="member",
    )
    pending_response = client.get(
        "/api/v1/auth/session",
        headers=_headers(tenant.slug, pending_token),
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["data"]["membership"] is None

    other_tenant = _signup(client, f"session-other-{run_id}")
    cross_response = client.get(
        "/api/v1/auth/session",
        headers=_headers(other_tenant.slug, tenant.access_token),
    )
    assert cross_response.status_code == 401


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/auth/invitations/{token}")
def test_invitation_preview_is_unauthenticated_and_returns_only_join_fields() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    _rate_limit_buckets.clear()
    client = TestClient(create_app())
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"preview-{run_id}")
    email = f"preview-member-{run_id}@example.com"
    token = _create_invitation(client, tenant, email=email, org_role="tenant_admin")

    response = client.get(
        f"/api/v1/auth/invitations/{token}",
        headers={"host": f"{tenant.slug}.localhost"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "organization_name": f"preview-{run_id}",
        "email": email,
    }
    assert set(response.json()["data"]) == {"organization_name", "email"}
    assert "authorization" not in response.request.headers


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/auth/invitations/{token}")
def test_invitation_preview_invalid_states_are_byte_identical() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    _rate_limit_buckets.clear()
    client = TestClient(create_app())
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"preview-oracle-{run_id}")
    expired_token = _create_invitation(
        client,
        tenant,
        email=f"expired-{run_id}@example.com",
        org_role="member",
    )
    used_email = f"used-{run_id}@example.com"
    used_token = _create_invitation(client, tenant, email=used_email, org_role="member")
    never_existed_token = f"never-existed-{uuid4().hex}{uuid4().hex}"

    _expire_invitation(tenant.tenant_id, expired_token)
    _accept_invitation_with_token(client, tenant, token=used_token, email=used_email)

    responses = [
        client.get(
            f"/api/v1/auth/invitations/{token}",
            headers={"host": f"{tenant.slug}.localhost"},
        )
        for token in (expired_token, used_token, never_existed_token)
    ]

    assert {response.status_code for response in responses} == {404}
    assert responses[0].content == responses[1].content == responses[2].content


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/auth/invitations/{token}")
def test_invitation_preview_rate_limit_is_per_ip_and_unauthenticated() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    _rate_limit_buckets.clear()
    client = TestClient(create_app())
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"preview-limit-{run_id}")
    token = _create_invitation(
        client,
        tenant,
        email=f"limit-{run_id}@example.com",
        org_role="member",
    )

    headers = {"host": f"{tenant.slug}.localhost"}
    for _index in range(5):
        assert client.get(f"/api/v1/auth/invitations/{token}", headers=headers).status_code == 200

    response = client.get(f"/api/v1/auth/invitations/{token}", headers=headers)

    assert response.status_code == 429


@pytest.mark.integration
@covers_isolation("GET", "/api/v1/learning/my-courses")
def test_my_courses_lists_current_users_enrolments_with_roles_only() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    run_id = uuid4().hex[:12]
    tenant = _signup(client, f"my-courses-{run_id}")
    headers = _headers(tenant.slug, tenant.access_token)

    learner_course = _create_course(client, headers, "Learner Track")
    facilitator_course = _create_course(client, headers, "Facilitator Track")
    owner_course = _create_course(client, headers, "Owner Track")
    _set_course_role(tenant.tenant_id, tenant.user_id, learner_course, "learner")
    _set_course_role(tenant.tenant_id, tenant.user_id, facilitator_course, "facilitator")

    response = isolation_client.get("/api/v1/learning/my-courses", headers=headers)
    assert response.status_code == 200
    courses = response.json()["data"]["courses"]
    roles_by_title = {course["title"]: course["course_role"] for course in courses}
    assert roles_by_title == {
        "Facilitator Track": "facilitator",
        "Learner Track": "learner",
        "Owner Track": "course_owner",
    }
    assert {course["course_id"] for course in courses} == {
        learner_course,
        facilitator_course,
        owner_course,
    }

    other_user = _insert_user_without_membership(
        tenant.tenant_id,
        email=f"other-user-{run_id}@example.com",
    )
    other_user_course = _insert_course_for_user(
        tenant.tenant_id,
        UUID(other_user),
        title="Other User Course",
        slug=f"other-user-course-{run_id}",
    )
    same_tenant_response = client.get("/api/v1/learning/my-courses", headers=headers)
    assert same_tenant_response.status_code == 200
    visible_course_ids = {
        course["course_id"] for course in same_tenant_response.json()["data"]["courses"]
    }
    assert other_user_course not in visible_course_ids

    empty_member = _accept_invitation(
        client,
        tenant,
        email=f"empty-{run_id}@example.com",
        org_role="member",
    )
    empty_response = client.get(
        "/api/v1/learning/my-courses",
        headers=_headers(tenant.slug, empty_member.access_token),
    )
    assert empty_response.status_code == 200
    assert empty_response.json()["data"] == {"courses": []}

    other_tenant = _signup(client, f"my-courses-other-{run_id}")
    cross_tenant_response = client.get(
        "/api/v1/learning/my-courses",
        headers=_headers(other_tenant.slug, other_tenant.access_token),
    )
    assert cross_tenant_response.status_code == 200
    assert cross_tenant_response.json()["data"] == {"courses": []}


class TenantAccount:
    def __init__(
        self,
        *,
        slug: str,
        email: str,
        user_id: str,
        tenant_id: str,
        access_token: str,
    ) -> None:
        self.slug = slug
        self.email = email
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.access_token = access_token


def _signup(client: TestClient, label: str) -> TenantAccount:
    slug = f"{label}-{uuid4().hex[:8]}"
    email = f"{slug}@example.com"
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": label,
            "tenant_slug": slug,
            "full_name": "Contract Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    return TenantAccount(
        slug=slug,
        email=email,
        user_id=data["user_id"],
        tenant_id=data["tenant_id"],
        access_token=data["access_token"],
    )


def _headers(slug: str, token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}", "host": f"{slug}.localhost"}


def _accept_invitation(
    client: TestClient,
    tenant: TenantAccount,
    *,
    email: str,
    org_role: str,
) -> TenantAccount:
    invitation = client.post(
        "/api/v1/tenant/invitations",
        json={"email": email, "org_role": org_role},
        headers=_headers(tenant.slug, tenant.access_token),
    )
    assert invitation.status_code == 200, invitation.text
    token = invitation.json()["data"]["token"]
    response = client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": token,
            "email": email,
            "full_name": "Contract Member",
            "password": TEST_PASSWORD,
        },
        headers={"host": f"{tenant.slug}.localhost"},
    )
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    return TenantAccount(
        slug=tenant.slug,
        email=email,
        user_id=data["user"]["id"],
        tenant_id=data["user"]["tenant_id"],
        access_token=data["access_token"],
    )


def _create_invitation(
    client: TestClient,
    tenant: TenantAccount,
    *,
    email: str,
    org_role: str,
) -> str:
    invitation = client.post(
        "/api/v1/tenant/invitations",
        json={"email": email, "org_role": org_role},
        headers=_headers(tenant.slug, tenant.access_token),
    )
    assert invitation.status_code == 200, invitation.text
    token = invitation.json()["data"]["token"]
    assert isinstance(token, str)
    return token


def _accept_invitation_with_token(
    client: TestClient,
    tenant: TenantAccount,
    *,
    token: str,
    email: str,
) -> None:
    response = client.post(
        "/api/v1/auth/invitations/accept",
        json={
            "token": token,
            "email": email,
            "full_name": "Contract Member",
            "password": TEST_PASSWORD,
        },
        headers={"host": f"{tenant.slug}.localhost"},
    )
    assert response.status_code == 200, response.text


def _expire_invitation(tenant_id: str, raw_token: str) -> None:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            UPDATE invitations
            SET expires_at = %s
            WHERE tenant_id = %s
              AND token_hash = %s
            """,
            (
                datetime.now(UTC) - timedelta(minutes=1),
                tenant_id,
                hash_auth_token(raw_token),
            ),
        )


def _create_course(client: TestClient, headers: dict[str, str], title: str) -> str:
    response = client.post(
        "/api/v1/courses",
        json={
            "title": title,
            "slug": f"{title.lower().replace(' ', '-')}-{uuid4().hex[:8]}",
            "description": None,
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return str(response.json()["data"]["id"])


def _insert_user_without_membership(tenant_id: str, *, email: str) -> str:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    user_id = uuid4()
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            INSERT INTO users (
                id, tenant_id, email, full_name, password_hash, role, status, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, NULL, 'member', 'active', now(), now())
            """,
            (user_id, tenant_id, email, "Pending Member"),
        )
    return str(user_id)


def _insert_course_for_user(tenant_id: str, user_id: UUID, *, title: str, slug: str) -> str:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    course_id = uuid4()
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            INSERT INTO courses (
                id, tenant_id, title, slug, description, status, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, NULL, 'draft', now(), now())
            """,
            (course_id, tenant_id, title, slug),
        )
        cursor.execute(
            """
            INSERT INTO enrolments (
                id,
                tenant_id,
                learner_id,
                course_id,
                course_role,
                status,
                idempotency_key,
                created_at,
                updated_at
            )
            VALUES (%s, %s, %s, %s, 'learner', 'active', %s, now(), now())
            """,
            (uuid4(), tenant_id, user_id, course_id, f"other-user-{course_id}-{user_id}"),
        )
    return str(course_id)


def _set_course_role(tenant_id: str, user_id: str, course_id: str, course_role: str) -> None:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            UPDATE enrolments
            SET course_role = %s
            WHERE tenant_id = %s
              AND learner_id = %s
              AND course_id = %s
            """,
            (course_role, tenant_id, user_id, course_id),
        )
