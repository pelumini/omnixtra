from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthPrincipal, require_permission
from app.core.database import get_session
from app.courses.schemas import (
    BlockCreateRequest,
    BlockResponse,
    CourseCreateRequest,
    CourseDetailResponse,
    CourseResponse,
    CourseStructureResponse,
    CourseUpdateRequest,
    CursorPage,
    LessonCreateRequest,
    LessonResponse,
    LessonUpdateRequest,
    MediaAssetCreateRequest,
    MediaAssetResponse,
    ReorderRequest,
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.courses.services import (
    create_block,
    create_course,
    create_lesson,
    create_media_asset,
    create_section,
    delete_course,
    delete_lesson,
    delete_section,
    get_course_detail,
    get_course_structure,
    list_courses,
    list_lessons,
    publish_course,
    reorder_lessons,
    reorder_sections,
    update_course,
    update_lesson,
    update_section,
)
from app.learning.permissions import require_course_permission
from app.shared.responses import Envelope, Meta

router = APIRouter(
    prefix="/courses",
    tags=["tenant-owned"],
)
SessionDep = Annotated[AsyncSession, Depends(get_session)]
CourseCreator = Annotated[AuthPrincipal, Depends(require_permission("courses:manage"))]
CourseMember = Annotated[AuthPrincipal, Depends(require_permission("courses:read"))]
AfterQuery = Annotated[UUID | None, Query()]
LimitQuery = Annotated[int, Query(ge=1, le=100)]


@router.post("")
async def create_course_route(
    request: CourseCreateRequest,
    session: SessionDep,
    principal: CourseCreator,
) -> Envelope[CourseResponse]:
    response = await create_course(session, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("")
async def list_courses_route(
    session: SessionDep,
    _principal: CourseMember,
    after: AfterQuery = None,
    limit: LimitQuery = 20,
) -> Envelope[CursorPage]:
    response = await list_courses(session, after=after, limit=limit)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/{course_id}")
async def get_course_route(
    course_id: UUID,
    session: SessionDep,
    _principal: CourseMember,
) -> Envelope[CourseDetailResponse]:
    response = await get_course_detail(session, course_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/{course_id}/structure")
async def get_course_structure_route(
    course_id: UUID, session: SessionDep, _principal: CourseMember
) -> Envelope[CourseStructureResponse]:
    response = await get_course_structure(session, course_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/{course_id}")
async def update_course_route(
    course_id: UUID,
    request: CourseUpdateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[CourseResponse]:
    await require_course_permission(
        session,
        user_id=principal.user_id,
        course_id=course_id,
        permission="course.edit",
    )
    response = await update_course(session, course_id, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.delete("/{course_id}")
async def delete_course_route(
    course_id: UUID,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[CourseResponse]:
    await require_course_permission(
        session,
        user_id=principal.user_id,
        course_id=course_id,
        permission="course.edit",
    )
    response = await delete_course(session, course_id, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/sections")
async def create_section_route(
    course_id: UUID,
    request: SectionCreateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[SectionResponse]:
    await require_course_permission(
        session,
        user_id=principal.user_id,
        course_id=course_id,
        permission="course.edit",
    )
    response = await create_section(session, course_id, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/lessons")
async def create_lesson_route(
    course_id: UUID,
    request: LessonCreateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[LessonResponse]:
    await require_course_permission(
        session,
        user_id=principal.user_id,
        course_id=course_id,
        permission="course.edit",
    )
    response = await create_lesson(session, course_id, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/{course_id}/sections/{section_id}")
async def update_section_route(
    course_id: UUID,
    section_id: UUID,
    request: SectionUpdateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[SectionResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await update_section(
        session, course_id, section_id, request, actor_id=principal.user_id
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.delete("/{course_id}/sections/{section_id}")
async def delete_section_route(
    course_id: UUID, section_id: UUID, session: SessionDep, principal: CourseMember
) -> Envelope[SectionResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await delete_section(session, course_id, section_id, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/{course_id}/lessons/{lesson_id}")
async def update_lesson_route(
    course_id: UUID,
    lesson_id: UUID,
    request: LessonUpdateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[LessonResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await update_lesson(
        session, course_id, lesson_id, request, actor_id=principal.user_id
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.delete("/{course_id}/lessons/{lesson_id}")
async def delete_lesson_route(
    course_id: UUID, lesson_id: UUID, session: SessionDep, principal: CourseMember
) -> Envelope[LessonResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await delete_lesson(session, course_id, lesson_id, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/{course_id}/lessons")
async def list_lessons_route(
    course_id: UUID,
    session: SessionDep,
    _principal: CourseMember,
) -> Envelope[list[LessonResponse]]:
    response = await list_lessons(session, course_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/blocks")
async def create_block_route(
    course_id: UUID,
    request: BlockCreateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[BlockResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await create_block(session, course_id, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/media")
async def create_media_asset_route(
    course_id: UUID,
    request: MediaAssetCreateRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[MediaAssetResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await create_media_asset(session, course_id, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.put("/{course_id}/sections/order")
async def reorder_sections_route(
    course_id: UUID,
    request: ReorderRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[list[SectionResponse]]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await reorder_sections(
        session, course_id, request.ordered_ids, actor_id=principal.user_id
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.put("/{course_id}/sections/{section_id}/lessons/order")
async def reorder_lessons_route(
    course_id: UUID,
    section_id: UUID,
    request: ReorderRequest,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[list[LessonResponse]]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.edit"
    )
    response = await reorder_lessons(
        session, course_id, section_id, request.ordered_ids, actor_id=principal.user_id
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/publish")
async def publish_course_route(
    course_id: UUID,
    session: SessionDep,
    principal: CourseMember,
) -> Envelope[CourseResponse]:
    await require_course_permission(
        session, user_id=principal.user_id, course_id=course_id, permission="course.publish"
    )
    response = await publish_course(session, course_id, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())
