from dataclasses import dataclass
from typing import Protocol, TypedDict, cast
from uuid import UUID

from langgraph.graph import END, START, StateGraph

from app.ai.guardrails import should_refuse_question
from app.ai.provider_selection import (
    ADVISORY_PROVIDER_NAME,
    is_advisory_provider,
    select_tutor_provider,
)
from app.ai.providers import TutorProvider


@dataclass(frozen=True)
class TutorGraphResult:
    answer: str
    citations: list[dict[str, object]]
    refused: bool
    provider: str
    advisory: bool


class TutorGraphState(TypedDict):
    tenant_id: UUID
    course_id: UUID
    question: str
    retrieved_context: list[str]
    citations: list[dict[str, object]]
    answer: str
    refused: bool
    provider: TutorProvider
    provider_name: str
    advisory: bool


class TutorGraphApp(Protocol):
    async def ainvoke(
        self,
        input: TutorGraphState,  # noqa: A002
        config: dict[str, dict[str, str]],
    ) -> TutorGraphState: ...


def build_tutor_graph() -> TutorGraphApp:
    workflow = StateGraph(TutorGraphState)
    workflow.add_node("validate_scope", _validate_scope)
    workflow.add_node("answer", _answer)
    workflow.add_edge(START, "validate_scope")
    workflow.add_edge("validate_scope", "answer")
    workflow.add_edge("answer", END)
    return cast("TutorGraphApp", workflow.compile())


async def run_tutor_graph(  # noqa: PLR0913
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    retrieved_context: list[str],
    citations: list[dict[str, object]],
    provider: TutorProvider | None = None,
) -> TutorGraphResult:
    selected_provider = provider or select_tutor_provider()
    app = build_tutor_graph()
    state = await app.ainvoke(
        {
            "tenant_id": tenant_id,
            "course_id": course_id,
            "question": question,
            "retrieved_context": retrieved_context,
            "citations": citations,
            "answer": "",
            "refused": False,
            "provider": selected_provider,
            "provider_name": selected_provider.name,
            "advisory": is_advisory_provider(selected_provider),
        },
        config={"configurable": {"thread_id": f"{tenant_id}:{course_id}"}},
    )
    return TutorGraphResult(
        answer=state["answer"],
        citations=state["citations"],
        refused=state["refused"],
        provider=state["provider_name"],
        advisory=state["advisory"],
    )


def _validate_scope(state: TutorGraphState) -> TutorGraphState:
    refusal = should_refuse_question(state["question"])
    if refusal is None and not state["retrieved_context"]:
        refusal = "I could not find that in this course."
    if refusal is None:
        return state
    return {
        **state,
        "answer": refusal,
        "citations": [],
        "refused": True,
        "provider_name": ADVISORY_PROVIDER_NAME,
        "advisory": True,
    }


async def _answer(state: TutorGraphState) -> TutorGraphState:
    if state["refused"]:
        return state
    answer = await state["provider"].answer(
        question=state["question"],
        context=state["retrieved_context"],
    )
    return {
        **state,
        "answer": answer,
        "refused": False,
        "provider_name": state["provider"].name,
        "advisory": is_advisory_provider(state["provider"]),
    }


__all__ = [
    "TutorGraphResult",
    "build_tutor_graph",
    "run_tutor_graph",
]
