import importlib.util
import inspect
import json
from pathlib import Path
from sys import stderr

from app.main import create_app

PROTECTED_ROUTE_TAG = "tenant-owned"
TESTS_DIR = Path("tests")
DEFAULT_HITS_PATH = Path("tests/.isolation_hits.json")


def main() -> int:
    missing = missing_isolation_coverage(TESTS_DIR, hits_path=DEFAULT_HITS_PATH)
    for route in missing:
        stderr.write(f"{route}\n")
    return 1 if missing else 0


def missing_isolation_coverage(
    tests_dir: Path,
    *,
    hits_path: Path | None = None,
) -> list[str]:
    protected_routes = _protected_openapi_routes()
    declared_routes = _declared_routes(tests_dir)
    hit_routes = _hit_routes(hits_path or DEFAULT_HITS_PATH)
    covered_routes = declared_routes & hit_routes
    return [
        f"{method} {path}"
        for method, path in sorted(protected_routes)
        if (method, path) not in covered_routes
    ]


def _protected_openapi_routes() -> set[tuple[str, str]]:
    protected: set[tuple[str, str]] = set()
    for path, methods in create_app().openapi()["paths"].items():
        for method, operation in methods.items():
            tags = operation.get("tags", [])
            if PROTECTED_ROUTE_TAG in tags:
                protected.add((method.upper(), path))
    return protected


def _declared_routes(tests_dir: Path) -> set[tuple[str, str]]:
    covered: set[tuple[str, str]] = set()
    for test_path in sorted(tests_dir.rglob("test_*.py")):
        module = _load_module(test_path)
        for _, member in inspect.getmembers(module):
            coverage: set[tuple[str, str]] = getattr(member, "__covers_isolation__", set())
            covered.update(coverage)
    return covered


def _hit_routes(hits_path: Path) -> set[tuple[str, str]]:
    if not hits_path.exists():
        return set()
    data = json.loads(hits_path.read_text(encoding="utf-8"))
    return {(str(item["method"]).upper(), str(item["path"])) for item in data}


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
