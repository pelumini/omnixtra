import pytest

from app.core.context import clear_tenant_id, set_tenant_id
from app.tenancy.context import MissingTenantContextError, require_tenant_id


def test_require_tenant_id_returns_bound_tenant() -> None:
    set_tenant_id("tenant_123")

    assert require_tenant_id() == "tenant_123"

    clear_tenant_id()


def test_require_tenant_id_fails_closed_without_context() -> None:
    clear_tenant_id()

    with pytest.raises(MissingTenantContextError, match="tenant context is required"):
        require_tenant_id()
