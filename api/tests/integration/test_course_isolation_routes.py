import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import Response

from app.main import create_app
from app.tenancy.isolation import covers_isolation
from tests.isolation_client import IsolationTestClient

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"
TEST_PASSWORD = "correct horse battery staple"  # noqa: S105


@pytest.mark.integration
@covers_isolation("POST", "/api/v1/courses")
@covers_isolation("GET", "/api/v1/courses")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}")
@covers_isolation("POST", "/api/v1/courses/{course_id}/sections")
@covers_isolation("POST", "/api/v1/courses/{course_id}/lessons")
@covers_isolation("POST", "/api/v1/courses/{course_id}/blocks")
@covers_isolation("POST", "/api/v1/courses/{course_id}/media")
@covers_isolation("PUT", "/api/v1/courses/{course_id}/sections/order")
@covers_isolation("POST", "/api/v1/courses/{course_id}/publish")
def test_tenant_b_cannot_attack_tenant_a_course_routes() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    isolation_client = IsolationTestClient(client)
    tenant_a = _signup(client, "tenant-a")
    tenant_b = _signup(client, "tenant-b")
    token_a = _login(client, tenant_a.slug, tenant_a.email)
    token_b = _login(client, tenant_b.slug, tenant_b.email)
    headers_a = _headers(tenant_a.slug, token_a)
    headers_b = _headers(tenant_b.slug, token_b)

    course_response = isolation_client.post(
        "/api/v1/courses",
        json={
            "title": "Tenant A Security",
            "slug": f"tenant-a-security-{uuid4().hex[:8]}",
            "description": "Tenant A private course",
        },
        headers=headers_a,
    )
    assert course_response.status_code == 200
    course_id = course_response.json()["data"]["id"]

    section_response = isolation_client.post(
        "/api/v1/courses/{course_id}/sections",
        f"/api/v1/courses/{course_id}/sections",
        json={"title": "Private Section", "position": 0},
        headers=headers_a,
    )
    assert section_response.status_code == 200
    section_id = section_response.json()["data"]["id"]

    lesson_response = isolation_client.post(
        "/api/v1/courses/{course_id}/lessons",
        f"/api/v1/courses/{course_id}/lessons",
        json={"section_id": section_id, "title": "Private Lesson", "position": 0},
        headers=headers_a,
    )
    assert lesson_response.status_code == 200
    lesson_id = lesson_response.json()["data"]["id"]

    list_response = isolation_client.get("/api/v1/courses", headers=headers_b)
    assert list_response.status_code == 200
    assert list_response.json()["data"] == {"items": [], "next_cursor": None}

    patch_response = isolation_client.patch(
        "/api/v1/courses/{course_id}",
        f"/api/v1/courses/{course_id}",
        json={"title": "Tenant B Mutated Title"},
        headers=headers_b,
    )
    assert patch_response.status_code == 404
    assert "Tenant A Security" in _tenant_course_titles(client, headers_a)

    delete_response = isolation_client.delete(
        "/api/v1/courses/{course_id}",
        f"/api/v1/courses/{course_id}",
        headers=headers_b,
    )
    assert delete_response.status_code == 404
    assert "Tenant A Security" in _tenant_course_titles(client, headers_a)

    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/sections",
            f"/api/v1/courses/{course_id}/sections",
            json={"title": "Tenant B Section", "position": 1},
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/lessons",
            f"/api/v1/courses/{course_id}/lessons",
            json={"section_id": section_id, "title": "Tenant B Lesson", "position": 1},
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/blocks",
            f"/api/v1/courses/{course_id}/blocks",
            json={
                "lesson_id": lesson_id,
                "block_type": "text",
                "content": {"type": "text", "markdown": "Tenant B content"},
                "position": 0,
            },
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/media",
            f"/api/v1/courses/{course_id}/media",
            json={
                "object_key": f"tenants/{tenant_b.tenant_id}/courses/{course_id}/image.png",
                "file_name": "image.png",
                "content_type": "image/png",
                "byte_size": 10,
            },
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.put(
            "/api/v1/courses/{course_id}/sections/order",
            f"/api/v1/courses/{course_id}/sections/order",
            json={"ordered_ids": [section_id]},
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/publish",
            f"/api/v1/courses/{course_id}/publish",
            headers=headers_b,
        ),
    )


class TenantAccount:
    def __init__(self, *, slug: str, email: str, tenant_id: str) -> None:
        self.slug = slug
        self.email = email
        self.tenant_id = tenant_id


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
    return TenantAccount(
        slug=slug,
        email=email,
        tenant_id=response.json()["data"]["user"]["tenant_id"],
    )


def _login(client: TestClient, slug: str, email: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
        headers={"host": f"{slug}.localhost"},
    )
    assert response.status_code == 200
    return str(response.json()["data"]["access_token"])


def _headers(slug: str, token: str) -> dict[str, str]:
    return {"authorization": f"Bearer {token}", "host": f"{slug}.localhost"}


def _tenant_course_titles(client: TestClient, headers: dict[str, str]) -> set[str]:
    response = client.get("/api/v1/courses", headers=headers)
    assert response.status_code == 200
    return {item["title"] for item in response.json()["data"]["items"]}


def _assert_not_found(response: Response) -> None:
    assert response.status_code == 404
