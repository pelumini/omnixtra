from dataclasses import dataclass
from uuid import UUID

from app.ai.cache import semantic_hash
from app.ai.chunking import LessonChunk, chunk_lesson_text


@dataclass(frozen=True)
class EmbeddingJobPayload:
    tenant_id: UUID
    course_id: UUID
    lesson_id: UUID
    lesson_version: int
    text: str


def build_embedding_chunks(payload: EmbeddingJobPayload) -> list[LessonChunk]:
    return chunk_lesson_text(
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        lesson_version=payload.lesson_version,
        text=payload.text,
    )


def tutor_job_queue_name(tenant_id: UUID) -> str:
    return f"tenant:{tenant_id}:ai_jobs"


def tutor_job_deduplication_key(*, tenant_id: UUID, course_id: UUID, question: str) -> str:
    return f"{tenant_id}:{course_id}:{semantic_hash(question)}"
