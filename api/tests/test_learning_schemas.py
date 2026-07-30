from uuid import UUID

from app.learning.schemas import (
    LessonProgressRequest,
    PlayerLesson,
    PlayerSection,
    QuizAttemptRequest,
)


def test_lesson_progress_bounds_are_validated() -> None:
    progress = LessonProgressRequest(last_position=125, percent_complete=80)

    assert progress.percent_complete == 80


def test_quiz_attempt_request_captures_selected_option() -> None:
    request = QuizAttemptRequest(selected_option_id="a")

    assert request.selected_option_id == "a"


def test_player_section_contains_progressful_lessons() -> None:
    lesson = PlayerLesson(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        title="Welcome",
        position=0,
        percent_complete=100,
    )
    section = PlayerSection(
        id=UUID("00000000-0000-0000-0000-000000000002"),
        title="Start",
        position=0,
        lessons=[lesson],
    )

    assert section.lessons[0].percent_complete == 100
