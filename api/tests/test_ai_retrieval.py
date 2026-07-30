from uuid import UUID

from app.ai.retrieval import HYBRID_RETRIEVAL_SQL, RetrievedChunk, deterministic_embedding_text


def test_hybrid_retrieval_sql_is_tenant_and_course_scoped() -> None:
    assert "tenant_id = :tenant_id" in HYBRID_RETRIEVAL_SQL
    assert "course_id = :course_id" in HYBRID_RETRIEVAL_SQL
    assert "embedding <=> CAST(:query_embedding AS vector)" in HYBRID_RETRIEVAL_SQL
    assert "plainto_tsquery('english', :query_text)" in HYBRID_RETRIEVAL_SQL


def test_deterministic_embedding_text_is_pgvector_literal() -> None:
    embedding = deterministic_embedding_text("What is onboarding?", dimensions=3)

    assert embedding.startswith("[")
    assert embedding.endswith("]")
    assert len(embedding.strip("[]").split(",")) == 3


def test_retrieved_chunk_carries_course_scope() -> None:
    course_id = UUID("00000000-0000-0000-0000-000000000002")

    chunk = RetrievedChunk(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=course_id,
        lesson_id=UUID("00000000-0000-0000-0000-000000000003"),
        lesson_version=1,
        chunk_index=0,
        chunk_text="Onboarding introduces workflows.",
        score=0.9,
    )

    assert chunk.course_id == course_id
