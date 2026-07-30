import pytest
from pydantic import ValidationError

from app.courses.schemas import (
    BlockCreateRequest,
    ImageBlockContent,
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
