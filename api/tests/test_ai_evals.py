import pytest

from app.ai.evals import EVAL_DATASET, run_tutor_eval, tutor_eval_pass_rate
from app.ai.graph import TutorGraphResult
from app.ai.providers import AdvisoryProvider


def test_eval_dataset_covers_guardrails_and_citations() -> None:
    assert len(EVAL_DATASET) == 20
    assert any(case.expected_refusal for case in EVAL_DATASET)
    assert any(case.expected_citation_count > 0 for case in EVAL_DATASET)


def test_twenty_question_eval_pass_rate_accepts_matching_results() -> None:
    results = [
        (
            case,
            TutorGraphResult(
                answer="AI-generated answer",
                citations=[{"chunk_index": 0}] * case.expected_citation_count,
                refused=case.expected_refusal,
                provider="advisory-local",
                advisory=True,
            ),
        )
        for case in EVAL_DATASET
    ]

    assert tutor_eval_pass_rate(results) == 1.0


@pytest.mark.anyio
async def test_tutor_eval_summary_records_provider_and_advisory_mode() -> None:
    summary = await run_tutor_eval(provider=AdvisoryProvider())

    assert summary.provider == "advisory-local"
    assert summary.advisory is True
    assert summary.total == 20
    assert summary.failed == 0
    assert summary.errors == []
    assert summary.pass_rate == 1.0


@pytest.mark.anyio
async def test_tutor_eval_summary_counts_provider_errors_as_failures() -> None:
    class FailingProvider:
        name = "openai"

        async def answer(self, *, question: str, context: list[str]) -> str:
            _ = (question, context)
            msg = "provider unavailable"
            raise RuntimeError(msg)

    summary = await run_tutor_eval(provider=FailingProvider())

    assert summary.provider == "openai"
    assert summary.advisory is False
    assert summary.total == 20
    assert summary.failed > 0
    assert summary.pass_rate < 1.0
    assert summary.errors[0]["error_type"] == "RuntimeError"
