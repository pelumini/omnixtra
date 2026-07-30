from uuid import UUID

from sqlalchemy.dialects import postgresql

from app.ai.repositories import (
    embeddings_for_course,
    semantic_cache_by_hash,
    tutor_job_by_idempotency_key,
)

COURSE_ID = UUID("00000000-0000-0000-0000-000000000001")


def test_retrieval_repository_filters_by_course_and_soft_delete() -> None:
    compiled = _compile(embeddings_for_course(COURSE_ID, "onboarding"))

    assert "lesson_embeddings.course_id =" in compiled
    assert "lesson_embeddings.deleted_at IS NULL" in compiled


def test_ai_idempotency_and_cache_repositories_exclude_soft_deleted_rows() -> None:
    assert "tutor_jobs.deleted_at IS NULL" in _compile(tutor_job_by_idempotency_key("key-1"))
    assert "semantic_cache_entries.deleted_at IS NULL" in _compile(
        semantic_cache_by_hash(COURSE_ID, "hash"),
    )


def _compile(statement: object) -> str:
    return str(statement.compile(dialect=postgresql.dialect()))
