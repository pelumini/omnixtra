from collections.abc import Callable
from typing import TypeVar

TestFuncT = TypeVar("TestFuncT", bound=Callable[..., object])


def covers_isolation(method: str, path: str) -> Callable[[TestFuncT], TestFuncT]:
    normalized_method = method.upper()

    def decorator(func: TestFuncT) -> TestFuncT:
        coverage: set[tuple[str, str]] = getattr(func, "__covers_isolation__", set())
        coverage.add((normalized_method, path))
        setattr(func, "__covers_isolation__", coverage)  # noqa: B010
        return func

    return decorator
