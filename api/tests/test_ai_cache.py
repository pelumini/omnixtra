from uuid import UUID

from app.ai.cache import semantic_cache_key, semantic_hash


def test_semantic_hash_normalizes_question_spacing_and_case() -> None:
    assert semantic_hash(" What Is RLS? ") == semantic_hash("what is   rls?")


def test_semantic_cache_key_is_tenant_and_course_scoped() -> None:
    tenant_id = UUID("00000000-0000-0000-0000-000000000001")
    course_id = UUID("00000000-0000-0000-0000-000000000002")

    key = semantic_cache_key(
        tenant_id=tenant_id,
        course_id=course_id,
        semantic_hash_value="abc",
    )

    assert key == f"tenant:{tenant_id}:ai_cache:course:{course_id}:semantic:abc"
