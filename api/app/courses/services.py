from uuid import UUID

from pydantic import HttpUrl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.services import ensure_storage_capacity
from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.courses.models import (
    Course,
    CourseAuditEvent,
    CourseBlock,
    CourseDeliveryFormat,
    CourseDifficulty,
    CourseMediaAsset,
    CourseSection,
    CourseStatus,
    Lesson,
)
from app.courses.repositories import (
    block_by_id,
    blocks_for_course,
    blocks_for_lesson,
    course_by_id,
    course_by_slug,
    courses_page,
    lesson_by_id,
    lessons_for_course,
    lessons_for_section,
    media_asset_by_object_key,
    section_by_id,
    sections_for_course,
    text_blocks_for_course,
)
from app.courses.schemas import (
    BlockCreateRequest,
    BlockResponse,
    BlockUpdateRequest,
    CourseCreateRequest,
    CourseDetailResponse,
    CourseResponse,
    CourseStructureResponse,
    CourseUpdateRequest,
    CursorPage,
    LessonCreateRequest,
    LessonNode,
    LessonResponse,
    LessonUpdateRequest,
    MediaAssetCreateRequest,
    MediaAssetResponse,
    SectionCreateRequest,
    SectionNode,
    SectionResponse,
    SectionUpdateRequest,
)
from app.learning.models import CourseRole, Enrolment, EnrolmentStatus
from app.shared.models import utc_now
from app.tenancy.context import require_tenant_id

DEFAULT_PAGE_SIZE = 20
DEFAULT_SECTION_TITLE = "Start here"
DELETED_POSITION_START = -1_000_000_000


