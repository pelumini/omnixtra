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
    embedding_provider: str


HYBRID_RETRIEVAL_SQL = """
WITH vector_matches AS (
    SELECT
        id,
        lesson_id,
        course_id,
        lesson_version,
        chunk_index,
        chunk_text,
        embedding_provider,
        1.0 - (embedding <=> CAST(:query_embedding AS vector)) AS score
    FROM lesson_embeddings
    WHERE tenant_id = :tenant_id
      AND course_id = :course_id
      AND embedding_provider = :embedding_provider
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
        embedding_provider,
        ts_rank_cd(
            to_tsvector('english', chunk_text),
            plainto_tsquery('english', :query_text)
        ) AS score
    FROM lesson_embeddings
    WHERE tenant_id = :tenant_id
      AND course_id = :course_id
      AND embedding_provider = :embedding_provider
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
    embedding_provider,
    score
FROM (
    SELECT * FROM vector_matches
    UNION ALL
    SELECT * FROM text_matches
) matches
ORDER BY id, score DESC
LIMIT :limit
"""


def deterministic_embedding_values(text_value: str, *, dimensions: int = 1536) -> list[float]:
    seed = sum(ord(character) for character in text_value.strip().lower())
    return [((seed + index) % 97) / 97 for index in range(dimensions)]


def embedding_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.6f}" for value in values) + "]"


def deterministic_embedding_text(question: str, *, dimensions: int = 1536) -> str:
    values = deterministic_embedding_values(question, dimensions=dimensions)
    return embedding_literal(values)


async def hybrid_retrieve_chunks(  # noqa: PLR0913
    session: AsyncSession,
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    query_embedding: list[float],
    embedding_provider: str,
    limit: int = 5,
) -> list[RetrievedChunk]:
    result = await session.execute(
        text(HYBRID_RETRIEVAL_SQL),
        {
            "tenant_id": tenant_id,
            "course_id": course_id,
            "query_embedding": embedding_literal(query_embedding),
            "embedding_provider": embedding_provider,
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
            embedding_provider=row["embedding_provider"],
        )
        for row in rows
    ]


__all__ = [
    "HYBRID_RETRIEVAL_SQL",
    "RetrievedChunk",
    "deterministic_embedding_text",
    "deterministic_embedding_values",
    "embedding_literal",
    "hybrid_retrieve_chunks",
]
