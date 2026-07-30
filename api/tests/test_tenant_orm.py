from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.dialects import postgresql

from app.tenancy.models import Tenant
from app.tenancy.orm import (
    TENANT_FILTER_BYPASS_OPTION,
    _populate_tenant_ids,
    apply_tenant_criteria,
    populate_tenant_id,
)
from app.tenancy.probe import TenantIsolationProbe

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")


def test_tenant_filter_bypass_option_is_grepable() -> None:
    assert TENANT_FILTER_BYPASS_OPTION == "omnixtra_bypass_tenant_filter"


def test_apply_tenant_criteria_filters_tenant_owned_select() -> None:
    statement = apply_tenant_criteria(select(TenantIsolationProbe), TENANT_ID)

    compiled = _compile(statement)

    assert "tenant_isolation_probes.tenant_id =" in compiled


def test_apply_tenant_criteria_does_not_filter_global_select() -> None:
    statement = apply_tenant_criteria(select(Tenant), TENANT_ID)

    compiled = _compile(statement)

    assert "tenant_id" not in compiled


def test_apply_tenant_criteria_filters_tenant_owned_update() -> None:
    statement = apply_tenant_criteria(
        update(TenantIsolationProbe).values(label="Updated"),
        TENANT_ID,
    )

    compiled = _compile(statement)

    assert "WHERE tenant_isolation_probes.tenant_id =" in compiled


def test_apply_tenant_criteria_filters_tenant_owned_delete() -> None:
    statement = apply_tenant_criteria(delete(TenantIsolationProbe), TENANT_ID)

    compiled = _compile(statement)

    assert "WHERE tenant_isolation_probes.tenant_id =" in compiled


def test_populate_tenant_id_sets_missing_tenant_id() -> None:
    probe = TenantIsolationProbe(label="probe")

    populate_tenant_id(probe, TENANT_ID)

    assert probe.tenant_id == TENANT_ID


def test_populate_tenant_id_preserves_explicit_tenant_id() -> None:
    explicit_tenant_id = UUID("00000000-0000-0000-0000-000000000002")
    probe = TenantIsolationProbe(label="probe", tenant_id=explicit_tenant_id)

    populate_tenant_id(probe, TENANT_ID)

    assert probe.tenant_id == explicit_tenant_id


def test_before_flush_allows_global_only_objects_without_tenant_context() -> None:
    class FakeSession:
        def __init__(self) -> None:
            self.new = [Tenant(slug="acme", name="Acme")]

    _populate_tenant_ids(FakeSession(), object(), object())  # type: ignore[arg-type]


def _compile(statement: object) -> str:
    return str(statement.compile(dialect=postgresql.dialect()))
