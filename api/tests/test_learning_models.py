from app.learning.models import (
    Certificate,
    CourseCompletion,
    Enrolment,
    EnrolmentStatus,
    LearningAuditEvent,
    LessonProgress,
    QuizAttempt,
)


def test_enrolment_status_values_are_stable() -> None:
    assert EnrolmentStatus.active.value == "active"
    assert EnrolmentStatus.completed.value == "completed"
    assert EnrolmentStatus.cancelled.value == "cancelled"


def test_learning_tables_are_tenant_owned() -> None:
    tenant_owned_models = (
        Enrolment,
        LessonProgress,
        QuizAttempt,
        CourseCompletion,
        Certificate,
        LearningAuditEvent,
    )

    for model in tenant_owned_models:
        assert "tenant_id" in model.__table__.columns
