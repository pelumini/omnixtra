from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.services import ensure_storage_capacity
from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.courses.models import (
    Course,
    CourseAuditEvent,
    CourseBlock,
    CourseMediaAsset,
    CourseSection,
    CourseStatus,
    Lesson,
)
from app.courses.repositories import (
    course_by_id,
    course_by_slug,
    courses_page,
    lesson_by_id,
    media_asset_by_object_key,
    section_by_id,
    sections_for_course,
)
from app.courses.schemas import (
    BlockCreateRequest,
    BlockResponse,
    CourseCreateRequest,
    CourseResponse,
    CourseUpdateRequest,
    CursorPage,
    LessonCreateRequest,
    LessonResponse,
    MediaAssetCreateRequest,
    MediaAssetResponse,
    SectionCreateRequest,
    SectionResponse,
)
from app.learning.models import CourseRole, Enrolment, EnrolmentStatus
from app.shared.models import utc_now
from app.tenancy.context import require_tenant_id

DEFAULT_PAGE_SIZE = 20


async def create_course(
    session: AsyncSession,
    request: CourseCreateRequest,
    actor_id: UUID | None = None,
) -> CourseResponse:
    existing = await session.scalar(course_by_slug(request.slug))
    if existing is not None:
        msg = "course slug is already taken"
        raise ConflictError(msg)
    course = Course(
        title=request.title,
        slug=request.slug,
        description=request.description,
        status=CourseStatus.draft.value,
    )
    session.add(course)
    await session.flush()
    if actor_id is not None:
        session.add(
            Enrolment(
                learner_id=actor_id,
                course_id=course.id,
                course_role=CourseRole.course_owner.value,
                status=EnrolmentStatus.active.value,
                idempotency_key=f"course-owner-{course.id}-{actor_id}",
            ),
        )
    _audit(session, course.id, actor_id, "course.created", f"Created course {course.slug}")
    await session.commit()
    return course_response(course)


async def update_course(
    session: AsyncSession,
    course_id: UUID,
    request: CourseUpdateRequest,
    actor_id: UUID | None = None,
) -> CourseResponse:
    course = await require_course(session, course_id)
    if request.title is not None:
        course.title = request.title
    if request.description is not None:
        course.description = request.description
    _audit(session, course.id, actor_id, "course.updated", f"Updated course {course.slug}")
    await session.commit()
    return course_response(course)


async def list_courses(
    session: AsyncSession,
    *,
    after: UUID | None = None,
    limit: int = DEFAULT_PAGE_SIZE,
) -> CursorPage:
    courses = list((await session.scalars(courses_page(after=after, limit=limit))).all())
    page_items = courses[:limit]
    next_cursor = str(courses[limit].id) if len(courses) > limit else None
    return CursorPage(
        items=[course_response(course) for course in page_items], next_cursor=next_cursor
    )


async def create_section(
    session: AsyncSession,
    course_id: UUID,
    request: SectionCreateRequest,
    actor_id: UUID | None = None,
) -> SectionResponse:
    course = await require_course(session, course_id)
    section = CourseSection(course_id=course.id, title=request.title, position=request.position)
    session.add(section)
    await session.flush()
    _audit(session, course.id, actor_id, "section.created", f"Created section {section.title}")
    await session.commit()
    return section_response(section)


async def create_lesson(
    session: AsyncSession,
    course_id: UUID,
    request: LessonCreateRequest,
    actor_id: UUID | None = None,
) -> LessonResponse:
    await require_course(session, course_id)
    await require_section(session, request.section_id, course_id=course_id)
    lesson = Lesson(
        course_id=course_id,
        section_id=request.section_id,
        title=request.title,
        position=request.position,
    )
    session.add(lesson)
    await session.flush()
    _audit(session, course_id, actor_id, "lesson.created", f"Created lesson {lesson.title}")
    await session.commit()
    return lesson_response(lesson)


async def create_block(
    session: AsyncSession,
    course_id: UUID,
    request: BlockCreateRequest,
    actor_id: UUID | None = None,
) -> BlockResponse:
    await require_course(session, course_id)
    await require_lesson(session, request.lesson_id, course_id=course_id)
    block = CourseBlock(
        course_id=course_id,
        lesson_id=request.lesson_id,
        block_type=request.block_type,
        content=request.content.model_dump(mode="json"),
        position=request.position,
    )
    session.add(block)
    await session.flush()
    _audit(session, course_id, actor_id, "block.created", f"Created {block.block_type} block")
    await session.commit()
    return block_response(block)


