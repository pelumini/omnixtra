from uuid import UUID

from sqlalchemy import Select, select

from app.courses.models import Course, CourseBlock, CourseMediaAsset, CourseSection, Lesson


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
    return (
        select(CourseSection)
        .where(
            CourseSection.course_id == course_id,
            CourseSection.deleted_at.is_(None),
        )
        .order_by(CourseSection.position, CourseSection.id)
    )


def lessons_for_course(course_id: UUID) -> Select[tuple[Lesson]]:
    return (
        select(Lesson)
        .where(Lesson.course_id == course_id, Lesson.deleted_at.is_(None))
        .order_by(Lesson.position, Lesson.id)
    )


def lessons_for_section(course_id: UUID, section_id: UUID) -> Select[tuple[Lesson]]:
    return (
        select(Lesson)
        .where(
            Lesson.course_id == course_id,
            Lesson.section_id == section_id,
            Lesson.deleted_at.is_(None),
        )
        .order_by(Lesson.position, Lesson.id)
    )


def blocks_for_course(course_id: UUID) -> Select[tuple[CourseBlock]]:
    return (
        select(CourseBlock)
        .where(CourseBlock.course_id == course_id, CourseBlock.deleted_at.is_(None))
        .order_by(CourseBlock.position, CourseBlock.id)
    )


def block_by_id(
    block_id: UUID,
    *,
    course_id: UUID | None = None,
    lesson_id: UUID | None = None,
) -> Select[tuple[CourseBlock]]:
    statement = select(CourseBlock).where(
        CourseBlock.id == block_id,
        CourseBlock.deleted_at.is_(None),
    )
    if course_id is not None:
        statement = statement.where(CourseBlock.course_id == course_id)
    if lesson_id is not None:
        statement = statement.where(CourseBlock.lesson_id == lesson_id)
    return statement


def blocks_for_lesson(course_id: UUID, lesson_id: UUID) -> Select[tuple[CourseBlock]]:
    return (
        select(CourseBlock)
        .where(
            CourseBlock.course_id == course_id,
            CourseBlock.lesson_id == lesson_id,
            CourseBlock.deleted_at.is_(None),
        )
        .order_by(CourseBlock.position, CourseBlock.id)
    )


def text_blocks_for_course(course_id: UUID) -> Select[tuple[CourseBlock]]:
    return (
        select(CourseBlock)
        .where(
            CourseBlock.course_id == course_id,
            CourseBlock.block_type == "text",
            CourseBlock.deleted_at.is_(None),
        )
        .order_by(CourseBlock.position, CourseBlock.id)
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


def media_asset_by_object_key(object_key: str) -> Select[tuple[CourseMediaAsset]]:
    return select(CourseMediaAsset).where(
        CourseMediaAsset.object_key == object_key,
        CourseMediaAsset.deleted_at.is_(None),
    )


__all__ = [
    "block_by_id",
    "blocks_for_course",
    "blocks_for_lesson",
    "course_by_id",
    "course_by_slug",
    "courses_page",
    "lesson_by_id",
    "lessons_for_course",
    "lessons_for_section",
    "media_asset_by_object_key",
    "section_by_id",
    "sections_for_course",
    "text_blocks_for_course",
]
