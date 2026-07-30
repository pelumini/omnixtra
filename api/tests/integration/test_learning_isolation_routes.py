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
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/enrolments")
@covers_isolation("GET", "/api/v1/learning/courses/{course_id}/player")
@covers_isolation("PUT", "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/completion")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/certificate")
@covers_isolation("GET", "/api/v1/learning/courses/{course_id}/certificate/download")
def test_tenant_b_cannot_attack_tenant_a_learning_routes() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    tenant_a = _signup(client, "learning-a")
    tenant_b = _signup(client, "learning-b")
    admin_headers_a = _headers(tenant_a.slug, tenant_a.access_token)
    learner_headers_b = _headers(
        tenant_b.slug,
        create_access_token(
            subject=UUID(tenant_b.user_id),
            tenant_id=UUID(tenant_b.tenant_id),
            role="learner",
        ),
    )
    course_id, lesson_id, quiz_block_id = _published_course(client, admin_headers_a)

    _assert_not_found(
        isolation_client.post(
            "/api/v1/learning/courses/{course_id}/enrolments",
            f"/api/v1/learning/courses/{course_id}/enrolments",
            headers={**learner_headers_b, "idempotency-key": f"enrol-{uuid4()}"},
        ),
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/learning/courses/{course_id}/player",
            f"/api/v1/learning/courses/{course_id}/player",
            headers=learner_headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.put(
            "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress",
            f"/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress",
            json={"last_position": 10, "percent_complete": 50},
            headers=learner_headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts",
            f"/api/v1/learning/courses/{course_id}/quizzes/{quiz_block_id}/attempts",
            json={"selected_option_id": "a"},
            headers=learner_headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/learning/courses/{course_id}/completion",
            f"/api/v1/learning/courses/{course_id}/completion",
            headers={**learner_headers_b, "idempotency-key": f"complete-{uuid4()}"},
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/learning/courses/{course_id}/certificate",
            f"/api/v1/learning/courses/{course_id}/certificate",
            headers={**learner_headers_b, "idempotency-key": f"certificate-{uuid4()}"},
        ),
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/learning/courses/{course_id}/certificate/download",
            f"/api/v1/learning/courses/{course_id}/certificate/download",
            headers=learner_headers_b,
        ),
    )


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
    slug = f"{label}-{uuid4().hex[:12]}"
    email = f"{slug}@example.com"
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "tenant_name": label,
            "tenant_slug": slug,
            "full_name": "Isolation Admin",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    return TenantAccount(
        slug=slug,
        email=email,
        user_id=data["user"]["id"],
        tenant_id=data["user"]["tenant_id"],
        access_token=data["access_token"],
    )


def _headers(slug: str, token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}", "host": f"{slug}.localhost"}


def _published_course(client: TestClient, headers: dict[str, str]) -> tuple[str, str, str]:
    course = client.post(
        "/api/v1/courses",
        json={
            "title": "Tenant A Learning",
            "slug": f"tenant-a-learning-{uuid4().hex[:8]}",
            "description": "Private learning course",
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
    lesson_id = lesson.json()["data"]["id"]
    block = client.post(
        f"/api/v1/courses/{course_id}/blocks",
        json={
            "lesson_id": lesson_id,
            "block_type": "quiz",
            "content": {
                "type": "quiz",
                "question": "Pick one",
                "options": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}],
                "correct_option_id": "a",
            },
            "position": 0,
        },
        headers=headers,
    )
    assert block.status_code == 200
    publish = client.post(f"/api/v1/courses/{course_id}/publish", headers=headers)
    assert publish.status_code == 200
    return course_id, lesson_id, block.json()["data"]["id"]


def _assert_not_found(response: Response) -> None:
    assert response.status_code == 404
