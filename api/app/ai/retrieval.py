from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True)
class RetrievedChunk:
    id: UUID
    course_id: UUID
    lesson_id: UUID
    lesson_version: int
    chunk_index: int
    chunk_text: str
    score: float


HYBRID_RETRIEVAL_SQL = """
WITH vector_matches AS (
    SELECT
        id,
        lesson_id,
        course_id,
        lesson_version,
        chunk_index,
        chunk_text,
        1.0 - (embedding <=> CAST(:query_embedding AS vector)) AS score
    FROM lesson_embeddings
    WHERE tenant_id = :tenant_id
      AND course_id = :course_id
      AND deleted_at IS NULL
    ORDER BY embedding <=> CAST(:query_embedding AS vector)
    LIMIT :vector_limit
),
text_matches AS (
    SELECT
        id,
        lesson_id,
        course_id,
        lesson_version,
        chunk_index,
        chunk_text,
        ts_rank_cd(
            to_tsvector('english', chunk_text),
            plainto_tsquery('english', :query_text)
        ) AS score
    FROM lesson_embeddings
    WHERE tenant_id = :tenant_id
      AND course_id = :course_id
      AND deleted_at IS NULL
      AND to_tsvector('english', chunk_text) @@ plainto_tsquery('english', :query_text)
    LIMIT :text_limit
)
SELECT DISTINCT ON (id)
    id,
    lesson_id,
    course_id,
    lesson_version,
    chunk_index,
    chunk_text,
    score
FROM (
    SELECT * FROM vector_matches
    UNION ALL
    SELECT * FROM text_matches
) matches
ORDER BY id, score DESC
LIMIT :limit
"""


def deterministic_embedding_text(question: str, *, dimensions: int = 1536) -> str:
    seed = sum(ord(character) for character in question.strip().lower())
    values = [((seed + index) % 97) / 97 for index in range(dimensions)]
    return "[" + ",".join(f"{value:.6f}" for value in values) + "]"


async def hybrid_retrieve_chunks(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    limit: int = 5,
) -> list[RetrievedChunk]:
    result = await session.execute(
        text(HYBRID_RETRIEVAL_SQL),
        {
            "tenant_id": tenant_id,
            "course_id": course_id,
            "query_embedding": deterministic_embedding_text(question),
            "query_text": question,
            "vector_limit": max(limit * 4, 20),
            "text_limit": max(limit * 4, 20),
            "limit": limit,
        },
    )
    rows = result.mappings().all()
    return [
        RetrievedChunk(
            id=row["id"],
            course_id=row["course_id"],
            lesson_id=row["lesson_id"],
            lesson_version=row["lesson_version"],
            chunk_index=row["chunk_index"],
            chunk_text=row["chunk_text"],
            score=float(row["score"]),
        )
        for row in rows
    ]


__all__ = [
    "HYBRID_RETRIEVAL_SQL",
    "RetrievedChunk",
    "deterministic_embedding_text",
    "hybrid_retrieve_chunks",
]
