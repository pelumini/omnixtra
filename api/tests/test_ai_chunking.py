from uuid import UUID

from app.ai.chunking import CHUNK_TOKEN_OVERLAP, CHUNK_TOKEN_TARGET, chunk_lesson_text

COURSE_ID = UUID("00000000-0000-0000-0000-000000000001")
LESSON_ID = UUID("00000000-0000-0000-0000-000000000002")


def test_chunk_lesson_text_uses_target_size_and_overlap() -> None:
    text = " ".join(f"token-{index}" for index in range(CHUNK_TOKEN_TARGET + 25))

    chunks = chunk_lesson_text(
        course_id=COURSE_ID,
        lesson_id=LESSON_ID,
        lesson_version=3,
        text=text,
    )

    assert len(chunks) == 2
    assert chunks[0].lesson_version == 3
    assert chunks[1].text.startswith(f"token-{CHUNK_TOKEN_TARGET - CHUNK_TOKEN_OVERLAP}")


def test_chunk_lesson_text_skips_empty_lessons() -> None:
    assert (
        chunk_lesson_text(course_id=COURSE_ID, lesson_id=LESSON_ID, lesson_version=1, text="") == []
    )
