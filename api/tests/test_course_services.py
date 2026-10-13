from uuid import UUID

from app.courses.models import (
    Course,
    CourseBlock,
    CourseMediaAsset,
    CourseSection,
    CourseStatus,
    Lesson,
)
from app.courses.services import (
    block_response,
    course_response,
    lesson_response,
    media_asset_response,
    section_response,
)

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000010")
SECTION_ID = UUID("00000000-0000-0000-0000-000000000020")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000030")
BLOCK_ID = UUID("00000000-0000-0000-0000-000000000040")
MEDIA_ID = UUID("00000000-0000-0000-0000-000000000050")


def test_course_response_maps_public_fields() -> None:
    course = Course(
        id=COURSE_ID,
        tenant_id=TENANT_ID,
        title="Security Basics",
        slug="security-basics",
        description="Required onboarding",
        thumbnail_url="https://cdn.example.com/course.png",
        category="Security",
        tags=["required"],
        language="en",
        learning_outcomes=["Recognize threats"],
        target_audience="All employees",
        difficulty="beginner",
        delivery_format="self_paced",
        estimated_duration_minutes=45,
        status=CourseStatus.draft.value,
    )

    response = course_response(course)

    assert response.id == COURSE_ID
    assert response.slug == "security-basics"
    assert response.status == "draft"
    assert response.category == "Security"
    assert response.estimated_duration_minutes == 45


def test_nested_course_authoring_responses_map_parent_fields() -> None:
    section = CourseSection(
        id=SECTION_ID,
        tenant_id=TENANT_ID,
        course_id=COURSE_ID,
        title="Start",
        position=0,
    )
    lesson = Lesson(
        id=LESSON_ID,
        tenant_id=TENANT_ID,
        course_id=COURSE_ID,
        section_id=SECTION_ID,
        title="Welcome",
        position=0,
    )
    block = CourseBlock(
        id=BLOCK_ID,
        tenant_id=TENANT_ID,
        course_id=COURSE_ID,
        lesson_id=LESSON_ID,
        block_type="text",
        content={"type": "text", "markdown": "Hello"},
        position=0,
    )

    assert section_response(section).course_id == COURSE_ID
    assert lesson_response(lesson).section_id == SECTION_ID
    assert block_response(block).lesson_id == LESSON_ID


def test_media_asset_response_maps_storage_metadata() -> None:
    asset = CourseMediaAsset(
        id=MEDIA_ID,
        tenant_id=TENANT_ID,
        course_id=COURSE_ID,
        object_key=f"tenants/{TENANT_ID}/courses/{COURSE_ID}/hero.png",
        file_name="hero.png",
        content_type="image/png",
        byte_size=1024,
        checksum_sha256="a" * 64,
    )

    response = media_asset_response(asset)

    assert response.object_key.startswith(f"tenants/{TENANT_ID}/courses/{COURSE_ID}/")
    assert response.byte_size == 1024
