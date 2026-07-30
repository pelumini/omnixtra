from typing import Literal, Self
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl, model_validator


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


BlockContent = TextBlockContent | VideoBlockContent | ImageBlockContent | QuizBlockContent


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$")
    description: str | None = Field(default=None, max_length=2_000)


class CourseUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=2_000)


class SectionCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    position: int = Field(ge=0)


class LessonCreateRequest(BaseModel):
    section_id: UUID
    title: str = Field(min_length=1, max_length=200)
    position: int = Field(ge=0)


class BlockCreateRequest(BaseModel):
    lesson_id: UUID
    block_type: Literal["text", "video", "image", "quiz"]
    content: BlockContent
    position: int = Field(ge=0)

    @model_validator(mode="after")
    def block_type_must_match_content(self) -> Self:
        if self.block_type != self.content.type:
            msg = "block_type must match content type"
            raise ValueError(msg)
        return self


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
    status: str


class SectionResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    position: int


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    section_id: UUID
    title: str
    position: int


class BlockResponse(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: UUID
    block_type: str
    content: dict[str, object]
    position: int


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
