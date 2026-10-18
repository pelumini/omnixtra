import pytest
from pydantic import BaseModel, ValidationError

from app.courses.schemas import (
    AudioBlockContent,
    BlockCreateRequest,
    CourseUpdateRequest,
    FileBlockContent,
    ImageBlockContent,
    LessonUpdateRequest,
    MediaAssetCreateRequest,
    QuizBlockContent,
    QuizOption,
    SectionUpdateRequest,
    TextBlockContent,
    VideoBlockContent,
)


def test_course_block_content_schemas_cover_mvp_block_types() -> None:
    assert TextBlockContent(markdown="Welcome").type == "text"
    assert (
        TextBlockContent(
            doc={
                "type": "doc",
                "content": [
                    {"type": "paragraph", "content": [{"type": "text", "text": "Welcome"}]}
                ],
            }
        ).doc
        is not None
    )
    assert VideoBlockContent(url="https://cdn.example.com/intro.mp4").type == "video"
    assert (
        ImageBlockContent(url="https://cdn.example.com/hero.png", alt_text="Hero").type == "image"
    )


def test_text_block_requires_bounded_tiptap_or_legacy_content() -> None:
    with pytest.raises(ValidationError):
        TextBlockContent()
    with pytest.raises(ValidationError):
        TextBlockContent(doc={"type": "paragraph", "content": []})
    with pytest.raises(ValidationError):
        TextBlockContent(doc={"type": "doc", "content": []})
    with pytest.raises(ValidationError):
        TextBlockContent(doc={"type": "doc", "content": "not-a-list"})
    with pytest.raises(ValidationError):
        TextBlockContent(doc={"type": "doc", "content": [{"type": "text", "text": "x" * 100_001}]})
    assert AudioBlockContent(url="https://cdn.example.com/intro.mp3").type == "audio"
    assert (
        FileBlockContent(
            url="https://cdn.example.com/guide.pdf",
            file_name="guide.pdf",
            size_bytes=1024,
        ).type
        == "file"
    )
    assert (
        QuizBlockContent(
            question="Ready?",
            options=[
                QuizOption(id="yes", text="Yes"),
                QuizOption(id="no", text="No"),
            ],
            correct_option_id="yes",
        ).type
        == "quiz"
    )


def test_quiz_correct_option_must_match_an_option_id() -> None:
    with pytest.raises(ValidationError, match="correct_option_id must match an option id"):
        QuizBlockContent(
            question="Ready?",
            options=[
                QuizOption(id="yes", text="Yes"),
                QuizOption(id="no", text="No"),
            ],
            correct_option_id="missing",
        )


def test_block_type_must_match_content_type() -> None:
    with pytest.raises(ValidationError, match="block_type must match content type"):
        BlockCreateRequest(
            lesson_id="00000000-0000-0000-0000-000000000001",
            block_type="text",
            content=ImageBlockContent(url="https://cdn.example.com/hero.png", alt_text="Hero"),
            position=0,
        )


def test_file_block_rejects_empty_name_and_non_positive_size() -> None:
    with pytest.raises(ValidationError):
        FileBlockContent(url="https://cdn.example.com/guide.pdf", file_name="", size_bytes=0)


def test_media_asset_schema_accepts_image_and_video_metadata() -> None:
    image = MediaAssetCreateRequest(
        object_key="tenants/tenant-id/courses/course-id/hero.png",
        file_name="hero.png",
        content_type="image/png",
        byte_size=1024,
    )
    video = MediaAssetCreateRequest(
        object_key="tenants/tenant-id/courses/course-id/intro.mp4",
        file_name="intro.mp4",
        content_type="video/mp4",
        byte_size=2048,
        checksum_sha256="a" * 64,
    )

    assert image.content_type == "image/png"
    assert video.checksum_sha256 == "a" * 64


def test_course_setup_metadata_accepts_valid_optional_values() -> None:
    request = CourseUpdateRequest(
        thumbnail_url="https://cdn.example.com/course.png",
        category="Security",
        tags=["required", "onboarding"],
        language="en-GB",
        learning_outcomes=["Recognize a phishing attempt"],
        target_audience="New team members",
        difficulty="beginner",
        delivery_format="self_paced",
        estimated_duration_minutes=90,
    )

    assert request.estimated_duration_minutes == 90
    assert request.tags == ["required", "onboarding"]


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("thumbnail_url", "not-a-url"),
        ("language", "english"),
        ("difficulty", "expert"),
        ("delivery_format", "live"),
        ("estimated_duration_minutes", -1),
        ("tags", ["x"] * 21),
        ("learning_outcomes", ["x"] * 21),
    ],
)
def test_course_setup_metadata_rejects_invalid_values(field: str, value: object) -> None:
    with pytest.raises(ValidationError):
        CourseUpdateRequest.model_validate({field: value})


def test_builder_metadata_accepts_partial_updates() -> None:
    course = CourseUpdateRequest(
        access="link", complete_in_order=True, certificate_on_completion=True
    )
    section = SectionUpdateRequest(
        description="Core concepts", image_url="https://cdn.example.com/chapter.png"
    )
    lesson = LessonUpdateRequest(
        summary="A concise introduction",
        image_url="https://cdn.example.com/lesson.png",
        estimated_duration_minutes=75,
        required_for_completion=True,
    )

    assert course.access == "link"
    assert section.title is None
    assert lesson.estimated_duration_minutes == 75


@pytest.mark.parametrize(
    ("schema", "payload"),
    [
        (CourseUpdateRequest, {"access": "public"}),
        (SectionUpdateRequest, {"description": "x" * 2001}),
        (LessonUpdateRequest, {"image_url": "not-a-url"}),
        (LessonUpdateRequest, {"estimated_duration_minutes": -1}),
    ],
)
def test_builder_metadata_rejects_invalid_values(
    schema: type[BaseModel], payload: dict[str, object]
) -> None:
    with pytest.raises(ValidationError):
        schema.model_validate(payload)
