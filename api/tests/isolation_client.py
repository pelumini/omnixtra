import json
import os
from pathlib import Path

from fastapi.testclient import TestClient
from httpx import Response

ISOLATION_HITS_PATH_ENV = "OMNIXTRA_ISOLATION_HITS_PATH"
DEFAULT_ISOLATION_HITS_PATH = Path("tests/.isolation_hits.json")


class IsolationTestClient:
    def __init__(self, client: TestClient) -> None:
        self._client = client

    def get(self, path_template: str, path: str | None = None, **kwargs: object) -> Response:
        return self.request("GET", path_template, path, **kwargs)

    def post(self, path_template: str, path: str | None = None, **kwargs: object) -> Response:
        return self.request("POST", path_template, path, **kwargs)

    def patch(self, path_template: str, path: str | None = None, **kwargs: object) -> Response:
        return self.request("PATCH", path_template, path, **kwargs)

    def put(self, path_template: str, path: str | None = None, **kwargs: object) -> Response:
        return self.request("PUT", path_template, path, **kwargs)

    def delete(self, path_template: str, path: str | None = None, **kwargs: object) -> Response:
        return self.request("DELETE", path_template, path, **kwargs)

    def request(
        self,
        method: str,
        path_template: str,
        path: str | None = None,
        **kwargs: object,
    ) -> Response:
        normalized_method = method.upper()
        _record_hit(normalized_method, path_template)
        return self._client.request(normalized_method, path or path_template, **kwargs)


def clear_isolation_hits() -> None:
    path = isolation_hits_path()
    if path.exists():
        path.unlink()


def isolation_hits_path() -> Path:
    return Path(os.getenv(ISOLATION_HITS_PATH_ENV, str(DEFAULT_ISOLATION_HITS_PATH)))


def _record_hit(method: str, path_template: str) -> None:
    path = isolation_hits_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    existing = _read_hits(path)
    existing.add((method, path_template))
    path.write_text(
        json.dumps(
            [{"method": hit_method, "path": hit_path} for hit_method, hit_path in sorted(existing)],
            indent=2,
        ),
        encoding="utf-8",
    )


def _read_hits(path: Path) -> set[tuple[str, str]]:
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return {(str(item["method"]).upper(), str(item["path"])) for item in data}


__all__ = [
    "DEFAULT_ISOLATION_HITS_PATH",
    "ISOLATION_HITS_PATH_ENV",
    "IsolationTestClient",
    "clear_isolation_hits",
    "isolation_hits_path",
]
