from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthPrincipal, require_permission
from app.core.database import get_session
from app.shared.responses import Envelope, Meta
from app.tenancy.schemas import TenantBrandingResponse, TenantBrandingUpdateRequest
from app.tenancy.services import get_tenant_branding, update_tenant_branding

SessionDep = Annotated[AsyncSession, Depends(get_session)]
PrincipalDep = Annotated[AuthPrincipal, Depends(require_permission("tenant:manage"))]

router = APIRouter(prefix="/tenant", tags=["tenant-owned"])


@router.get("/branding")
async def get_tenant_branding_route(session: SessionDep) -> Envelope[TenantBrandingResponse]:
    response = await get_tenant_branding(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/branding")
async def update_tenant_branding_route(
    request: TenantBrandingUpdateRequest,
    session: SessionDep,
    principal: PrincipalDep,
) -> Envelope[TenantBrandingResponse]:
    response = await update_tenant_branding(session, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


__all__ = ["router"]
