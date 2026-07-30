from typing import Protocol
from uuid import UUID

from sqlalchemy import Engine, event

from app.core.context import get_tenant_id

TENANT_SESSION_VARIABLE = "app.current_tenant_id"


class Cursor(Protocol):
    def execute(self, operation: str, parameters: tuple[str, ...]) -> object: ...


def apply_tenant_session_variable(cursor: Cursor) -> None:
    tenant_id = _validated_tenant_id()
    cursor.execute(
        f"SELECT set_config('{TENANT_SESSION_VARIABLE}', '{tenant_id}', true)",
        (),
    )


def register_rls_session_variable_hook(engine: Engine) -> None:
    event.listen(engine, "before_cursor_execute", _set_tenant_before_cursor_execute)


def _set_tenant_before_cursor_execute(
    _conn: object,
    cursor: Cursor,
    _statement: str,
    _parameters: object,
    _context: object,
    _executemany: object,
) -> None:
    apply_tenant_session_variable(cursor)


def _validated_tenant_id() -> str:
    tenant_id = get_tenant_id()
    if tenant_id is None or tenant_id == "":
        return ""
    return str(UUID(tenant_id))
