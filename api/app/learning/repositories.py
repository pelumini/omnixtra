from uuid import UUID

from sqlalchemy import Select, select

from app.courses.models import Course, CourseBlock, CourseSection, Lesson
from app.learning.models import Certificate, CourseCompletion, Enrolment, LessonProgress


def enrolment_by_idempotency_key(idempotency_key: str) -> Select[tuple[Enrolment]]:
    return select(Enrolment).where(
        Enrolment.idempotency_key == idempotency_key,
        Enrolment.deleted_at.is_(None),
    )


def enrolment_by_learner_course(learner_id: UUID, course_id: UUID) -> Select[tuple[Enrolment]]:
    return select(Enrolment).where(
        Enrolment.learner_id == learner_id,
        Enrolment.course_id == course_id,
        Enrolment.deleted_at.is_(None),
    )


def progress_by_learner_lesson(learner_id: UUID, lesson_id: UUID) -> Select[tuple[LessonProgress]]:
    return select(LessonProgress).where(
        LessonProgress.learner_id == learner_id,
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.deleted_at.is_(None),
    )


def completion_by_idempotency_key(idempotency_key: str) -> Select[tuple[CourseCompletion]]:
    return select(CourseCompletion).where(
        CourseCompletion.idempotency_key == idempotency_key,
        CourseCompletion.deleted_at.is_(None),
    )


def completion_by_learner_course(
    learner_id: UUID, course_id: UUID
) -> Select[tuple[CourseCompletion]]:
    return select(CourseCompletion).where(
        CourseCompletion.learner_id == learner_id,
        CourseCompletion.course_id == course_id,
        CourseCompletion.deleted_at.is_(None),
    )


def certificate_by_idempotency_key(idempotency_key: str) -> Select[tuple[Certificate]]:
    return select(Certificate).where(
        Certificate.idempotency_key == idempotency_key,
        Certificate.deleted_at.is_(None),
    )


def certificate_by_learner_course(learner_id: UUID, course_id: UUID) -> Select[tuple[Certificate]]:
    return select(Certificate).where(
        Certificate.learner_id == learner_id,
        Certificate.course_id == course_id,
        Certificate.deleted_at.is_(None),
    )


def published_course_by_id(course_id: UUID) -> Select[tuple[Course]]:
    return select(Course).where(
        Course.id == course_id,
        Course.status == "published",
        Course.deleted_at.is_(None),
    )


def sections_for_player(course_id: UUID) -> Select[tuple[CourseSection]]:
    return (
        select(CourseSection)
        .where(CourseSection.course_id == course_id, CourseSection.deleted_at.is_(None))
        .order_by(CourseSection.position)
    )


def lessons_for_player(course_id: UUID) -> Select[tuple[Lesson]]:
    return (
        select(Lesson)
        .where(Lesson.course_id == course_id, Lesson.deleted_at.is_(None))
        .order_by(Lesson.section_id, Lesson.position)
    )


def quiz_block_by_id(block_id: UUID) -> Select[tuple[CourseBlock]]:
    return select(CourseBlock).where(
        CourseBlock.id == block_id,
        CourseBlock.block_type == "quiz",
        CourseBlock.deleted_at.is_(None),
    )
