import os
from uuid import uuid4

import psycopg
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
@covers_isolation("GET", "/api/v1/courses/{course_id}")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}")
@covers_isolation("POST", "/api/v1/courses/{course_id}/sections")
@covers_isolation("POST", "/api/v1/courses/{course_id}/lessons")
@covers_isolation("GET", "/api/v1/courses/{course_id}/lessons")
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
        json={
            "body": "Tenant A private lesson body",
            "section_id": section_id,
            "title": "Private Lesson",
            "position": 0,
        },
        headers=headers_a,
    )
    assert lesson_response.status_code == 200
    lesson_id = lesson_response.json()["data"]["id"]

    detail_response = isolation_client.get(
        "/api/v1/courses/{course_id}",
        f"/api/v1/courses/{course_id}",
        headers=headers_a,
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["lessons"][0]["body"] == "Tenant A private lesson body"

    lessons_response = isolation_client.get(
        "/api/v1/courses/{course_id}/lessons",
        f"/api/v1/courses/{course_id}/lessons",
        headers=headers_a,
    )
    assert lessons_response.status_code == 200
    assert [lesson["title"] for lesson in lessons_response.json()["data"]] == ["Private Lesson"]

    list_response = isolation_client.get("/api/v1/courses", headers=headers_b)
    assert list_response.status_code == 200
    assert list_response.json()["data"] == {"items": [], "next_cursor": None}

    _assert_not_found(
        isolation_client.get(
            "/api/v1/courses/{course_id}",
            f"/api/v1/courses/{course_id}",
            headers=headers_b,
        ),
    )

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
        isolation_client.get(
            "/api/v1/courses/{course_id}/lessons",
            f"/api/v1/courses/{course_id}/lessons",
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


@pytest.mark.integration
def test_course_role_is_per_enrolment_through_publish_route() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    tenant = _signup(client, "course-role")
    token = _login(client, tenant.slug, tenant.email)
    headers = _headers(tenant.slug, token)

    course_a_id = _draft_course_with_lesson(client, headers, "Learner Course")
    course_b_id = _draft_course_with_lesson(client, headers, "Owner Course")
    _set_course_role(tenant.tenant_id, tenant.user_id, course_a_id, "learner")

    learner_publish = client.post(
        f"/api/v1/courses/{course_a_id}/publish",
        headers=headers,
    )
    assert learner_publish.status_code == 404

    owner_publish = client.post(
        f"/api/v1/courses/{course_b_id}/publish",
        headers=headers,
    )
    assert owner_publish.status_code == 200


@pytest.mark.integration
def test_course_authoring_slice_creates_owner_and_text_lessons() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    tenant = _signup(client, "authoring-slice")
    token = _login(client, tenant.slug, tenant.email)
    headers = _headers(tenant.slug, token)

    missing_title_response = client.post(
        "/api/v1/courses",
        json={"description": "No title"},
        headers=headers,
    )
    assert missing_title_response.status_code == 422
    assert missing_title_response.json()["error"]["details"][0] == {
        "constraint": "required",
        "field": "title",
        "message": None,
    }

    course_response = client.post(
        "/api/v1/courses",
        json={"title": "First Authoring Course", "description": "Created from the v1 flow"},
        headers=headers,
    )
    assert course_response.status_code == 200
    course = course_response.json()["data"]
    assert course["status"] == "draft"
    assert course["slug"] == "first-authoring-course"
    assert course["lesson_count"] == 0
    _assert_course_role(tenant.tenant_id, tenant.user_id, course["id"], "course_owner")

    lesson_a_response = client.post(
        f"/api/v1/courses/{course['id']}/lessons",
        json={"title": "Welcome", "body": "Welcome to the first lesson."},
        headers=headers,
    )
    assert lesson_a_response.status_code == 200
    assert lesson_a_response.json()["data"]["position"] == 0
    assert lesson_a_response.json()["data"]["body"] == "Welcome to the first lesson."

    lesson_b_response = client.post(
        f"/api/v1/courses/{course['id']}/lessons",
        json={"title": "Next Step", "body": "This is the second lesson."},
        headers=headers,
    )
    assert lesson_b_response.status_code == 200
    assert lesson_b_response.json()["data"]["position"] == 1

    lessons_response = client.get(f"/api/v1/courses/{course['id']}/lessons", headers=headers)
    assert lessons_response.status_code == 200
    assert [lesson["title"] for lesson in lessons_response.json()["data"]] == [
        "Welcome",
        "Next Step",
    ]

    detail_response = client.get(f"/api/v1/courses/{course['id']}", headers=headers)
    assert detail_response.status_code == 200
    detail = detail_response.json()["data"]
    assert detail["lesson_count"] == 2
    assert detail["lessons"][0]["body"] == "Welcome to the first lesson."


class TenantAccount:
    def __init__(self, *, slug: str, email: str, tenant_id: str, user_id: str) -> None:
        self.slug = slug
        self.email = email
        self.tenant_id = tenant_id
        self.user_id = user_id


def _signup(client: TestClient, label: str) -> TenantAccount:
    client.cookies.clear()
    slug = f"{label}-{uuid4().hex[:12]}"
    email = f"{slug}@example.com"
    response = client.post(
        "/api/v1/tenants",
        json={
            "tenant_name": label,
            "tenant_slug": slug,
            "first_name": "Isolation",
            "last_name": "Admin",
            "phone": "+44000000000",
            "email": email,
            "password": TEST_PASSWORD,
        },
        headers={"host": "localhost"},
    )
    assert response.status_code == 200
    client.cookies.clear()
    return TenantAccount(
        slug=slug,
        email=email,
        tenant_id=response.json()["data"]["tenant_id"],
        user_id=response.json()["data"]["user_id"],
    )


def _login(client: TestClient, slug: str, email: str) -> str:
    client.cookies.clear()
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


def _draft_course_with_lesson(client: TestClient, headers: dict[str, str], title: str) -> str:
    suffix = uuid4().hex[:8]
    course_response = client.post(
        "/api/v1/courses",
        json={
            "title": title,
            "slug": f"{title.lower().replace(' ', '-')}-{suffix}",
            "description": None,
        },
        headers=headers,
    )
    assert course_response.status_code == 200
    course_id = str(course_response.json()["data"]["id"])
    section_response = client.post(
        f"/api/v1/courses/{course_id}/sections",
        json={"title": "Section", "position": 0},
        headers=headers,
    )
    assert section_response.status_code == 200
    lesson_response = client.post(
        f"/api/v1/courses/{course_id}/lessons",
        json={
            "section_id": section_response.json()["data"]["id"],
            "title": "Lesson",
            "position": 0,
        },
        headers=headers,
    )
    assert lesson_response.status_code == 200
    return course_id


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


def _assert_course_role(tenant_id: str, user_id: str, course_id: str, course_role: str) -> None:
    database_url = os.environ[APP_DATABASE_URL_ENV]
    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (tenant_id,))
        cursor.execute(
            """
            SELECT course_role
            FROM enrolments
            WHERE tenant_id = %s
              AND learner_id = %s
              AND course_id = %s
            """,
            (tenant_id, user_id, course_id),
        )
        assert cursor.fetchone() == (course_role,)


def _assert_not_found(response: Response) -> None:
    assert response.status_code == 404
