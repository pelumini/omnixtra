from uuid import UUID

from app.ai.models import LessonEmbedding


def citations_from_chunks(chunks: list[LessonEmbedding]) -> list[dict[str, object]]:
    return [
        {
            "course_id": str(chunk.course_id),
            "lesson_id": str(chunk.lesson_id),
            "chunk_id": str(chunk.id),
            "chunk_index": chunk.chunk_index,
        }
        for chunk in chunks
    ]


def citation_key(course_id: UUID, lesson_id: UUID, chunk_index: int) -> str:
    return f"{course_id}:{lesson_id}:{chunk_index}"
