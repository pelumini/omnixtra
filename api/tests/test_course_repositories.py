from uuid import UUID

from sqlalchemy.dialects import postgresql

from app.courses.repositories import (
    course_by_id,
    courses_page,
    lesson_by_id,
    media_asset_by_object_key,
    section_by_id,
)

COURSE_ID = UUID("00000000-0000-0000-0000-000000000010")
SECTION_ID = UUID("00000000-0000-0000-0000-000000000020")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000030")


def test_course_repository_queries_exclude_soft_deleted_rows() -> None:
    assert "courses.deleted_at IS NULL" in _compile(course_by_id(COURSE_ID))
    assert "course_sections.deleted_at IS NULL" in _compile(section_by_id(SECTION_ID))
    assert "lessons.deleted_at IS NULL" in _compile(lesson_by_id(LESSON_ID))
    assert "course_media_assets.deleted_at IS NULL" in _compile(
        media_asset_by_object_key("tenants/t/courses/c/file.png"),
    )


def test_course_page_repository_uses_cursor_and_limit() -> None:
    compiled = _compile(courses_page(after=COURSE_ID, limit=20))

    assert "courses.id >" in compiled
    assert "LIMIT" in compiled


def _compile(statement: object) -> str:
    return str(statement.compile(dialect=postgresql.dialect()))
