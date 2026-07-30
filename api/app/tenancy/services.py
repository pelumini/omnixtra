from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.tenancy.context import require_tenant_id
from app.tenancy.models import TenancyAuditEvent, Tenant
from app.tenancy.schemas import TenantBrandingResponse, TenantBrandingUpdateRequest


async def get_tenant_branding(session: AsyncSession) -> TenantBrandingResponse:
    tenant = await _current_tenant(session)
    return tenant_branding_response(tenant)


async def update_tenant_branding(
    session: AsyncSession,
    request: TenantBrandingUpdateRequest,
    *,
    actor_id: UUID | None = None,
) -> TenantBrandingResponse:
    tenant = await _current_tenant(session)
    changes: dict[str, object] = {}
    if "logo_url" in request.model_fields_set:
        tenant.logo_url = str(request.logo_url) if request.logo_url is not None else None
        changes["logo_url"] = tenant.logo_url
    if request.primary_color is not None:
        tenant.primary_color = request.primary_color.lower()
        changes["primary_color"] = tenant.primary_color
    if request.locale is not None:
        tenant.locale = request.locale
        changes["locale"] = tenant.locale
    if request.time_zone is not None:
        tenant.time_zone = request.time_zone
        changes["time_zone"] = tenant.time_zone
    if changes:
        session.add(
            TenancyAuditEvent(
                actor_id=actor_id,
                action="tenant.branding.updated",
                summary="Updated tenant branding settings",
                event_data=changes,
            ),
        )
    await session.commit()
    return tenant_branding_response(tenant)


def tenant_branding_response(tenant: Tenant) -> TenantBrandingResponse:
    return TenantBrandingResponse(
        tenant_name=tenant.name,
        logo_url=tenant.logo_url,
        primary_color=tenant.primary_color,
        locale=tenant.locale,
        time_zone=tenant.time_zone,
    )


async def _current_tenant(session: AsyncSession) -> Tenant:
    tenant = await session.get(Tenant, UUID(require_tenant_id()))
    if tenant is None:
        msg = "tenant not found"
        raise NotFoundError(msg)
    return tenant


__all__ = ["get_tenant_branding", "tenant_branding_response", "update_tenant_branding"]
