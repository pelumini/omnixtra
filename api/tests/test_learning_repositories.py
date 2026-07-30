from uuid import UUID

from sqlalchemy.dialects import postgresql

from app.learning.repositories import (
    certificate_by_idempotency_key,
    completion_by_idempotency_key,
    enrolment_by_idempotency_key,
    progress_by_learner_lesson,
)

LEARNER_ID = UUID("00000000-0000-0000-0000-000000000001")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000002")


def test_idempotency_repositories_exclude_soft_deleted_rows() -> None:
    assert "enrolments.deleted_at IS NULL" in _compile(enrolment_by_idempotency_key("key-1"))
    assert "course_completions.deleted_at IS NULL" in _compile(
        completion_by_idempotency_key("key-2"),
    )
    assert "certificates.deleted_at IS NULL" in _compile(certificate_by_idempotency_key("key-3"))


def test_progress_repository_filters_by_learner_and_lesson() -> None:
    compiled = _compile(progress_by_learner_lesson(LEARNER_ID, LESSON_ID))

    assert "lesson_progress.learner_id =" in compiled
    assert "lesson_progress.lesson_id =" in compiled


def _compile(statement: object) -> str:
    return str(statement.compile(dialect=postgresql.dialect()))
