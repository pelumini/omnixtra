from uuid import UUID

from sqlalchemy import Select, select

from app.courses.models import Course, CourseSection, Lesson


def course_by_id(course_id: UUID) -> Select[tuple[Course]]:
    return select(Course).where(Course.id == course_id, Course.deleted_at.is_(None))


def course_by_slug(slug: str) -> Select[tuple[Course]]:
    return select(Course).where(Course.slug == slug, Course.deleted_at.is_(None))


def courses_page(*, after: UUID | None, limit: int) -> Select[tuple[Course]]:
    statement = (
        select(Course).where(Course.deleted_at.is_(None)).order_by(Course.id).limit(limit + 1)
    )
    if after is not None:
        statement = statement.where(Course.id > after)
    return statement


def section_by_id(
    section_id: UUID,
    *,
    course_id: UUID | None = None,
) -> Select[tuple[CourseSection]]:
    statement = select(CourseSection).where(
        CourseSection.id == section_id,
        CourseSection.deleted_at.is_(None),
    )
    if course_id is not None:
        statement = statement.where(CourseSection.course_id == course_id)
    return statement


def sections_for_course(course_id: UUID) -> Select[tuple[CourseSection]]:
    return select(CourseSection).where(
        CourseSection.course_id == course_id,
        CourseSection.deleted_at.is_(None),
    )


def lesson_by_id(
    lesson_id: UUID,
    *,
    course_id: UUID | None = None,
) -> Select[tuple[Lesson]]:
    statement = select(Lesson).where(Lesson.id == lesson_id, Lesson.deleted_at.is_(None))
    if course_id is not None:
        statement = statement.where(Lesson.course_id == course_id)
    return statement


__all__ = [
    "course_by_id",
    "course_by_slug",
    "courses_page",
    "lesson_by_id",
    "section_by_id",
    "sections_for_course",
]
