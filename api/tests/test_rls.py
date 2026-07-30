from pathlib import Path

import pytest

from app.core.context import clear_tenant_id, set_tenant_id
from app.core.rls import TENANT_SESSION_VARIABLE, apply_tenant_session_variable
from app.tenancy.rls import quote_identifier
from scripts.check_rls_migrations import find_missing_rls_helpers


class RecordingCursor:
    def __init__(self) -> None:
        self.operations: list[tuple[str, tuple[str, ...]]] = []

    def execute(self, operation: str, parameters: tuple[str, ...]) -> object:
        self.operations.append((operation, parameters))
        return None


def test_apply_tenant_session_variable_sets_current_tenant() -> None:
    cursor = RecordingCursor()
    set_tenant_id("00000000-0000-0000-0000-000000000001")

    apply_tenant_session_variable(cursor)

    assert cursor.operations == [
        (
            f"SELECT set_config('{TENANT_SESSION_VARIABLE}', %s, true)",
            ("00000000-0000-0000-0000-000000000001",),
        ),
    ]
    clear_tenant_id()


def test_apply_tenant_session_variable_clears_missing_tenant() -> None:
    cursor = RecordingCursor()
    clear_tenant_id()

    apply_tenant_session_variable(cursor)

    assert cursor.operations == [
        (
            f"SELECT set_config('{TENANT_SESSION_VARIABLE}', %s, true)",
            ("",),
        ),
    ]


def test_quote_identifier_rejects_unsafe_identifier() -> None:
    with pytest.raises(ValueError, match="invalid SQL identifier"):
        quote_identifier("tenant_id; drop table tenants")


def test_rls_migration_check_passes_current_migrations() -> None:
    assert find_missing_rls_helpers(Path("migrations/versions")) == []
