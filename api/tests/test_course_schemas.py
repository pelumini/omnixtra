import pytest
from pydantic import ValidationError

from app.courses.schemas import (
    BlockCreateRequest,
    ImageBlockContent,
    MediaAssetCreateRequest,
    QuizBlockContent,
    QuizOption,
    TextBlockContent,
    VideoBlockContent,
)


def test_course_block_content_schemas_cover_mvp_block_types() -> None:
    assert TextBlockContent(markdown="Welcome").type == "text"
    assert VideoBlockContent(url="https://cdn.example.com/intro.mp4").type == "video"
    assert (
        ImageBlockContent(url="https://cdn.example.com/hero.png", alt_text="Hero").type == "image"
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
