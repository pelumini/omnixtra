import os
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import Response

from app.core.security import create_access_token
from app.main import create_app
from app.tenancy.isolation import covers_isolation
from tests.isolation_client import IsolationTestClient

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
@covers_isolation("POST", "/api/v1/ai/courses/{course_id}/tutor/jobs")
@covers_isolation("GET", "/api/v1/ai/courses/{course_id}/tutor/jobs/{job_id}/events")
@covers_isolation("GET", "/api/v1/ai/conversations/{conversation_id}")
def test_tenant_b_cannot_attack_tenant_a_ai_routes() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    tenant_a = _signup(client, "ai-a")
    tenant_b = _signup(client, "ai-b")
    admin_headers_a = _headers(tenant_a.slug, tenant_a.access_token)
    tutor_headers_a = _headers(tenant_a.slug, _learner_token(tenant_a))
    tutor_headers_b = _headers(tenant_b.slug, _learner_token(tenant_b))
    course_id = _course_with_lesson(client, admin_headers_a)

    job_response = isolation_client.post(
        "/api/v1/ai/courses/{course_id}/tutor/jobs",
        f"/api/v1/ai/courses/{course_id}/tutor/jobs",
        json={"question": "What is private onboarding?"},
        headers={**tutor_headers_a, "idempotency-key": f"ai-job-{uuid4()}"},
    )
    assert job_response.status_code == 200
    job = job_response.json()["data"]

    _assert_not_found(
        isolation_client.post(
            "/api/v1/ai/courses/{course_id}/tutor/jobs",
            f"/api/v1/ai/courses/{course_id}/tutor/jobs",
            json={"question": "What is private onboarding?"},
            headers={**tutor_headers_b, "idempotency-key": f"ai-attack-{uuid4()}"},
        ),
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/ai/conversations/{conversation_id}",
            f"/api/v1/ai/conversations/{job['conversation_id']}",
            headers=tutor_headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/ai/courses/{course_id}/tutor/jobs/{job_id}/events",
            f"/api/v1/ai/courses/{course_id}/tutor/jobs/{job['id']}/events",
            headers=tutor_headers_b,
        ),
    )


class TenantAccount:
    def __init__(self, *, slug: str, user_id: str, tenant_id: str, access_token: str) -> None:
        self.slug = slug
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.access_token = access_token


def _signup(client: TestClient, label: str) -> TenantAccount:
    slug = f"{label}-{uuid4().hex[:12]}"
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": label,
            "tenant_slug": slug,
            "full_name": "Isolation Admin",
            "email": f"{slug}@example.com",
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    return TenantAccount(
        slug=slug,
        user_id=data["user_id"],
        tenant_id=data["tenant_id"],
        access_token=data["access_token"],
    )


def _learner_token(account: TenantAccount) -> str:
    return create_access_token(
        subject=UUID(account.user_id),
        tenant_id=UUID(account.tenant_id),
        role="learner",
    )


def _headers(slug: str, token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}", "host": f"{slug}.localhost"}


def _course_with_lesson(client: TestClient, headers: dict[str, str]) -> str:
    course = client.post(
        "/api/v1/courses",
        json={
            "title": "Tenant A AI",
            "slug": f"tenant-a-ai-{uuid4().hex[:8]}",
            "description": "Private AI course",
        },
        headers=headers,
    )
    assert course.status_code == 200
    course_id = course.json()["data"]["id"]
    section = client.post(
        f"/api/v1/courses/{course_id}/sections",
        json={"title": "Private Section", "position": 0},
        headers=headers,
    )
    assert section.status_code == 200
    lesson = client.post(
        f"/api/v1/courses/{course_id}/lessons",
        json={
            "section_id": section.json()["data"]["id"],
            "title": "Private Lesson",
            "position": 0,
        },
        headers=headers,
    )
    assert lesson.status_code == 200
    return course_id


def _assert_not_found(response: Response) -> None:
    assert response.status_code == 404
