from uuid import UUID

from app.ai.models import TutorConversation, TutorJob
from app.ai.services import conversation_response, tutor_job_response

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
LEARNER_ID = UUID("00000000-0000-0000-0000-000000000002")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000003")
CONVERSATION_ID = UUID("00000000-0000-0000-0000-000000000004")
JOB_ID = UUID("00000000-0000-0000-0000-000000000005")


def test_tutor_job_response_maps_queued_job() -> None:
    job = TutorJob(
        id=JOB_ID,
        tenant_id=TENANT_ID,
        conversation_id=CONVERSATION_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
        question="What is onboarding?",
        status="queued",
        idempotency_key="job-key",
        trace_metadata={"graph": "mvp_tutor"},
    )

    assert tutor_job_response(job).status == "queued"


def test_conversation_response_maps_learner_and_course() -> None:
    conversation = TutorConversation(
        id=CONVERSATION_ID,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        course_id=COURSE_ID,
    )

    assert conversation_response(conversation).course_id == COURSE_ID
