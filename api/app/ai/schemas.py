from uuid import UUID

from pydantic import BaseModel, Field


class TutorQuestionRequest(BaseModel):
    conversation_id: UUID | None = None
    question: str = Field(min_length=3, max_length=2_000)


class TutorJobResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    course_id: UUID
    status: str


class TutorEventResponse(BaseModel):
    event: str
    data: dict[str, object]


class ConversationResponse(BaseModel):
    id: UUID
    learner_id: UUID
    course_id: UUID
