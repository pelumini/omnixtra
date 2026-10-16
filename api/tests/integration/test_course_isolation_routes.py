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
@covers_isolation("GET", "/api/v1/courses/{course_id}/structure")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}")
@covers_isolation("POST", "/api/v1/courses/{course_id}/sections")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}/sections/{section_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}/sections/{section_id}")
@covers_isolation("POST", "/api/v1/courses/{course_id}/lessons")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}/lessons/{lesson_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}/lessons/{lesson_id}")
@covers_isolation("GET", "/api/v1/courses/{course_id}/lessons")
@covers_isolation("POST", "/api/v1/courses/{course_id}/blocks")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}")
@covers_isolation("PUT", "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order")
@covers_isolation("POST", "/api/v1/courses/{course_id}/media")
@covers_isolation("POST", "/api/v1/courses/{course_id}/media/presign")
@covers_isolation("POST", "/api/v1/courses/{course_id}/media/confirm")
@covers_isolation("GET", "/api/v1/courses/{course_id}/media/{asset_id}/url")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}/media/{asset_id}")
@covers_isolation("PUT", "/api/v1/courses/{course_id}/sections/order")
@covers_isolation("PUT", "/api/v1/courses/{course_id}/sections/{section_id}/lessons/order")
@covers_isolation("POST", "/api/v1/courses/{course_id}/publish")
def test_tenant_b_cannot_attack_tenant_a_course_routes() -> None:  # noqa: PLR0915
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
    block_response = isolation_client.post(
        "/api/v1/courses/{course_id}/blocks",
        f"/api/v1/courses/{course_id}/blocks",
        json={
            "lesson_id": lesson_id,
            "block_type": "text",
            "content": {"type": "text", "markdown": "Tenant A content"},
            "position": 1,
        },
        headers=headers_a,
    )
    assert block_response.status_code == 200
    block_id = block_response.json()["data"]["id"]

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
    foreign_asset_id = uuid4()
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/media/presign",
            f"/api/v1/courses/{course_id}/media/presign",
            json={
                "byte_size": 10,
                "content_type": "image/png",
                "filename": "x.png",
                "kind": "image",
            },
            headers=headers_b,
        )
    )
    _assert_not_found(
        isolation_client.post(
            "/api/v1/courses/{course_id}/media/confirm",
            f"/api/v1/courses/{course_id}/media/confirm",
            json={
                "byte_size": 10,
                "content_type": "image/png",
                "kind": "image",
                "object_key": "invalid",
            },
            headers=headers_b,
        )
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/courses/{course_id}/media/{asset_id}/url",
            f"/api/v1/courses/{course_id}/media/{foreign_asset_id}/url",
            headers=headers_b,
        )
    )
    _assert_not_found(
        isolation_client.delete(
            "/api/v1/courses/{course_id}/media/{asset_id}",
            f"/api/v1/courses/{course_id}/media/{foreign_asset_id}",
            headers=headers_b,
        )
    )
    _assert_not_found(
        isolation_client.get(
            "/api/v1/courses/{course_id}/structure",
            f"/api/v1/courses/{course_id}/structure",
            headers=headers_b,
        ),
    )
    for method, template, path, payload in (
        (
            "patch",
            "/api/v1/courses/{course_id}/sections/{section_id}",
            f"/api/v1/courses/{course_id}/sections/{section_id}",
            {"title": "Attack"},
        ),
        (
            "delete",
            "/api/v1/courses/{course_id}/sections/{section_id}",
            f"/api/v1/courses/{course_id}/sections/{section_id}",
            None,
        ),
        (
            "patch",
            "/api/v1/courses/{course_id}/lessons/{lesson_id}",
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}",
            {"title": "Attack"},
        ),
        (
            "delete",
            "/api/v1/courses/{course_id}/lessons/{lesson_id}",
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}",
            None,
        ),
        (
            "put",
            "/api/v1/courses/{course_id}/sections/{section_id}/lessons/order",
            f"/api/v1/courses/{course_id}/sections/{section_id}/lessons/order",
            {"ordered_ids": [lesson_id]},
        ),
    ):
        caller = getattr(isolation_client, method)
        kwargs = {"headers": headers_b}
        if payload is not None:
            kwargs["json"] = payload
        _assert_not_found(caller(template, path, **kwargs))

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
        isolation_client.patch(
            "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}",
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}",
            json={"content": {"type": "text", "markdown": "Attack"}},
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.delete(
            "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}",
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}",
            headers=headers_b,
        ),
    )
    _assert_not_found(
        isolation_client.put(
            "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order",
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order",
            json={"ordered_ids": [block_id]},
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
def test_course_authoring_slice_creates_owner_and_text_lessons() -> None:  # noqa: PLR0915
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

    setup_response = client.patch(
        f"/api/v1/courses/{course['id']}",
        json={
            "thumbnail_url": "https://cdn.example.com/first-course.png",
            "category": "Onboarding",
            "tags": ["new hires", "required"],
            "language": "en",
            "learning_outcomes": ["Complete the first-day checklist"],
            "target_audience": "New team members",
            "difficulty": "beginner",
            "delivery_format": "self_paced",
            "estimated_duration_minutes": 90,
        },
        headers=headers,
    )
    assert setup_response.status_code == 200
    setup = setup_response.json()["data"]
    assert setup["tags"] == ["new hires", "required"]
    assert setup["estimated_duration_minutes"] == 90

    reloaded_response = client.get(f"/api/v1/courses/{course['id']}", headers=headers)
    assert reloaded_response.status_code == 200
    reloaded = reloaded_response.json()["data"]
    assert reloaded["thumbnail_url"] == "https://cdn.example.com/first-course.png"
    assert reloaded["learning_outcomes"] == ["Complete the first-day checklist"]
    assert reloaded["delivery_format"] == "self_paced"

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

    structure_response = client.get(f"/api/v1/courses/{course['id']}/structure", headers=headers)
    assert structure_response.status_code == 200
    structure = structure_response.json()["data"]
    assert structure["sections"][0]["lessons"][0]["blocks"][0]["block_type"] == "text"
    section_id = structure["sections"][0]["id"]
    lesson_ids = [lesson["id"] for lesson in structure["sections"][0]["lessons"]]

    assert (
        client.patch(
            f"/api/v1/courses/{course['id']}/sections/{section_id}",
            json={"title": "Renamed"},
            headers=headers,
        ).json()["data"]["title"]
        == "Renamed"
    )
    assert (
        client.patch(
            f"/api/v1/courses/{course['id']}/lessons/{lesson_ids[0]}",
            json={"title": "Renamed lesson"},
            headers=headers,
        ).json()["data"]["title"]
        == "Renamed lesson"
    )
    reordered = client.put(
        f"/api/v1/courses/{course['id']}/sections/{section_id}/lessons/order",
        json={"ordered_ids": list(reversed(lesson_ids))},
        headers=headers,
    )
    assert [item["id"] for item in reordered.json()["data"]] == list(reversed(lesson_ids))
    invalid = client.put(
        f"/api/v1/courses/{course['id']}/sections/{section_id}/lessons/order",
        json={"ordered_ids": [lesson_ids[0]]},
        headers=headers,
    )
    assert invalid.status_code == 400
    assert (
        client.delete(
            f"/api/v1/courses/{course['id']}/lessons/{lesson_ids[0]}", headers=headers
        ).status_code
        == 200
    )
    assert (
        client.delete(
            f"/api/v1/courses/{course['id']}/sections/{section_id}", headers=headers
        ).status_code
        == 200
    )


@pytest.mark.integration
def test_deleted_structure_positions_can_be_reused_and_reordered() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    client = TestClient(create_app())
    tenant = _signup(client, "structure-delete")
    token = _login(client, tenant.slug, tenant.email)
    headers = _headers(tenant.slug, token)

    course_response = client.post(
        "/api/v1/courses",
        json={"title": "Structure deletion regression"},
        headers=headers,
    )
    assert course_response.status_code == 200
    course_id = course_response.json()["data"]["id"]

    section_ids: list[str] = []
    for position, title in enumerate(("Keep", "Delete")):
        response = client.post(
            f"/api/v1/courses/{course_id}/sections",
            json={"title": title, "position": position},
            headers=headers,
        )
        assert response.status_code == 200
        section_ids.append(response.json()["data"]["id"])

    deleted_lesson = client.post(
        f"/api/v1/courses/{course_id}/lessons",
        json={
            "section_id": section_ids[1],
            "title": "Removed with section",
            "position": 0,
        },
        headers=headers,
    )
    assert deleted_lesson.status_code == 200
    deleted_lesson_id = deleted_lesson.json()["data"]["id"]
    block_response = client.post(
        f"/api/v1/courses/{course_id}/blocks",
        json={
            "lesson_id": deleted_lesson_id,
            "block_type": "text",
            "content": {"type": "text", "markdown": "Must disappear"},
            "position": 0,
        },
        headers=headers,
    )
    assert block_response.status_code == 200

    delete_section_response = client.delete(
        f"/api/v1/courses/{course_id}/sections/{section_ids[1]}",
        headers=headers,
    )
    assert delete_section_response.status_code == 200
    replacement_response = client.post(
        f"/api/v1/courses/{course_id}/sections",
        json={"title": "Replacement", "position": 1},
        headers=headers,
    )
    assert replacement_response.status_code == 200

    remaining_lesson_ids: list[str] = []
    for position, title in enumerate(("First", "Middle", "Last")):
        response = client.post(
            f"/api/v1/courses/{course_id}/lessons",
            json={
                "section_id": section_ids[0],
                "title": title,
                "position": position,
            },
            headers=headers,
        )
        assert response.status_code == 200
        remaining_lesson_ids.append(response.json()["data"]["id"])

    delete_lesson_response = client.delete(
        f"/api/v1/courses/{course_id}/lessons/{remaining_lesson_ids[1]}",
        headers=headers,
    )
    assert delete_lesson_response.status_code == 200
    reordered_ids = [remaining_lesson_ids[2], remaining_lesson_ids[0]]
    reorder_response = client.put(
        f"/api/v1/courses/{course_id}/sections/{section_ids[0]}/lessons/order",
        json={"ordered_ids": reordered_ids},
        headers=headers,
    )
    assert reorder_response.status_code == 200
    assert [lesson["id"] for lesson in reorder_response.json()["data"]] == reordered_ids

    structure_response = client.get(
        f"/api/v1/courses/{course_id}/structure",
        headers=headers,
    )
    assert structure_response.status_code == 200
    sections = structure_response.json()["data"]["sections"]
    assert [section["title"] for section in sections] == ["Keep", "Replacement"]
    assert [lesson["id"] for lesson in sections[0]["lessons"]] == reordered_ids
    assert all(
        block["content"].get("markdown") != "Must disappear"
        for section in sections
        for lesson in section["lessons"]
        for block in lesson["blocks"]
    )


@pytest.mark.integration
def test_blocks_can_be_updated_reordered_deleted_and_replaced() -> None:
    if os.getenv(APP_DATABASE_URL_ENV) is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")
    client = TestClient(create_app())
    tenant = _signup(client, "block-crud")
    headers = _headers(tenant.slug, _login(client, tenant.slug, tenant.email))
    course_id = _draft_course_with_lesson(client, headers, "Block CRUD")
    structure = client.get(f"/api/v1/courses/{course_id}/structure", headers=headers).json()["data"]
    lesson_id = structure["sections"][0]["lessons"][0]["id"]
    block_ids: list[str] = []
    for position, text in enumerate(("First", "Second")):
        response = client.post(
            f"/api/v1/courses/{course_id}/blocks",
            json={
                "lesson_id": lesson_id,
                "block_type": "text",
                "content": {"type": "text", "markdown": text},
                "position": position,
            },
            headers=headers,
        )
        assert response.status_code == 200
        block_ids.append(response.json()["data"]["id"])
    updated = client.patch(
        f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_ids[0]}",
        json={"content": {"type": "text", "markdown": "Updated"}},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["content"]["markdown"] == "Updated"
    invalid = client.put(
        f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order",
        json={"ordered_ids": [block_ids[0]]},
        headers=headers,
    )
    assert invalid.status_code == 400
    reordered = client.put(
        f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order",
        json={"ordered_ids": list(reversed(block_ids))},
        headers=headers,
    )
    assert [block["id"] for block in reordered.json()["data"]] == list(reversed(block_ids))
    assert (
        client.delete(
            f"/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_ids[0]}",
            headers=headers,
        ).status_code
        == 200
    )
    replacement = client.post(
        f"/api/v1/courses/{course_id}/blocks",
        json={
            "lesson_id": lesson_id,
            "block_type": "file",
            "content": {
                "type": "file",
                "url": "https://example.com/guide.pdf",
                "file_name": "guide.pdf",
            },
            "position": 1,
        },
        headers=headers,
    )
    assert replacement.status_code == 200


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
