from uuid import UUID

from app.ai.jobs import EmbeddingJobPayload, build_embedding_chunks, tutor_job_queue_name


def test_embedding_job_payload_builds_lesson_chunks() -> None:
    payload = EmbeddingJobPayload(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        lesson_id=UUID("00000000-0000-0000-0000-000000000003"),
        lesson_version=2,
        text="one two three",
    )

    chunks = build_embedding_chunks(payload)

    assert chunks[0].lesson_version == 2


def test_tutor_job_queue_name_is_tenant_scoped() -> None:
    tenant_id = UUID("00000000-0000-0000-0000-000000000001")

    assert tutor_job_queue_name(tenant_id) == f"tenant:{tenant_id}:ai_jobs"
