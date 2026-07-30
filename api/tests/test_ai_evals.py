from app.ai.evals import EVAL_DATASET, cache_hit_rate


def test_eval_dataset_covers_guardrails_and_citations() -> None:
    assert len(EVAL_DATASET) == 20
    assert any(case.expected_refusal for case in EVAL_DATASET)
    assert any(case.expected_citation_count > 0 for case in EVAL_DATASET)


def test_repeat_query_cache_hit_metric_exceeds_sprint_exit_threshold() -> None:
    assert cache_hit_rate(hits=5, misses=5) > 0.4