async def create_course(
    session: AsyncSession,
    request: CourseCreateRequest,
    actor_id: UUID | None = None,
) -> CourseResponse:
    slug = request.slug or _slugify(request.title)
    existing = await session.scalar(course_by_slug(slug))
    if existing is not None:
        msg = "course slug is already taken"
        raise ConflictError(msg)
    course = Course(
        title=request.title,
        slug=slug,
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


async def get_course_detail(session: AsyncSession, course_id: UUID) -> CourseDetailResponse:
    course = await require_course(session, course_id)
    lessons = await list_lessons(session, course_id)
    return CourseDetailResponse(
        **course_response(course, lesson_count=len(lessons)).model_dump(),
        lessons=lessons,
    )


async def get_course_structure(session: AsyncSession, course_id: UUID) -> CourseStructureResponse:
    course = await require_course(session, course_id)
    sections = list((await session.scalars(sections_for_course(course_id))).all())
    lessons = list((await session.scalars(lessons_for_course(course_id))).all())
    blocks = list((await session.scalars(blocks_for_course(course_id))).all())
    blocks_by_lesson: dict[UUID, list[BlockResponse]] = {}
    for block in blocks:
        blocks_by_lesson.setdefault(block.lesson_id, []).append(block_response(block))
    lessons_by_section: dict[UUID, list[LessonNode]] = {}
    for lesson in lessons:
        lessons_by_section.setdefault(lesson.section_id, []).append(
            LessonNode(
                **lesson_response(lesson).model_dump(),
                blocks=blocks_by_lesson.get(lesson.id, []),
            )
        )
    return CourseStructureResponse(
        **course_response(course, lesson_count=len(lessons)).model_dump(),
        sections=[
            SectionNode(
                **section_response(section).model_dump(),
                lessons=lessons_by_section.get(section.id, []),
            )
            for section in sections
        ],
    )


async def update_course(
    session: AsyncSession,
    course_id: UUID,
    request: CourseUpdateRequest,
    actor_id: UUID | None = None,
) -> CourseResponse:
    course = await require_course(session, course_id)
    fields = request.model_fields_set
    for field in (
        "title",
        "description",
        "thumbnail_url",
        "category",
        "tags",
        "language",
        "learning_outcomes",
        "target_audience",
        "difficulty",
        "delivery_format",
        "estimated_duration_minutes",
    ):
        if field in fields:
            value = getattr(request, field)
            if field == "title" and value is None:
                continue
            if isinstance(value, HttpUrl):
                value = str(value)
            setattr(course, field, value)
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
    lesson_counts = await count_lessons_for_courses(session, [course.id for course in page_items])
    return CursorPage(
        items=[
            course_response(course, lesson_count=lesson_counts.get(course.id, 0))
            for course in page_items
        ],
        next_cursor=next_cursor,
    )


async def list_lessons(session: AsyncSession, course_id: UUID) -> list[LessonResponse]:
    await require_course(session, course_id)
    lessons = list((await session.scalars(lessons_for_course(course_id))).all())
    text_blocks = list((await session.scalars(text_blocks_for_course(course_id))).all())
    body_by_lesson_id: dict[UUID, str] = {}
    for block in text_blocks:
        if block.lesson_id in body_by_lesson_id:
            continue
        markdown = block.content.get("markdown")
        if isinstance(markdown, str):
            body_by_lesson_id[block.lesson_id] = markdown
    return [lesson_response(lesson, body=body_by_lesson_id.get(lesson.id)) for lesson in lessons]


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
    section_id = request.section_id
    if section_id is None:
        section_id = await ensure_default_section(session, course_id)
    await require_section(session, section_id, course_id=course_id)
    position = request.position
    if position is None:
        position = await next_lesson_position(session, course_id)
    lesson = Lesson(
        course_id=course_id,
        section_id=section_id,
        title=request.title,
        position=position,
    )
    session.add(lesson)
    await session.flush()
    if request.body is not None:
        session.add(
            CourseBlock(
                course_id=course_id,
                lesson_id=lesson.id,
                block_type="text",
                content={"type": "text", "markdown": request.body},
                position=0,
            ),
        )
    _audit(session, course_id, actor_id, "lesson.created", f"Created lesson {lesson.title}")
    await session.commit()
    return lesson_response(lesson, body=request.body)


async def update_section(
    session: AsyncSession,
    course_id: UUID,
    section_id: UUID,
    request: SectionUpdateRequest,
    actor_id: UUID | None = None,
) -> SectionResponse:
    await require_course(session, course_id)
    section = await require_section(session, section_id, course_id=course_id)
    section.title = request.title
    _audit(session, course_id, actor_id, "section.updated", f"Renamed section to {section.title}")
    await session.commit()
    return section_response(section)


async def delete_section(
    session: AsyncSession,
    course_id: UUID,
    section_id: UUID,
    actor_id: UUID | None = None,
) -> SectionResponse:
    await require_course(session, course_id)
    section = await require_section(session, section_id, course_id=course_id)
    response = section_response(section)
    siblings = list(
        (
            await session.scalars(
                select(CourseSection).where(CourseSection.course_id == course_id).with_for_update()
            )
        ).all()
    )
    lowest_position = min(
        (sibling.position for sibling in siblings),
        default=DELETED_POSITION_START + 1,
    )
    section.position = min(lowest_position, DELETED_POSITION_START + 1) - 1
    section.deleted_at = utc_now()
    lessons = list(
        (
            await session.scalars(
                select(Lesson).where(
                    Lesson.course_id == course_id,
                    Lesson.section_id == section_id,
                    Lesson.deleted_at.is_(None),
                )
            )
        ).all()
    )
    deleted_at = utc_now()
    for lesson in lessons:
        lesson.deleted_at = deleted_at
    lesson_ids = [lesson.id for lesson in lessons]
    if lesson_ids:
        blocks = list(
            (
                await session.scalars(
                    select(CourseBlock).where(
                        CourseBlock.lesson_id.in_(lesson_ids),
                        CourseBlock.deleted_at.is_(None),
                    )
                )
            ).all()
        )
        for block in blocks:
            block.deleted_at = deleted_at
    _audit(session, course_id, actor_id, "section.deleted", f"Deleted section {section.title}")
    await session.commit()
    return response


async def update_lesson(
    session: AsyncSession,
    course_id: UUID,
    lesson_id: UUID,
    request: LessonUpdateRequest,
    actor_id: UUID | None = None,
) -> LessonResponse:
    await require_course(session, course_id)
    lesson = await require_lesson(session, lesson_id, course_id=course_id)
    lesson.title = request.title
    _audit(session, course_id, actor_id, "lesson.updated", f"Renamed lesson to {lesson.title}")
    await session.commit()
    return lesson_response(lesson)


async def delete_lesson(
    session: AsyncSession,
    course_id: UUID,
    lesson_id: UUID,
    actor_id: UUID | None = None,
) -> LessonResponse:
    await require_course(session, course_id)
    lesson = await require_lesson(session, lesson_id, course_id=course_id)
    response = lesson_response(lesson)
    siblings = list(
        (
            await session.scalars(
                select(Lesson).where(Lesson.section_id == lesson.section_id).with_for_update()
            )
        ).all()
    )
    lowest_position = min(
        (sibling.position for sibling in siblings),
        default=DELETED_POSITION_START + 1,
    )
    lesson.position = min(lowest_position, DELETED_POSITION_START + 1) - 1
    lesson.deleted_at = utc_now()
    blocks = list(
        (
            await session.scalars(
                select(CourseBlock).where(
                    CourseBlock.lesson_id == lesson_id,
                    CourseBlock.deleted_at.is_(None),
                )
            )
        ).all()
    )
    for block in blocks:
        block.deleted_at = lesson.deleted_at
    _audit(session, course_id, actor_id, "lesson.deleted", f"Deleted lesson {lesson.title}")
    await session.commit()
    return response


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


async def update_block(  # noqa: PLR0913, PLR0917
    session: AsyncSession,
    course_id: UUID,
    lesson_id: UUID,
    block_id: UUID,
    request: BlockUpdateRequest,
    actor_id: UUID | None = None,
) -> BlockResponse:
    await require_course(session, course_id)
    await require_lesson(session, lesson_id, course_id=course_id)
    block = await require_block(session, block_id, course_id=course_id, lesson_id=lesson_id)
    if block.block_type != request.content.type:
        msg = "block content type must match the immutable block type"
        raise ValidationAppError(msg)
    block.content = request.content.model_dump(mode="json")
    _audit(session, course_id, actor_id, "block.updated", f"Updated {block.block_type} block")
    await session.commit()
    return block_response(block)


async def delete_block(
    session: AsyncSession,
    course_id: UUID,
    lesson_id: UUID,
    block_id: UUID,
    actor_id: UUID | None = None,
) -> BlockResponse:
    await require_course(session, course_id)
    await require_lesson(session, lesson_id, course_id=course_id)
    block = await require_block(session, block_id, course_id=course_id, lesson_id=lesson_id)
    response = block_response(block)
    siblings = list(
        (
            await session.scalars(
                select(CourseBlock).where(CourseBlock.lesson_id == lesson_id).with_for_update()
            )
        ).all()
    )
    lowest_position = min(
        (sibling.position for sibling in siblings),
        default=DELETED_POSITION_START + 1,
    )
    block.position = min(lowest_position, DELETED_POSITION_START + 1) - 1
    block.deleted_at = utc_now()
    _audit(session, course_id, actor_id, "block.deleted", f"Deleted {block.block_type} block")
    await session.commit()
    return response


async def reorder_blocks(
    session: AsyncSession,
    course_id: UUID,
    lesson_id: UUID,
    ordered_ids: list[UUID],
    actor_id: UUID | None = None,
) -> list[BlockResponse]:
    await require_course(session, course_id)
    await require_lesson(session, lesson_id, course_id=course_id)
    blocks = list((await session.scalars(blocks_for_lesson(course_id, lesson_id))).all())
    block_by_identifier = {block.id: block for block in blocks}
    if set(block_by_identifier) != set(ordered_ids) or len(ordered_ids) != len(block_by_identifier):
        msg = "ordered block ids must match existing lesson blocks"
        raise ValidationAppError(msg)
    for position, current_id in enumerate(ordered_ids):
        block_by_identifier[current_id].position = -(position + 1)
    await session.flush()
    for position, current_id in enumerate(ordered_ids):
        block_by_identifier[current_id].position = position
    _audit(session, course_id, actor_id, "blocks.reordered", "Reordered lesson blocks")
    await session.commit()
    return [block_response(block_by_identifier[current_id]) for current_id in ordered_ids]


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


async def reorder_lessons(
    session: AsyncSession,
    course_id: UUID,
    section_id: UUID,
    ordered_ids: list[UUID],
    actor_id: UUID | None = None,
) -> list[LessonResponse]:
    await require_course(session, course_id)
    await require_section(session, section_id, course_id=course_id)
    lessons = list((await session.scalars(lessons_for_section(course_id, section_id))).all())
    lesson_by_id = {lesson.id: lesson for lesson in lessons}
    if set(lesson_by_id) != set(ordered_ids) or len(ordered_ids) != len(lesson_by_id):
        msg = "ordered lesson ids must match existing section lessons"
        raise ValidationAppError(msg)
    for position, lesson_id in enumerate(ordered_ids):
        lesson_by_id[lesson_id].position = -(position + 1)
    await session.flush()
    for position, lesson_id in enumerate(ordered_ids):
        lesson_by_id[lesson_id].position = position
    _audit(session, course_id, actor_id, "lessons.reordered", "Reordered section lessons")
    await session.commit()
    return [lesson_response(lesson_by_id[lesson_id]) for lesson_id in ordered_ids]


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


async def require_block(
    session: AsyncSession,
    block_id: UUID,
    *,
    course_id: UUID,
    lesson_id: UUID,
) -> CourseBlock:
    block = await session.scalar(block_by_id(block_id, course_id=course_id, lesson_id=lesson_id))
    if block is None:
        msg = "block not found"
        raise NotFoundError(msg)
    return block


def course_response(course: Course, *, lesson_count: int = 0) -> CourseResponse:
    return CourseResponse(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        thumbnail_url=HttpUrl(course.thumbnail_url) if course.thumbnail_url else None,
        category=course.category,
        tags=course.tags or [],
        language=course.language,
        learning_outcomes=course.learning_outcomes or [],
        target_audience=course.target_audience,
        difficulty=CourseDifficulty(course.difficulty) if course.difficulty else None,
        delivery_format=(
            CourseDeliveryFormat(course.delivery_format) if course.delivery_format else None
        ),
        estimated_duration_minutes=course.estimated_duration_minutes,
        status=course.status,
        lesson_count=lesson_count,
    )


def section_response(section: CourseSection) -> SectionResponse:
    return SectionResponse(
        id=section.id,
        course_id=section.course_id,
        title=section.title,
        position=section.position,
    )


def lesson_response(lesson: Lesson, *, body: str | None = None) -> LessonResponse:
    return LessonResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        section_id=lesson.section_id,
        title=lesson.title,
        position=lesson.position,
        body=body,
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


async def ensure_default_section(session: AsyncSession, course_id: UUID) -> UUID:
    section = await session.scalar(sections_for_course(course_id))
    if section is not None:
        return section.id
    section = CourseSection(course_id=course_id, title=DEFAULT_SECTION_TITLE, position=0)
    session.add(section)
    await session.flush()
    return section.id


async def next_lesson_position(session: AsyncSession, course_id: UUID) -> int:
    current_max = await session.scalar(
        select(func.max(Lesson.position)).where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    return 0 if current_max is None else int(current_max) + 1


def _slugify(value: str) -> str:
    slug = []
    previous_dash = False
    for character in value.lower():
        if ("a" <= character <= "z") or ("0" <= character <= "9"):
            slug.append(character)
            previous_dash = False
            continue
        if not previous_dash:
            slug.append("-")
            previous_dash = True
    normalized = "".join(slug).strip("-")
    return normalized[:120].strip("-") or "course"


async def count_lessons_for_courses(
    session: AsyncSession,
    course_ids: list[UUID],
) -> dict[UUID, int]:
    if not course_ids:
        return {}
    rows = await session.execute(
        select(Lesson.course_id, func.count(Lesson.id))
        .where(Lesson.course_id.in_(course_ids), Lesson.deleted_at.is_(None))
        .group_by(Lesson.course_id),
    )
    return {course_id: int(count) for course_id, count in rows.all()}
