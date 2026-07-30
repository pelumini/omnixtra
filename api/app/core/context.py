from contextvars import ContextVar
from uuid import uuid4

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)
_tenant_id: ContextVar[str | None] = ContextVar("tenant_id", default=None)


def set_request_id(value: str | None = None) -> str:
    request_id = value or f"req_{uuid4().hex}"
    _request_id.set(request_id)
    return request_id


def get_request_id() -> str:
    current = _request_id.get()
    if current is None:
        return set_request_id()
    return current


def clear_request_id() -> None:
    _request_id.set(None)


def set_tenant_id(value: str | None) -> None:
    _tenant_id.set(value)


def get_tenant_id() -> str | None:
    return _tenant_id.get()


def clear_tenant_id() -> None:
    _tenant_id.set(None)
