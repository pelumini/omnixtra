from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthPrincipal, require_permission
from app.core.database import get_session
from app.learning.schemas import (
    CertificateResponse,
    CourseCompletionResponse,
    CoursePlayerResponse,
    EnrolmentResponse,
    LessonProgressRequest,
    LessonProgressResponse,
    QuizAttemptRequest,
    QuizAttemptResponse,
)
from app.learning.services import (
    complete_course,
    enrol_in_course,
    get_certificate_pdf,
    get_course_player,
    issue_certificate,
    submit_quiz_attempt,
    update_lesson_progress,
)
from app.shared.responses import Envelope, Meta

router = APIRouter(prefix="/learning", tags=["tenant-owned"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
LearnerPrincipal = Annotated[AuthPrincipal, Depends(require_permission("learning:write"))]
ReadPrincipal = Annotated[AuthPrincipal, Depends(require_permission("courses:read"))]
IdempotencyKey = Annotated[str, Header(min_length=8, max_length=120, alias="Idempotency-Key")]


@router.post("/courses/{course_id}/enrolments")
async def enrol_in_course_route(
    course_id: UUID,
    session: SessionDep,
    principal: LearnerPrincipal,
    idempotency_key: IdempotencyKey,
) -> Envelope[EnrolmentResponse]:
    response = await enrol_in_course(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        idempotency_key=idempotency_key,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/courses/{course_id}/player")
async def get_course_player_route(
    course_id: UUID,
    session: SessionDep,
    principal: ReadPrincipal,
) -> Envelope[CoursePlayerResponse]:
    response = await get_course_player(session, learner_id=principal.user_id, course_id=course_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.put("/courses/{course_id}/lessons/{lesson_id}/progress")
async def update_lesson_progress_route(
    course_id: UUID,
    lesson_id: UUID,
    request: LessonProgressRequest,
    session: SessionDep,
    principal: LearnerPrincipal,
) -> Envelope[LessonProgressResponse]:
    response = await update_lesson_progress(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        lesson_id=lesson_id,
        request=request,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/courses/{course_id}/quizzes/{block_id}/attempts")
async def submit_quiz_attempt_route(
    course_id: UUID,
    block_id: UUID,
    request: QuizAttemptRequest,
    session: SessionDep,
    principal: LearnerPrincipal,
) -> Envelope[QuizAttemptResponse]:
    response = await submit_quiz_attempt(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        block_id=block_id,
        request=request,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/courses/{course_id}/completion")
async def complete_course_route(
    course_id: UUID,
    session: SessionDep,
    principal: LearnerPrincipal,
    idempotency_key: IdempotencyKey,
) -> Envelope[CourseCompletionResponse]:
    response = await complete_course(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        idempotency_key=idempotency_key,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/courses/{course_id}/certificate")
async def issue_certificate_route(
    course_id: UUID,
    session: SessionDep,
    principal: LearnerPrincipal,
    idempotency_key: IdempotencyKey,
) -> Envelope[CertificateResponse]:
    response = await issue_certificate(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
        idempotency_key=idempotency_key,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/courses/{course_id}/certificate/download")
async def download_certificate_route(
    course_id: UUID,
    session: SessionDep,
    principal: LearnerPrincipal,
) -> Response:
    certificate, pdf = await get_certificate_pdf(
        session,
        learner_id=principal.user_id,
        course_id=course_id,
    )
    headers = {
        "Content-Disposition": (f'attachment; filename="{certificate.certificate_number}.pdf"'),
        "X-Certificate-Number": certificate.certificate_number,
    }
    return Response(content=pdf, media_type="application/pdf", headers=headers)
