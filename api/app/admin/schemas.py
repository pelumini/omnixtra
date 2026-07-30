from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CourseCompletionAnalyticsResponse(BaseModel):
    course_id: UUID
    course_title: str
    enrolled_count: int
    completed_count: int
    completion_percentage: int


class LearnerProgressReportRow(BaseModel):
    learner_id: UUID
    learner_name: str
    learner_email: str
    course_id: UUID
    course_title: str
    enrolment_status: str
    lessons_total: int
    lessons_completed: int
    average_progress_percent: int
    completed_at: datetime | None


__all__ = ["CourseCompletionAnalyticsResponse", "LearnerProgressReportRow"]
