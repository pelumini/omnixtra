import importlib.util
import inspect
from pathlib import Path
from sys import stderr

from fastapi.routing import APIRoute

from app.main import create_app

PROTECTED_ROUTE_TAG = "tenant-owned"
TESTS_DIR = Path("tests")


def main() -> int:
    missing = missing_isolation_coverage(TESTS_DIR)
    for route in missing:
        stderr.write(f"{route}\n")
    return 1 if missing else 0


def missing_isolation_coverage(tests_dir: Path) -> list[str]:
    protected_routes = _protected_openapi_routes()
    covered_routes = _covered_routes(tests_dir)
    return [
        f"{method} {path}"
        for method, path in sorted(protected_routes)
        if (method, path) not in covered_routes
    ]


def _protected_openapi_routes() -> set[tuple[str, str]]:
    app = create_app()
    protected: set[tuple[str, str]] = set()
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        if PROTECTED_ROUTE_TAG not in route.tags:
            continue
        for method in route.methods or set():
            protected.add((method.upper(), route.path))
    return protected


def _covered_routes(tests_dir: Path) -> set[tuple[str, str]]:
    covered: set[tuple[str, str]] = set()
    for test_path in sorted(tests_dir.glob("test_*.py")):
        module = _load_module(test_path)
        for _, member in inspect.getmembers(module):
            coverage: set[tuple[str, str]] = getattr(member, "__covers_isolation__", set())
            covered.update(coverage)
    return covered


def _load_module(test_path: Path) -> object:
    module_name = f"_isolation_coverage_{test_path.stem}"
    spec = importlib.util.spec_from_file_location(module_name, test_path)
    if spec is None or spec.loader is None:
        msg = f"could not load test module: {test_path}"
        raise RuntimeError(msg)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


if __name__ == "__main__":
    raise SystemExit(main())
