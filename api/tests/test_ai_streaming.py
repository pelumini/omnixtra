from uuid import UUID

from app.ai.streaming import sse_frame, tutor_job_channel


def test_tutor_job_channel_is_tenant_course_and_job_scoped() -> None:
    tenant_id = UUID("00000000-0000-0000-0000-000000000001")
    course_id = UUID("00000000-0000-0000-0000-000000000002")
    job_id = UUID("00000000-0000-0000-0000-000000000003")

    assert tutor_job_channel(tenant_id=tenant_id, course_id=course_id, job_id=job_id) == (
        f"tenant:{tenant_id}:ai_jobs:course:{course_id}:job:{job_id}"
    )


def test_sse_frame_serializes_event_and_data() -> None:
    frame = sse_frame(event="completed", data={"status": "completed"})

    assert frame == b'event: completed\ndata: {"status":"completed"}\n\n'
