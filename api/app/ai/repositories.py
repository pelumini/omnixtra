from uuid import UUID

from sqlalchemy import Select, select

from app.ai.models import LessonEmbedding, SemanticCacheEntry, TutorConversation, TutorJob


def tutor_job_by_idempotency_key(idempotency_key: str) -> Select[tuple[TutorJob]]:
    return select(TutorJob).where(
        TutorJob.idempotency_key == idempotency_key,
        TutorJob.deleted_at.is_(None),
    )


def conversation_by_id(conversation_id: UUID) -> Select[tuple[TutorConversation]]:
    return select(TutorConversation).where(
        TutorConversation.id == conversation_id,
        TutorConversation.deleted_at.is_(None),
    )


def embeddings_for_course(course_id: UUID, query_text: str) -> Select[tuple[LessonEmbedding]]:
    return (
        select(LessonEmbedding)
        .where(
            LessonEmbedding.course_id == course_id,
            LessonEmbedding.deleted_at.is_(None),
            LessonEmbedding.chunk_text.ilike(f"%{query_text[:80]}%"),
        )
        .order_by(LessonEmbedding.lesson_id, LessonEmbedding.chunk_index)
        .limit(20)
    )


def semantic_cache_by_hash(
    course_id: UUID, semantic_hash: str
) -> Select[tuple[SemanticCacheEntry]]:
    return select(SemanticCacheEntry).where(
        SemanticCacheEntry.course_id == course_id,
        SemanticCacheEntry.semantic_hash == semantic_hash,
        SemanticCacheEntry.deleted_at.is_(None),
    )
