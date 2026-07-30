from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.courses.schemas import (
    BlockCreateRequest,
    BlockResponse,
    CourseCreateRequest,
    CourseResponse,
    CourseUpdateRequest,
    CursorPage,
    LessonCreateRequest,
    LessonResponse,
    ReorderRequest,
    SectionCreateRequest,
    SectionResponse,
)
from app.courses.services import (
    create_block,
    create_course,
    create_lesson,
    create_section,
    delete_course,
    list_courses,
    publish_course,
    reorder_sections,
    update_course,
)
from app.shared.responses import Envelope, Meta

router = APIRouter(prefix="/courses", tags=["tenant-owned"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
AfterQuery = Annotated[UUID | None, Query()]
LimitQuery = Annotated[int, Query(ge=1, le=100)]


@router.post("")
async def create_course_route(
    request: CourseCreateRequest,
    session: SessionDep,
) -> Envelope[CourseResponse]:
    response = await create_course(session, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("")
async def list_courses_route(
    session: SessionDep,
    after: AfterQuery = None,
    limit: LimitQuery = 20,
) -> Envelope[CursorPage]:
    response = await list_courses(session, after=after, limit=limit)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/{course_id}")
async def update_course_route(
    course_id: UUID,
    request: CourseUpdateRequest,
    session: SessionDep,
) -> Envelope[CourseResponse]:
    response = await update_course(session, course_id, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.delete("/{course_id}")
async def delete_course_route(
    course_id: UUID,
    session: SessionDep,
) -> Envelope[CourseResponse]:
    response = await delete_course(session, course_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/sections")
async def create_section_route(
    course_id: UUID,
    request: SectionCreateRequest,
    session: SessionDep,
) -> Envelope[SectionResponse]:
    response = await create_section(session, course_id, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/lessons")
async def create_lesson_route(
    course_id: UUID,
    request: LessonCreateRequest,
    session: SessionDep,
) -> Envelope[LessonResponse]:
    response = await create_lesson(session, course_id, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/blocks")
async def create_block_route(
    course_id: UUID,
    request: BlockCreateRequest,
    session: SessionDep,
) -> Envelope[BlockResponse]:
    response = await create_block(session, course_id, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.put("/{course_id}/sections/order")
async def reorder_sections_route(
    course_id: UUID,
    request: ReorderRequest,
    session: SessionDep,
) -> Envelope[list[SectionResponse]]:
    response = await reorder_sections(session, course_id, request.ordered_ids)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/{course_id}/publish")
async def publish_course_route(
    course_id: UUID,
    session: SessionDep,
) -> Envelope[CourseResponse]:
    response = await publish_course(session, course_id)
    return Envelope(data=response, error=None, meta=Meta.current())
