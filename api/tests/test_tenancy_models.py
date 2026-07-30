from app.shared.models import TenantOwnedMixin
from app.tenancy.models import TenancyAuditEvent, Tenant


def test_tenant_model_is_global_table() -> None:
    assert Tenant.__tablename__ == "tenants"
    assert "tenant_id" not in Tenant.__table__.columns


def test_tenant_owned_mixin_defines_tenant_id() -> None:
    assert "tenant_id" in TenantOwnedMixin.__annotations__


def test_tenancy_audit_event_is_tenant_owned() -> None:
    assert TenancyAuditEvent.__tablename__ == "tenancy_audit_events"
    assert issubclass(TenancyAuditEvent, TenantOwnedMixin)
