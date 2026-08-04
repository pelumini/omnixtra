import importlib
from collections.abc import Iterable
from dataclasses import dataclass

import pytest


def test_membership_backfill_maps_legacy_roles_and_stays_tenant_scoped(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    migration = importlib.import_module(
        "migrations.versions.0012_identity_membership_authorization",
    )
    connection = _BackfillConnection(
        tenant_ids=["tenant-a", "tenant-b"],
        users_by_tenant={
            "tenant-a": [
                ("user-a-admin", "org_admin"),
                ("user-a-member", "learner"),
            ],
            "tenant-b": [
                ("user-b-admin", "tenant_admin"),
            ],
        },
    )
    monkeypatch.setattr(migration.op, "get_bind", lambda: connection)

    migration._backfill_memberships()  # noqa: SLF001

    assert connection.inserted_memberships == [
        _InsertedMembership("tenant-a", "user-a-admin", "tenant_admin"),
        _InsertedMembership("tenant-a", "user-a-member", "member"),
        _InsertedMembership("tenant-b", "user-b-admin", "tenant_admin"),
    ]
    assert all(
        membership.user_id.startswith(membership.tenant_id.replace("tenant", "user"))
        for membership in connection.inserted_memberships
    )


@dataclass(frozen=True)
class _InsertedMembership:
    tenant_id: str
    user_id: str
    org_role: str


class _ScalarResult:
    def __init__(self, values: Iterable[str]) -> None:
        self._values = values

    def scalars(self) -> Iterable[str]:
        return self._values


class _BackfillConnection:
    def __init__(
        self,
        *,
        tenant_ids: list[str],
        users_by_tenant: dict[str, list[tuple[str, str]]],
    ) -> None:
        self.tenant_ids = tenant_ids
        self.users_by_tenant = users_by_tenant
        self.current_tenant: str | None = None
        self.inserted_memberships: list[_InsertedMembership] = []

    def execute(
        self,
        statement: object,
        params: dict[str, str] | None = None,
    ) -> _ScalarResult | list[tuple[str, str]] | None:
        sql = str(statement)
        params = params or {}
        if "SELECT id::text FROM tenants" in sql:
            return _ScalarResult(self.tenant_ids)
        if "set_config('app.current_tenant_id'" in sql:
            self.current_tenant = params.get("tenant_id")
            return None
        if "FROM users" in sql:
            tenant_id = params["tenant_id"]
            assert tenant_id == self.current_tenant
            return self.users_by_tenant[tenant_id]
        if "INSERT INTO memberships" in sql:
            tenant_id = params["tenant_id"]
            assert tenant_id == self.current_tenant
            self.inserted_memberships.append(
                _InsertedMembership(
                    tenant_id=tenant_id,
                    user_id=params["user_id"],
                    org_role=params["org_role"],
                ),
            )
            return None
        msg = f"unexpected SQL: {sql}"
        raise AssertionError(msg)
