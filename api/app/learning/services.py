from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationAppError
from app.courses.models import Course, CourseBlock, Lesson
from app.learning.models import (
    Certificate,
    CertificateStatus,
    CompletionStatus,
    CourseCompletion,
    Enrolment,
    EnrolmentStatus,
    LearningAuditEvent,
    LessonProgress,
    QuizAttempt,
)
from app.learning.repositories import (
    certificate_by_idempotency_key,
    certificate_by_learner_course,
    completion_by_idempotency_key,
    completion_by_learner_course,
    enrolment_by_idempotency_key,
    enrolment_by_learner_course,
    lessons_for_player,
    progress_by_learner_lesson,
    published_course_by_id,
    quiz_block_by_id,
    sections_for_player,
)
from app.learning.schemas import (
    CertificateResponse,
    CourseCompletionResponse,
    CoursePlayerResponse,
    EnrolmentResponse,
    LessonProgressRequest,
    LessonProgressResponse,
    PlayerLesson,
    PlayerSection,
    QuizAttemptRequest,
    QuizAttemptResponse,
)
from app.tenancy.context import require_tenant_id

COMPLETE_PERCENT = 100


async def enrol_in_course(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    idempotency_key: str,
) -> EnrolmentResponse:
    existing_by_key = await session.scalar(enrolment_by_idempotency_key(idempotency_key))
    if existing_by_key is not None:
        return enrolment_response(existing_by_key)
    await require_published_course(session, course_id)
    existing = await session.scalar(enrolment_by_learner_course(learner_id, course_id))
    if existing is not None:
        return enrolment_response(existing)
    enrolment = Enrolment(
        learner_id=learner_id,
        course_id=course_id,
        status=EnrolmentStatus.active.value,
        idempotency_key=idempotency_key,
    )
    session.add(enrolment)
    await session.flush()
    _audit(session, learner_id, course_id, "enrolment.created", "Learner enrolled")
    await session.commit()
    return enrolment_response(enrolment)


async def get_course_player(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
) -> CoursePlayerResponse:
    course = await require_enrolled_course(session, learner_id, course_id)
    sections = list((await session.scalars(sections_for_player(course_id))).all())
    lessons = list((await session.scalars(lessons_for_player(course_id))).all())
    progress_rows = list(
        (
            await session.scalars(
                select(LessonProgress).where(
                    LessonProgress.learner_id == learner_id,
                    LessonProgress.course_id == course_id,
                    LessonProgress.deleted_at.is_(None),
                ),
            )
        ).all(),
    )
    progress_by_lesson = {progress.lesson_id: progress for progress in progress_rows}
    lessons_by_section: dict[UUID, list[PlayerLesson]] = {section.id: [] for section in sections}
    for lesson in lessons:
        progress = progress_by_lesson.get(lesson.id)
        lessons_by_section.setdefault(lesson.section_id, []).append(
            PlayerLesson(
                id=lesson.id,
                title=lesson.title,
                position=lesson.position,
                percent_complete=progress.percent_complete if progress is not None else 0,
            ),
        )
    return CoursePlayerResponse(
        course_id=course.id,
        title=course.title,
        status=course.status,
        sections=[
            PlayerSection(
                id=section.id,
                title=section.title,
                position=section.position,
                lessons=lessons_by_section.get(section.id, []),
            )
            for section in sections
        ],
    )


async def update_lesson_progress(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    lesson_id: UUID,
    request: LessonProgressRequest,
) -> LessonProgressResponse:
    await require_enrolled_course(session, learner_id, course_id)
    lesson = await require_course_lesson(session, course_id, lesson_id)
    progress = await session.scalar(progress_by_learner_lesson(learner_id, lesson_id))
    completed_at = datetime.now(UTC) if request.percent_complete == COMPLETE_PERCENT else None
    if progress is None:
        progress = LessonProgress(
            learner_id=learner_id,
            course_id=course_id,
            lesson_id=lesson.id,
            last_position=request.last_position,
            percent_complete=request.percent_complete,
            completed_at=completed_at,
        )
        session.add(progress)
    else:
        progress.last_position = request.last_position
        progress.percent_complete = request.percent_complete
        progress.completed_at = completed_at or progress.completed_at
    _audit(session, learner_id, course_id, "lesson.progressed", "Lesson progress updated")
    await session.commit()
    return lesson_progress_response(progress)


