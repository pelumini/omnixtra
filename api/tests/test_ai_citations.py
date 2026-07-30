from uuid import UUID

from app.ai.citations import citation_key, citations_from_chunks
from app.ai.models import LessonEmbedding


def test_citations_are_derived_from_retrieved_chunks() -> None:
    course_id = UUID("00000000-0000-0000-0000-000000000001")
    lesson_id = UUID("00000000-0000-0000-0000-000000000002")
    chunk = LessonEmbedding(
        id=UUID("00000000-0000-0000-0000-000000000003"),
        tenant_id=UUID("00000000-0000-0000-0000-000000000004"),
        course_id=course_id,
        lesson_id=lesson_id,
        lesson_version=1,
        chunk_index=2,
        chunk_text="Tenant scoped content",
        embedding=[0.1, 0.2],
    )

    assert citations_from_chunks([chunk])[0]["chunk_index"] == 2
    assert citation_key(course_id, lesson_id, 2) == f"{course_id}:{lesson_id}:2"
