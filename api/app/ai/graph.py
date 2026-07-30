from dataclasses import dataclass
from uuid import UUID

from app.ai.guardrails import should_refuse_question


@dataclass(frozen=True)
class TutorGraphResult:
    answer: str
    citations: list[dict[str, object]]
    refused: bool


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
