from collections.abc import Awaitable, Callable

from langsmith import traceable


def traced_tutor_graph[ResultT](
    function: Callable[..., Awaitable[ResultT]],
) -> Callable[..., Awaitable[ResultT]]:
    return traceable(
        name="omnixtra_tutor_graph",
        run_type="chain",
        project_name="omnixtra-tutor",
    )(function)


__all__ = ["traced_tutor_graph"]
