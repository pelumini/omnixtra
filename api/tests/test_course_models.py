from app.courses.models import (
    Course,
    CourseAuditEvent,
    CourseBlock,
    CourseSection,
    CourseStatus,
    Lesson,
)


def test_course_status_values_are_stable() -> None:
    assert CourseStatus.draft.value == "draft"
    assert CourseStatus.published.value == "published"
    assert CourseStatus.archived.value == "archived"


def test_course_authoring_tables_are_tenant_owned() -> None:
    tenant_owned_models = (Course, CourseSection, Lesson, CourseBlock, CourseAuditEvent)

    for model in tenant_owned_models:
        assert "tenant_id" in model.__table__.columns
