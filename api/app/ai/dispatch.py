from uuid import UUID

from app.ai.actors import generate_lesson_embeddings, run_tutor_job


def dispatch_tutor_job(
    *,
    tenant_id: UUID,
    job_id: UUID,
    course_id: UUID,
    learner_id: UUID,
) -> None:
    run_tutor_job.send(
        tenant_id=str(tenant_id),
        job_id=str(job_id),
        course_id=str(course_id),
        learner_id=str(learner_id),
    )


def dispatch_embedding_job(
    *,
    tenant_id: UUID,
    course_id: UUID,
    lesson_id: UUID,
    lesson_version: int,
    text: str,
) -> None:
    generate_lesson_embeddings.send(
        tenant_id=str(tenant_id),
        course_id=str(course_id),
        lesson_id=str(lesson_id),
        lesson_version=lesson_version,
        text=text,
    )


__all__ = ["dispatch_embedding_job", "dispatch_tutor_job"]
