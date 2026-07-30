from __future__ import annotations

import csv
from collections import defaultdict
from io import StringIO
from typing import TYPE_CHECKING

from sqlalchemy import Select, select

from app.admin.schemas import CourseCompletionAnalyticsResponse, LearnerProgressReportRow
from app.auth.models import User
from app.courses.models import Course, Lesson
from app.learning.models import CourseCompletion, Enrolment, LessonProgress

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

LESSON_COMPLETE_PERCENT = 100


async def course_completion_analytics(
    session: AsyncSession,
) -> list[CourseCompletionAnalyticsResponse]:
    courses = list((await session.scalars(_courses())).all())
    enrolments = list((await session.scalars(_enrolments())).all())
    completions = list((await session.scalars(_completions())).all())

    enrolled_by_course: dict[UUID, set[UUID]] = defaultdict(set)
    for enrolment in enrolments:
        enrolled_by_course[enrolment.course_id].add(enrolment.learner_id)

    completed_by_course: dict[UUID, set[UUID]] = defaultdict(set)
    for completion in completions:
        completed_by_course[completion.course_id].add(completion.learner_id)

    return [
        CourseCompletionAnalyticsResponse(
            course_id=course.id,
            course_title=course.title,
            enrolled_count=len(enrolled_by_course[course.id]),
            completed_count=len(completed_by_course[course.id]),
            completion_percentage=_percentage(
                len(completed_by_course[course.id]),
                len(enrolled_by_course[course.id]),
            ),
        )
        for course in courses
    ]


async def learner_progress_report(session: AsyncSession) -> list[LearnerProgressReportRow]:
    users = {user.id: user for user in list((await session.scalars(_users())).all())}
    courses = {course.id: course for course in list((await session.scalars(_courses())).all())}
    lessons = list((await session.scalars(_lessons())).all())
    progress_rows = list((await session.scalars(_lesson_progress())).all())
    completions = list((await session.scalars(_completions())).all())
    enrolments = list((await session.scalars(_enrolments())).all())

    lessons_by_course: dict[UUID, set[UUID]] = defaultdict(set)
    for lesson in lessons:
        lessons_by_course[lesson.course_id].add(lesson.id)

    progress_by_learner_course: dict[tuple[UUID, UUID], list[LessonProgress]] = defaultdict(list)
    for progress in progress_rows:
        progress_by_learner_course[(progress.learner_id, progress.course_id)].append(progress)

    completed_at_by_learner_course = {
        (completion.learner_id, completion.course_id): completion.completed_at
        for completion in completions
    }

    rows: list[LearnerProgressReportRow] = []
    for enrolment in enrolments:
        user = users.get(enrolment.learner_id)
        course = courses.get(enrolment.course_id)
        if user is None or course is None:
            continue
        course_lessons = lessons_by_course[course.id]
        learner_progress = progress_by_learner_course[(user.id, course.id)]
        completed_lessons = {
            progress.lesson_id
            for progress in learner_progress
            if progress.percent_complete >= LESSON_COMPLETE_PERCENT
            and progress.lesson_id in course_lessons
        }
        rows.append(
            LearnerProgressReportRow(
                learner_id=user.id,
                learner_name=user.full_name,
                learner_email=user.email,
                course_id=course.id,
                course_title=course.title,
                enrolment_status=enrolment.status,
                lessons_total=len(course_lessons),
                lessons_completed=len(completed_lessons),
                average_progress_percent=_average_progress(learner_progress),
                completed_at=completed_at_by_learner_course.get((user.id, course.id)),
            ),
        )
    return rows


def learner_progress_csv(rows: list[LearnerProgressReportRow]) -> str:
    output = StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "learner_id",
            "learner_name",
            "learner_email",
            "course_id",
            "course_title",
            "enrolment_status",
            "lessons_total",
            "lessons_completed",
            "average_progress_percent",
            "completed_at",
        ],
    )
    writer.writeheader()
    for row in rows:
        data = row.model_dump(mode="json")
        writer.writerow(data)
    return output.getvalue()


def _percentage(value: int, total: int) -> int:
    if total == 0:
        return 0
    return round((value / total) * 100)


def _average_progress(rows: list[LessonProgress]) -> int:
    if not rows:
        return 0
    return round(sum(row.percent_complete for row in rows) / len(rows))


def _courses() -> Select[tuple[Course]]:
    return select(Course).where(Course.deleted_at.is_(None)).order_by(Course.title)


def _users() -> Select[tuple[User]]:
    return select(User).where(User.deleted_at.is_(None)).order_by(User.full_name)


def _enrolments() -> Select[tuple[Enrolment]]:
    return select(Enrolment).where(Enrolment.deleted_at.is_(None)).order_by(Enrolment.created_at)


def _lessons() -> Select[tuple[Lesson]]:
    return select(Lesson).where(Lesson.deleted_at.is_(None)).order_by(Lesson.position)


def _lesson_progress() -> Select[tuple[LessonProgress]]:
    return select(LessonProgress).where(LessonProgress.deleted_at.is_(None))


def _completions() -> Select[tuple[CourseCompletion]]:
    return select(CourseCompletion).where(CourseCompletion.deleted_at.is_(None))


__all__ = ["course_completion_analytics", "learner_progress_csv", "learner_progress_report"]
