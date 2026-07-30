from uuid import UUID

from app.courses.models import Course, CourseBlock, CourseSection, CourseStatus, Lesson
from app.courses.services import block_response, course_response, lesson_response, section_response

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000010")
SECTION_ID = UUID("00000000-0000-0000-0000-000000000020")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000030")
BLOCK_ID = UUID("00000000-0000-0000-0000-000000000040")


def test_course_response_maps_public_fields() -> None:
    course = Course(
        id=COURSE_ID,
        tenant_id=TENANT_ID,
        title="Security Basics",
        slug="security-basics",
        description="Required onboarding",
        status=CourseStatus.draft.value,
    )

    response = course_response(course)

    assert response.id == COURSE_ID
    assert response.slug == "security-basics"
    assert response.status == "draft"


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
