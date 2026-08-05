from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EnrolmentResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
    course_role: str
    status: str


class LessonProgressRequest(BaseModel):
    last_position: int = Field(ge=0)
    percent_complete: int = Field(ge=0, le=100)


class LessonProgressResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
    lesson_id: UUID
    last_position: int
    percent_complete: int
    completed_at: datetime | None


class QuizAttemptRequest(BaseModel):
    selected_option_id: str = Field(min_length=1, max_length=64)


class QuizAttemptResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
    lesson_id: UUID
    block_id: UUID
    selected_option_id: str
    score_percent: int
    passed: bool


class CourseCompletionResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
    status: str
    completed_at: datetime


class CertificateResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
    completion_id: UUID
    certificate_number: str
    status: str
    pdf_object_key: str | None


class PlayerLesson(BaseModel):
    id: UUID
    title: str
    position: int
    percent_complete: int


class PlayerSection(BaseModel):
    id: UUID
    title: str
    position: int
    lessons: list[PlayerLesson]


class CoursePlayerResponse(BaseModel):
    course_id: UUID
    title: str
    status: str
    sections: list[PlayerSection]


class CourseProgressSummary(BaseModel):
    completed_lessons: int
    total_lessons: int
    percent_complete: int


class MyCourseResponse(BaseModel):
    course_id: UUID
    title: str
    slug: str
    status: str
    course_role: str
    progress: CourseProgressSummary | None = None


class MyCoursesResponse(BaseModel):
    courses: list[MyCourseResponse]
