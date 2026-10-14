from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, model_validator

from app.courses.models import CourseAccess, CourseDeliveryFormat, CourseDifficulty

TAG_MAX_LENGTH = 50
LEARNING_OUTCOME_MAX_LENGTH = 500


class TextBlockContent(BaseModel):
    type: Literal["text"] = "text"
    markdown: str = Field(min_length=1, max_length=20_000)


class VideoBlockContent(BaseModel):
    type: Literal["video"] = "video"
    url: HttpUrl
    caption: str | None = Field(default=None, max_length=500)


class ImageBlockContent(BaseModel):
    type: Literal["image"] = "image"
    url: HttpUrl
    alt_text: str = Field(min_length=1, max_length=300)


class AudioBlockContent(BaseModel):
    type: Literal["audio"] = "audio"
    url: HttpUrl
    caption: str | None = Field(default=None, max_length=500)


class FileBlockContent(BaseModel):
    type: Literal["file"] = "file"
    url: HttpUrl
    file_name: str = Field(min_length=1, max_length=255)
    size_bytes: int | None = Field(default=None, gt=0)


class QuizOption(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    text: str = Field(min_length=1, max_length=500)


class QuizBlockContent(BaseModel):
    type: Literal["quiz"] = "quiz"
    question: str = Field(min_length=1, max_length=1_000)
    options: list[QuizOption] = Field(min_length=2, max_length=8)
    correct_option_id: str = Field(min_length=1, max_length=64)

    @model_validator(mode="after")
    def correct_option_must_exist(self) -> Self:
        option_ids = {option.id for option in self.options}
        if len(option_ids) != len(self.options):
            msg = "quiz option ids must be unique"
            raise ValueError(msg)
        if self.correct_option_id not in option_ids:
            msg = "correct_option_id must match an option id"
            raise ValueError(msg)
        return self


BlockContent = (
    TextBlockContent
    | VideoBlockContent
    | ImageBlockContent
    | AudioBlockContent
    | FileBlockContent
    | QuizBlockContent
)


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    slug: str | None = Field(default=None, pattern=r"^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$")
    description: str | None = Field(default=None, max_length=2_000)


class CourseUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2_000)
    thumbnail_url: HttpUrl | None = None
    category: str | None = Field(default=None, max_length=120)
    tags: list[str] | None = Field(default=None, max_length=20)
    language: str | None = Field(
        default=None,
        max_length=16,
        pattern=r"^[a-z]{2,3}(?:-[A-Z]{2})?$",
    )
    learning_outcomes: list[str] | None = Field(default=None, max_length=20)
    target_audience: str | None = Field(default=None, max_length=2_000)
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None
    delivery_format: Literal["self_paced", "instructor_led", "blended"] | None = None
    estimated_duration_minutes: int | None = Field(default=None, ge=0)
    access: Literal["enrolled_only", "link"] | None = None
    complete_in_order: bool | None = None
    certificate_on_completion: bool | None = None

    @model_validator(mode="after")
    def validate_list_items(self) -> Self:
        if self.tags is not None and any(
            not item or len(item) > TAG_MAX_LENGTH for item in self.tags
        ):
            msg = "tags must contain non-empty values no longer than 50 characters"
            raise ValueError(msg)
        if self.learning_outcomes is not None and any(
            not item or len(item) > LEARNING_OUTCOME_MAX_LENGTH for item in self.learning_outcomes
        ):
            msg = "learning outcomes must contain non-empty values no longer than 500 characters"
            raise ValueError(msg)
        return self


class SectionCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    position: int = Field(ge=0)


class SectionUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2_000)
    image_url: HttpUrl | None = None


class LessonCreateRequest(BaseModel):
    section_id: UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    position: int | None = Field(default=None, ge=0)
    body: str | None = Field(default=None, min_length=1, max_length=20_000)


class LessonUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    summary: str | None = Field(default=None, max_length=2_000)
    image_url: HttpUrl | None = None
    estimated_duration_minutes: int | None = Field(default=None, ge=0)
    required_for_completion: bool | None = None


class BlockCreateRequest(BaseModel):
    lesson_id: UUID
    block_type: Literal["text", "video", "image", "audio", "file", "quiz"]
    content: BlockContent
    position: int = Field(ge=0)

    @model_validator(mode="after")
    def block_type_must_match_content(self) -> Self:
        if self.block_type != self.content.type:
            msg = "block_type must match content type"
            raise ValueError(msg)
        return self


class BlockUpdateRequest(BaseModel):
    content: BlockContent


class MediaAssetCreateRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=700)
    file_name: str = Field(min_length=1, max_length=255)
    content_type: str = Field(pattern=r"^(image|video)/[a-z0-9.+-]+$", max_length=120)
    byte_size: int = Field(gt=0)
    checksum_sha256: str | None = Field(default=None, pattern=r"^[a-f0-9]{64}$")


class ReorderRequest(BaseModel):
    ordered_ids: list[UUID] = Field(min_length=1)


class CourseResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str | None
    thumbnail_url: HttpUrl | None
    category: str | None
    tags: list[str]
    language: str | None
    learning_outcomes: list[str]
    target_audience: str | None
    difficulty: CourseDifficulty | None
    delivery_format: CourseDeliveryFormat | None
    estimated_duration_minutes: int | None
    access: CourseAccess
    complete_in_order: bool
    certificate_on_completion: bool
    status: str
    lesson_count: int = 0


class SectionResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    position: int
    description: str | None
    image_url: HttpUrl | None


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    section_id: UUID
    title: str
    position: int
    body: str | None = None
    summary: str | None
    image_url: HttpUrl | None
    estimated_duration_minutes: int | None
    required_for_completion: bool


class BlockResponse(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: UUID
    block_type: str
    content: dict[str, object]
    position: int


class LessonNode(LessonResponse):
    blocks: list[BlockResponse]


class SectionNode(SectionResponse):
    lessons: list[LessonNode]
    rolled_duration_minutes: int


class CourseStructureResponse(CourseResponse):
    sections: list[SectionNode]
    rolled_duration_minutes: int


class MediaAssetResponse(BaseModel):
    id: UUID
    course_id: UUID
    object_key: str
    file_name: str
    content_type: str
    byte_size: int
    checksum_sha256: str | None


class CursorPage(BaseModel):
    items: list[CourseResponse]
    next_cursor: str | None


class CourseDetailResponse(CourseResponse):
    lessons: list[LessonResponse]
