from uuid import UUID

import pytest

from app.ai.graph import build_tutor_graph, run_tutor_graph
from app.ai.providers import AdvisoryProvider


def test_tutor_graph_compiles_langgraph_workflow() -> None:
    graph = build_tutor_graph()

    assert graph is not None


@pytest.mark.anyio
async def test_tutor_graph_returns_refusal_for_out_of_scope_question() -> None:
    result = await run_tutor_graph(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is not in this course?",
        retrieved_context=[],
        citations=[],
        provider=AdvisoryProvider(),
    )

    assert result.refused is True
    assert result.citations == []
    assert result.provider == "advisory-local"
    assert result.advisory is True


@pytest.mark.anyio
async def test_tutor_graph_returns_empty_context_refusal() -> None:
    result = await run_tutor_graph(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is onboarding?",
        retrieved_context=[],
        citations=[],
        provider=AdvisoryProvider(),
    )

    assert result.answer == "I could not find that in this course."
    assert result.refused is True
    assert result.citations == []
    assert result.provider == "advisory-local"
    assert result.advisory is True


@pytest.mark.anyio
async def test_tutor_graph_uses_langgraph_execution() -> None:
    result = await run_tutor_graph(
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is onboarding?",
        retrieved_context=["Onboarding introduces the learner to required workflows."],
        citations=[{"chunk_index": 0}],
        provider=AdvisoryProvider(),
    )

    assert result.answer.startswith("Based on the course material")
    assert result.refused is False
    assert result.provider == "advisory-local"
    assert result.advisory is True
