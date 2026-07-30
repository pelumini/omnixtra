from collections.abc import Iterable
from dataclasses import dataclass
from uuid import UUID

CHUNK_TOKEN_TARGET = 500
CHUNK_TOKEN_OVERLAP = 50


@dataclass(frozen=True)
class LessonChunk:
    course_id: UUID
    lesson_id: UUID
    lesson_version: int
    chunk_index: int
    text: str


def chunk_lesson_text(
    *,
    course_id: UUID,
    lesson_id: UUID,
    lesson_version: int,
    text: str,
) -> list[LessonChunk]:
    words = text.split()
    if not words:
        return []
    chunks: list[LessonChunk] = []
    step = max(CHUNK_TOKEN_TARGET - CHUNK_TOKEN_OVERLAP, 1)
    for chunk_index, start in enumerate(range(0, len(words), step)):
        chunk_words = words[start : start + CHUNK_TOKEN_TARGET]
        chunks.append(
            LessonChunk(
                course_id=course_id,
                lesson_id=lesson_id,
                lesson_version=lesson_version,
                chunk_index=chunk_index,
                text=" ".join(chunk_words),
            ),
        )
        if start + CHUNK_TOKEN_TARGET >= len(words):
            break
    return chunks


def chunks_text(chunks: Iterable[LessonChunk]) -> list[str]:
    return [chunk.text for chunk in chunks]
