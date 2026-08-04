from datetime import UTC, datetime
from uuid import UUID

from app.learning.models import (
    Certificate,
    CourseCompletion,
    Enrolment,
    LessonProgress,
    QuizAttempt,
)
from app.learning.services import (
    certificate_response,
    course_completion_response,
    enrolment_response,
    lesson_progress_response,
    quiz_attempt_response,
    render_certificate_pdf,
)

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
LEARNER_ID = UUID("00000000-0000-0000-0000-000000000002")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000003")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000004")
BLOCK_ID = UUID("00000000-0000-0000-0000-000000000005")
COMPLETION_ID = UUID("00000000-0000-0000-0000-000000000006")


def test_learning_response_mappers_expose_expected_fields() -> None:
    completed_at = datetime.now(UTC)
    enrolment = Enrolment(
        id=UUID("00000000-0000-0000-0000-000000000101"),
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        course_role="learner",
        status="active",
        idempotency_key="enrol-key",
    )
    progress = LessonProgress(
        id=UUID("00000000-0000-0000-0000-000000000102"),
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        lesson_id=LESSON_ID,
        last_position=10,
        percent_complete=100,
        completed_at=completed_at,
    )
    attempt = QuizAttempt(
        id=UUID("00000000-0000-0000-0000-000000000103"),
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        lesson_id=LESSON_ID,
        block_id=BLOCK_ID,
        selected_option_id="a",
        score_percent=100,
        passed=True,
    )

    assert enrolment_response(enrolment).status == "active"
    assert lesson_progress_response(progress).percent_complete == 100
    assert quiz_attempt_response(attempt).passed is True


def test_completion_and_certificate_response_mappers_expose_expected_fields() -> None:
    completed_at = datetime.now(UTC)
    completion = CourseCompletion(
        id=COMPLETION_ID,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        status="completed",
        completed_at=completed_at,
        idempotency_key="completion-key",
    )
    certificate = Certificate(
        id=UUID("00000000-0000-0000-0000-000000000104"),
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        completion_id=COMPLETION_ID,
        certificate_number="OMX-course-learner",
        status="issued",
        pdf_object_key="tenants/t/courses/c/certificates/l.pdf",
        idempotency_key="certificate-key",
    )

    assert course_completion_response(completion).completed_at == completed_at
    assert certificate_response(certificate).completion_id == COMPLETION_ID
    assert render_certificate_pdf(certificate).startswith(b"%PDF-1.4")
