from uuid import UUID

from app.ai.graph import run_tutor_graph_skeleton


def test_tutor_graph_returns_refusal_for_out_of_scope_question() -> None:
    result = run_tutor_graph_skeleton(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is not in this course?",
        retrieved_context=[],
        citations=[],
    )

    assert result.refused is True
    assert result.citations == []


def test_tutor_graph_returns_ai_generated_answer_with_citations() -> None:
    result = run_tutor_graph_skeleton(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is onboarding?",
        retrieved_context=["Onboarding introduces the learner to required workflows."],
        citations=[{"chunk_index": 0}],
    )

    assert result.refused is False
    assert result.citations == [{"chunk_index": 0}]