async def create_media_asset(
    session: AsyncSession,
    course_id: UUID,
    request: MediaAssetCreateRequest,
    actor_id: UUID | None = None,
) -> MediaAssetResponse:
    course = await require_course(session, course_id)
    tenant_id = require_tenant_id()
    expected_prefix = f"tenants/{tenant_id}/courses/{course_id}/"
    if not request.object_key.startswith(expected_prefix):
        msg = "media object key must be tenant and course scoped"
        raise ValidationAppError(msg)
    existing = await session.scalar(media_asset_by_object_key(request.object_key))
    if existing is not None:
        msg = "media object key is already registered"
        raise ConflictError(msg)
    current_storage_bytes = await session.scalar(
        select(func.coalesce(func.sum(CourseMediaAsset.byte_size), 0)).where(
            CourseMediaAsset.deleted_at.is_(None),
        ),
    )
    await ensure_storage_capacity(
        session,
        additional_bytes=request.byte_size,
        current_storage_bytes=int(current_storage_bytes or 0),
    )
    asset = CourseMediaAsset(
        course_id=course.id,
        object_key=request.object_key,
        file_name=request.file_name,
        content_type=request.content_type,
        byte_size=request.byte_size,
        checksum_sha256=request.checksum_sha256,
    )
    session.add(asset)
    await session.flush()
    _audit(session, course.id, actor_id, "media.registered", f"Registered media {asset.file_name}")
    await session.commit()
    return media_asset_response(asset)


async def reorder_sections(
    session: AsyncSession,
    course_id: UUID,
    ordered_ids: list[UUID],
    actor_id: UUID | None = None,
) -> list[SectionResponse]:
    await require_course(session, course_id)
    sections = list((await session.scalars(sections_for_course(course_id))).all())
    section_by_id = {section.id: section for section in sections}
    if set(section_by_id) != set(ordered_ids):
        msg = "ordered section ids must match existing course sections"
        raise ValidationAppError(msg)
    for position, section_id in enumerate(ordered_ids):
        section_by_id[section_id].position = -(position + 1)
    await session.flush()
    for position, section_id in enumerate(ordered_ids):
        section_by_id[section_id].position = position
    _audit(session, course_id, actor_id, "sections.reordered", "Reordered course sections")
    await session.commit()
    return [section_response(section_by_id[section_id]) for section_id in ordered_ids]


async def publish_course(
    session: AsyncSession,
    course_id: UUID,
    actor_id: UUID | None = None,
) -> CourseResponse:
    course = await require_course(session, course_id)
    lesson_count = await session.scalar(
        select(func.count())
        .select_from(Lesson)
        .where(Lesson.course_id == course_id, Lesson.deleted_at.is_(None)),
    )
    if lesson_count == 0:
        msg = "course must contain at least one lesson before publishing"
        raise ValidationAppError(msg)
    course.status = CourseStatus.published.value
    _audit(session, course.id, actor_id, "course.published", f"Published course {course.slug}")
    await session.commit()
    return course_response(course)


async def delete_course(
    session: AsyncSession,
    course_id: UUID,
    actor_id: UUID | None = None,
) -> CourseResponse:
    course = await require_course(session, course_id)
    course.deleted_at = utc_now()
    _audit(session, course.id, actor_id, "course.deleted", f"Deleted course {course.slug}")
    await session.commit()
    return course_response(course)


async def require_course(session: AsyncSession, course_id: UUID) -> Course:
    course = await session.scalar(course_by_id(course_id))
    if course is None:
        msg = "course not found"
        raise NotFoundError(msg)
    return course


async def require_section(
    session: AsyncSession,
    section_id: UUID,
    *,
    course_id: UUID | None = None,
) -> CourseSection:
    section = await session.scalar(section_by_id(section_id, course_id=course_id))
    if section is None:
        msg = "section not found"
        raise NotFoundError(msg)
    return section


async def require_lesson(
    session: AsyncSession,
    lesson_id: UUID,
    *,
    course_id: UUID | None = None,
) -> Lesson:
    lesson = await session.scalar(lesson_by_id(lesson_id, course_id=course_id))
    if lesson is None:
        msg = "lesson not found"
        raise NotFoundError(msg)
    return lesson


def course_response(course: Course) -> CourseResponse:
    return CourseResponse(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        status=course.status,
    )


def section_response(section: CourseSection) -> SectionResponse:
    return SectionResponse(
        id=section.id,
        course_id=section.course_id,
        title=section.title,
        position=section.position,
    )


def lesson_response(lesson: Lesson) -> LessonResponse:
    return LessonResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        section_id=lesson.section_id,
        title=lesson.title,
        position=lesson.position,
    )


def block_response(block: CourseBlock) -> BlockResponse:
    return BlockResponse(
        id=block.id,
        course_id=block.course_id,
        lesson_id=block.lesson_id,
        block_type=block.block_type,
        content=block.content,
        position=block.position,
    )


def media_asset_response(asset: CourseMediaAsset) -> MediaAssetResponse:
    return MediaAssetResponse(
        id=asset.id,
        course_id=asset.course_id,
        object_key=asset.object_key,
        file_name=asset.file_name,
        content_type=asset.content_type,
        byte_size=asset.byte_size,
        checksum_sha256=asset.checksum_sha256,
    )


def _audit(
    session: AsyncSession,
    course_id: UUID,
    actor_id: UUID | None,
    action: str,
    summary: str,
) -> None:
    session.add(
        CourseAuditEvent(
            course_id=course_id,
            actor_id=actor_id,
            action=action,
            summary=summary,
        ),
    )