async def submit_quiz_attempt(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    block_id: UUID,
    request: QuizAttemptRequest,
) -> QuizAttemptResponse:
    await require_enrolled_course(session, learner_id, course_id)
    block = await require_quiz_block(session, course_id, block_id)
    correct_option_id = str(block.content.get("correct_option_id"))
    passed = request.selected_option_id == correct_option_id
    attempt = QuizAttempt(
        learner_id=learner_id,
        course_id=course_id,
        lesson_id=block.lesson_id,
        block_id=block.id,
        selected_option_id=request.selected_option_id,
        score_percent=100 if passed else 0,
        passed=passed,
    )
    session.add(attempt)
    await session.flush()
    _audit(session, learner_id, course_id, "quiz.submitted", "Quiz attempt submitted")
    await session.commit()
    return quiz_attempt_response(attempt)


async def complete_course(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    idempotency_key: str,
) -> CourseCompletionResponse:
    existing_by_key = await session.scalar(completion_by_idempotency_key(idempotency_key))
    if existing_by_key is not None:
        return course_completion_response(existing_by_key)
    await require_enrolled_course(session, learner_id, course_id)
    lesson_count = await session.scalar(
        select(func.count()).select_from(Lesson).where(Lesson.course_id == course_id),
    )
    complete_count = await session.scalar(
        select(func.count())
        .select_from(LessonProgress)
        .where(
            LessonProgress.learner_id == learner_id,
            LessonProgress.course_id == course_id,
            LessonProgress.percent_complete == COMPLETE_PERCENT,
            LessonProgress.deleted_at.is_(None),
        ),
    )
    if lesson_count == 0 or complete_count != lesson_count:
        msg = "all lessons must be complete before course completion"
        raise ValidationAppError(msg)
    existing = await session.scalar(completion_by_learner_course(learner_id, course_id))
    if existing is not None:
        return course_completion_response(existing)
    completion = CourseCompletion(
        learner_id=learner_id,
        course_id=course_id,
        status=CompletionStatus.completed.value,
        completed_at=datetime.now(UTC),
        idempotency_key=idempotency_key,
    )
    session.add(completion)
    await session.flush()
    _audit(session, learner_id, course_id, "course.completed", "Course completed")
    await session.commit()
    return course_completion_response(completion)


async def issue_certificate(
    session: AsyncSession,
    *,
    learner_id: UUID,
    course_id: UUID,
    idempotency_key: str,
) -> CertificateResponse:
    existing_by_key = await session.scalar(certificate_by_idempotency_key(idempotency_key))
    if existing_by_key is not None:
        return certificate_response(existing_by_key)
    await require_enrolled_course(session, learner_id, course_id)
    completion = await session.scalar(completion_by_learner_course(learner_id, course_id))
    if completion is None:
        msg = "course completion is required before certificate issuance"
        raise ValidationAppError(msg)
    existing = await session.scalar(certificate_by_learner_course(learner_id, course_id))
    if existing is not None:
        return certificate_response(existing)
    tenant_id = require_tenant_id()
    certificate = Certificate(
        learner_id=learner_id,
        course_id=course_id,
        completion_id=completion.id,
        certificate_number=f"OMX-{course_id.hex[:8]}-{learner_id.hex[:8]}",
        status=CertificateStatus.issued.value,
        pdf_object_key=f"tenants/{tenant_id}/courses/{course_id}/certificates/{learner_id}.pdf",
        idempotency_key=idempotency_key,
    )
    session.add(certificate)
    await session.flush()
    _audit(session, learner_id, course_id, "certificate.issued", "Certificate issued")
    await session.commit()
    return certificate_response(certificate)


