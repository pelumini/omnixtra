from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.repositories import tutor_job_by_id
from app.ai.schemas import ConversationResponse, TutorJobResponse, TutorQuestionRequest
from app.ai.services import enqueue_tutor_job, get_conversation
from app.ai.streaming import subscribe_tutor_events
from app.auth.dependencies import AuthPrincipal, require_permission
from app.core.database import get_session
from app.core.exceptions import NotFoundError
from app.core.redis import get_redis
from app.shared.responses import Envelope, Meta
from app.tenancy.context import require_tenant_id

router = APIRouter(prefix="/ai", tags=["tenant-owned"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated[Redis, Depends(get_redis)]
TutorPrincipal = Annotated[AuthPrincipal, Depends(require_permission("tutor:use"))]
IdempotencyKey = Annotated[str, Header(min_length=8, max_length=120, alias="Idempotency-Key")]


@router.post("/courses/{course_id}/tutor/jobs")
async def create_tutor_job_route(  # noqa: PLR0913, PLR0917
    course_id: UUID,
    request: TutorQuestionRequest,
    session: SessionDep,
    redis_client: RedisDep,
    principal: TutorPrincipal,
    idempotency_key: IdempotencyKey,
) -> Envelope[TutorJobResponse]:
    response = await enqueue_tutor_job(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        request=request,
        idempotency_key=idempotency_key,
        redis_client=redis_client,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/conversations/{conversation_id}")
async def get_conversation_route(
    conversation_id: UUID,
    session: SessionDep,
    principal: TutorPrincipal,
) -> Envelope[ConversationResponse]:
    response = await get_conversation(
        session,
        learner_id=principal.user_id,
        conversation_id=conversation_id,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/courses/{course_id}/tutor/jobs/{job_id}/events")
async def tutor_job_events_route(
    course_id: UUID,
    job_id: UUID,
    session: SessionDep,
    redis_client: RedisDep,
    _principal: TutorPrincipal,
) -> StreamingResponse:
    job = await session.scalar(tutor_job_by_id(job_id))
    if job is None or job.course_id != course_id:
        msg = "tutor job not found"
        raise NotFoundError(msg)
    tenant_id = UUID(require_tenant_id())
    return StreamingResponse(
        subscribe_tutor_events(
            redis_client,
            tenant_id=tenant_id,
            course_id=course_id,
            job_id=job_id,
        ),
        media_type="text/event-stream",
    )
