from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.schemas import ConversationResponse, TutorJobResponse, TutorQuestionRequest
from app.ai.services import enqueue_tutor_job, get_conversation
from app.auth.dependencies import AuthPrincipal, require_permission
from app.core.database import get_session
from app.shared.responses import Envelope, Meta

router = APIRouter(prefix="/ai", tags=["tenant-owned"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
TutorPrincipal = Annotated[AuthPrincipal, Depends(require_permission("tutor:use"))]
IdempotencyKey = Annotated[str, Header(min_length=8, max_length=120, alias="Idempotency-Key")]


@router.post("/courses/{course_id}/tutor/jobs")
async def create_tutor_job_route(
    course_id: UUID,
    request: TutorQuestionRequest,
    session: SessionDep,
    principal: TutorPrincipal,
    idempotency_key: IdempotencyKey,
) -> Envelope[TutorJobResponse]:
    response = await enqueue_tutor_job(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        request=request,
        idempotency_key=idempotency_key,
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


@router.get("/courses/{course_id}/tutor/events")
async def tutor_events_route(
    course_id: UUID,
    _principal: TutorPrincipal,
) -> StreamingResponse:
    async def stream() -> AsyncIterator[bytes]:
        yield f'event: ready\ndata: {{"course_id":"{course_id}"}}\n\n'.encode()

    return StreamingResponse(stream(), media_type="text/event-stream")