def render_certificate_pdf(certificate: Certificate) -> bytes:
    title = f"OmniXtra Certificate {certificate.certificate_number}"
    body = (
        f"Certificate issued for course {certificate.course_id} "
        f"to learner {certificate.learner_id}."
    )
    stream = f"BT /F1 18 Tf 72 720 Td ({title}) Tj 0 -28 Td /F1 12 Tf ({body}) Tj ET"
    objects = [
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        (
            "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj"
        ),
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(stream)} >> stream\n{stream}\nendstream endobj",
    ]
    content = "%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(content))
        content += f"{obj}\n"
    xref_offset = len(content)
    xref_rows = ["0000000000 65535 f "] + [f"{offset:010d} 00000 n " for offset in offsets[1:]]
    content += f"xref\n0 {len(xref_rows)}\n"
    content += "\n".join(xref_rows)
    content += (
        f"\ntrailer << /Size {len(xref_rows)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    )
    return content.encode("ascii")


async def require_published_course(session: AsyncSession, course_id: UUID) -> Course:
    course = await session.scalar(published_course_by_id(course_id))
    if course is None:
        msg = "course not found"
        raise NotFoundError(msg)
    return course


async def require_enrolled_course(
    session: AsyncSession, learner_id: UUID, course_id: UUID
) -> Course:
    enrolment = await session.scalar(enrolment_by_learner_course(learner_id, course_id))
    if enrolment is None or enrolment.status != EnrolmentStatus.active.value:
        msg = "course not found"
        raise NotFoundError(msg)
    return await require_published_course(session, course_id)


async def require_course_lesson(session: AsyncSession, course_id: UUID, lesson_id: UUID) -> Lesson:
    lesson = await session.scalar(
        select(Lesson).where(
            Lesson.id == lesson_id,
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    if lesson is None:
        msg = "lesson not found"
        raise NotFoundError(msg)
    return lesson


async def require_quiz_block(session: AsyncSession, course_id: UUID, block_id: UUID) -> CourseBlock:
    block = await session.scalar(quiz_block_by_id(block_id))
    if block is None or block.course_id != course_id:
        msg = "quiz block not found"
        raise NotFoundError(msg)
    return block


def enrolment_response(enrolment: Enrolment) -> EnrolmentResponse:
    return EnrolmentResponse(
        id=enrolment.id,
        learner_id=enrolment.learner_id,
        course_id=enrolment.course_id,
        status=enrolment.status,
    )


def lesson_progress_response(progress: LessonProgress) -> LessonProgressResponse:
    return LessonProgressResponse(
        id=progress.id,
        learner_id=progress.learner_id,
        course_id=progress.course_id,
        lesson_id=progress.lesson_id,
        last_position=progress.last_position,
        percent_complete=progress.percent_complete,
        completed_at=progress.completed_at,
    )


def quiz_attempt_response(attempt: QuizAttempt) -> QuizAttemptResponse:
    return QuizAttemptResponse(
        id=attempt.id,
        learner_id=attempt.learner_id,
        course_id=attempt.course_id,
        lesson_id=attempt.lesson_id,
        block_id=attempt.block_id,
        selected_option_id=attempt.selected_option_id,
        score_percent=attempt.score_percent,
        passed=attempt.passed,
    )


def course_completion_response(completion: CourseCompletion) -> CourseCompletionResponse:
    return CourseCompletionResponse(
        id=completion.id,
        learner_id=completion.learner_id,
        course_id=completion.course_id,
        status=completion.status,
        completed_at=completion.completed_at,
    )


def certificate_response(certificate: Certificate) -> CertificateResponse:
    return CertificateResponse(
        id=certificate.id,
        learner_id=certificate.learner_id,
        course_id=certificate.course_id,
        completion_id=certificate.completion_id,
        certificate_number=certificate.certificate_number,
        status=certificate.status,
        pdf_object_key=certificate.pdf_object_key,
    )


def _audit(
    session: AsyncSession,
    learner_id: UUID,
    course_id: UUID,
    action: str,
    summary: str,
) -> None:
    session.add(
        LearningAuditEvent(
            learner_id=learner_id,
            course_id=course_id,
            action=action,
            summary=summary,
            event_data={},
        ),
    )
