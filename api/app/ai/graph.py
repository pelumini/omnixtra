from dataclasses import dataclass
from typing import Protocol, TypedDict, cast
from uuid import UUID

from langgraph.graph import END, START, StateGraph

from app.ai.guardrails import should_refuse_question


@dataclass(frozen=True)
class TutorGraphResult:
    answer: str
    citations: list[dict[str, object]]
    refused: bool


class TutorGraphState(TypedDict):
    tenant_id: UUID
    course_id: UUID
    question: str
    retrieved_context: list[str]
    citations: list[dict[str, object]]
    answer: str
    refused: bool


class TutorGraphApp(Protocol):
    def invoke(
        self,
        input: TutorGraphState,  # noqa: A002
        config: dict[str, dict[str, str]],
    ) -> TutorGraphState: ...


def run_tutor_graph_skeleton(
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    retrieved_context: list[str],
    citations: list[dict[str, object]],
) -> TutorGraphResult:
    refusal = should_refuse_question(question)
    if refusal is not None:
        return TutorGraphResult(answer=refusal, citations=[], refused=True)
    if not retrieved_context:
        return TutorGraphResult(
            answer="I could not find that in this course.",
            citations=[],
            refused=True,
        )
    return TutorGraphResult(
        answer=(
            f"AI-generated guidance for tenant {tenant_id}, course {course_id}: "
            f"{retrieved_context[0]}"
        ),
        citations=citations,
        refused=False,
    )


def build_tutor_graph() -> TutorGraphApp:
    workflow = StateGraph(TutorGraphState)
    workflow.add_node("validate_scope", _validate_scope)
    workflow.add_node("answer", _answer)
    workflow.add_edge(START, "validate_scope")
    workflow.add_edge("validate_scope", "answer")
    workflow.add_edge("answer", END)
    return cast("TutorGraphApp", workflow.compile())


def run_tutor_graph(
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    retrieved_context: list[str],
    citations: list[dict[str, object]],
) -> TutorGraphResult:
    app = build_tutor_graph()
    state = app.invoke(
        {
            "tenant_id": tenant_id,
            "course_id": course_id,
            "question": question,
            "retrieved_context": retrieved_context,
            "citations": citations,
            "answer": "",
            "refused": False,
        },
        config={"configurable": {"thread_id": f"{tenant_id}:{course_id}"}},
    )
    return TutorGraphResult(
        answer=state["answer"],
        citations=state["citations"],
        refused=state["refused"],
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
    }


def _answer(state: TutorGraphState) -> TutorGraphState:
    if state["refused"]:
        return state
    answer = f"AI-generated guidance based on this course: {state['retrieved_context'][0]}"
    return {
        **state,
        "answer": answer,
        "refused": False,
    }


__all__ = [
    "TutorGraphResult",
    "build_tutor_graph",
    "run_tutor_graph",
    "run_tutor_graph_skeleton",
]
