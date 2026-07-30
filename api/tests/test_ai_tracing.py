from app.ai.tracing import traced_tutor_graph


async def _sample_graph() -> str:
    return "ok"


def test_traced_tutor_graph_wraps_callable() -> None:
    wrapped = traced_tutor_graph(_sample_graph)

    assert wrapped is not _sample_graph
