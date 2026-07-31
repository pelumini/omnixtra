from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.dispatch import dispatch_tutor_job
from app.ai.limits import enforce_tutor_limits
from app.ai.models import (
    ConversationRole,
    TutorConversation,
    TutorJob,
    TutorJobStatus,
    TutorMessage,
)
from app.ai.repositories import conversation_by_id, tutor_job_by_idempotency_key
from app.ai.schemas import ConversationResponse, TutorJobResponse, TutorQuestionRequest
from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.courses.services import require_course
from app.tenancy.context import require_tenant_id


async def enqueue_tutor_job(  # noqa: PLR0913
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    request: TutorQuestionRequest,
    idempotency_key: str,
    redis_client: Redis,
) -> TutorJobResponse:
    await require_course(session, course_id)
    existing = await session.scalar(tutor_job_by_idempotency_key(idempotency_key))
    if existing is not None:
        return tutor_job_response(existing)
    tenant_id = UUID(require_tenant_id())
    limit_decision = await enforce_tutor_limits(
        redis_client,
        tenant_id=tenant_id,
        learner_id=learner_id,
        settings=get_settings(),
    )
    conversation = await _conversation_for_request(
        session,
        learner_id=learner_id,
        course_id=course_id,
        conversation_id=request.conversation_id,
    )
    session.add(
        TutorMessage(
            conversation_id=conversation.id,
            learner_id=learner_id,
            course_id=course_id,
            role=ConversationRole.user.value,
            content=request.question,
            citations=[],
        ),
    )
    job = TutorJob(
        conversation_id=conversation.id,
        learner_id=learner_id,
        course_id=course_id,
        question=request.question,
        status=TutorJobStatus.queued.value,
        idempotency_key=idempotency_key,
        trace_metadata={
            "langsmith_project": "omnixtra-tutor",
            "graph": "mvp_tutor",
            "tenant_scoped": True,
            "estimated_tokens_reserved": limit_decision.estimated_tokens,
            "monthly_tokens_used": limit_decision.monthly_tokens_used,
            "monthly_budget": limit_decision.monthly_budget,
            "budget_warning": limit_decision.warning,
        },
    )
    session.add(job)
    await session.flush()
    await session.commit()
    dispatch_tutor_job(
        tenant_id=tenant_id,
        job_id=job.id,
        course_id=course_id,
        learner_id=learner_id,
    )
    return tutor_job_response(job)


async def get_conversation(
    session: AsyncSession,
    *,
    learner_id: UUID,
    conversation_id: UUID,
) -> ConversationResponse:
    conversation = await session.scalar(conversation_by_id(conversation_id))
    if conversation is None or conversation.learner_id != learner_id:
        msg = "conversation not found"
        raise NotFoundError(msg)
    return conversation_response(conversation)


def tutor_job_response(job: TutorJob) -> TutorJobResponse:
    return TutorJobResponse(
        id=job.id,
        conversation_id=job.conversation_id,
        course_id=job.course_id,
        status=job.status,
    )


def conversation_response(conversation: TutorConversation) -> ConversationResponse:
    return ConversationResponse(
        id=conversation.id,
        learner_id=conversation.learner_id,
        course_id=conversation.course_id,
    )


async def _conversation_for_request(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    conversation_id: UUID | None,
) -> TutorConversation:
    if conversation_id is not None:
        conversation = await session.scalar(conversation_by_id(conversation_id))
        if conversation is None or conversation.learner_id != learner_id:
            msg = "conversation not found"
            raise NotFoundError(msg)
        return conversation
    conversation = TutorConversation(learner_id=learner_id, course_id=course_id)
    session.add(conversation)
    await session.flush()
    return conversation
