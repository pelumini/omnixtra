from uuid import UUID

import pytest

from app.core.context import clear_tenant_id, set_tenant_id
from app.tenancy.models import TenancyAuditEvent, Tenant
from app.tenancy.schemas import TenantBrandingUpdateRequest
from app.tenancy.services import tenant_branding_response, update_tenant_branding

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
ACTOR_ID = UUID("00000000-0000-0000-0000-000000000002")


def test_tenant_branding_response_maps_configurable_fields() -> None:
    tenant = Tenant(
        id=TENANT_ID,
        slug="acme",
        name="Acme Learning",
        logo_url="https://cdn.example/acme.png",
        primary_color="#224466",
        locale="en-GB",
        time_zone="Europe/London",
    )

    response = tenant_branding_response(tenant)

    assert response.tenant_name == "Acme Learning"
    assert response.logo_url == "https://cdn.example/acme.png"
    assert response.primary_color == "#224466"
    assert response.locale == "en-GB"
    assert response.time_zone == "Europe/London"


@pytest.mark.anyio
async def test_update_tenant_branding_writes_audit_event() -> None:
    tenant = Tenant(
        id=TENANT_ID,
        slug="acme",
        name="Acme Learning",
        primary_color="#116149",
        locale="en",
        time_zone="UTC",
    )
    session = _TenantBrandingSession(tenant)
    set_tenant_id(str(TENANT_ID))
    try:
        response = await update_tenant_branding(
            session,
            TenantBrandingUpdateRequest(
                logo_url="https://cdn.example/new.png",
                primary_color="#AABBCC",
                locale="en-GB",
                time_zone="Europe/London",
            ),
            actor_id=ACTOR_ID,
        )
    finally:
        clear_tenant_id()

    assert response.primary_color == "#aabbcc"
    assert tenant.logo_url == "https://cdn.example/new.png"
    assert session.committed is True
    assert len(session.added) == 1
    audit = session.added[0]
    assert isinstance(audit, TenancyAuditEvent)
    assert audit.actor_id == ACTOR_ID
    assert audit.action == "tenant.branding.updated"
    assert audit.event_data["primary_color"] == "#aabbcc"


class _TenantBrandingSession:
    def __init__(self, tenant: Tenant) -> None:
        self.tenant = tenant
        self.added: list[object] = []
        self.committed = False

    async def get(self, _model: object, _identifier: object) -> Tenant:
        return self.tenant

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def commit(self) -> None:
        self.committed = True
