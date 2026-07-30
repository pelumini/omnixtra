from typing import Protocol

from sqlalchemy import Engine, event

from app.core.context import get_tenant_id

TENANT_SESSION_VARIABLE = "app.current_tenant_id"


class Cursor(Protocol):
    def execute(self, operation: str, parameters: tuple[str, ...]) -> object: ...


def apply_tenant_session_variable(cursor: Cursor) -> None:
    tenant_id = get_tenant_id() or ""
    cursor.execute(
        "SELECT set_config('app.current_tenant_id', %s, true)",
        (tenant_id,),
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
