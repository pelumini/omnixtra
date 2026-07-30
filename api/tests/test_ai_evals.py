from app.ai.evals import EVAL_DATASET


def test_eval_dataset_covers_guardrails_and_citations() -> None:
    assert any(case.expected_refusal for case in EVAL_DATASET)
    assert any(case.expected_citation_count > 0 for case in EVAL_DATASET)
