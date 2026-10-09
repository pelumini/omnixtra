from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.cookies import set_auth_cookies
from app.auth.dependencies import (
    AuthPrincipal,
    require_permission,
)
from app.core.database import get_session
from app.core.email import EmailProvider, get_email_provider
from app.shared.responses import Envelope, Meta
from app.tenancy.schemas import (
    MembershipResponse,
    TenantBrandingResponse,
    TenantBrandingUpdateRequest,
    TenantCreateRequest,
    TenantCreateResponse,
    TenantUserCreateRequest,
    TenantUserCreateResponse,
)
from app.tenancy.services import (
    create_tenant,
    create_user,
    get_tenant_branding,
    list_memberships,
    update_tenant_branding,
)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
PrincipalDep = Annotated[AuthPrincipal, Depends(require_permission("tenant:manage"))]
UserManagerDep = Annotated[AuthPrincipal, Depends(require_permission("users:manage"))]
EmailProviderDep = Annotated[EmailProvider, Depends(get_email_provider)]

router = APIRouter(tags=["tenant-owned"])


@router.post("/tenants", tags=["tenants"])
async def create_tenant_route(
    request: TenantCreateRequest,
    session: SessionDep,
    response: Response,
    http_request: Request,
) -> Envelope[TenantCreateResponse]:
    tenant_session = await create_tenant(session, request)
    set_auth_cookies(
        response,
        access_token=tenant_session.response.access_token,
        refresh_token=tenant_session.refresh_token,
        settings=http_request.app.state.settings,
    )
    return Envelope(data=tenant_session.response, error=None, meta=Meta.current())


@router.get("/tenant/branding")
async def get_tenant_branding_route(session: SessionDep) -> Envelope[TenantBrandingResponse]:
    response = await get_tenant_branding(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.patch("/tenant/branding")
async def update_tenant_branding_route(
    request: TenantBrandingUpdateRequest,
    session: SessionDep,
    principal: PrincipalDep,
) -> Envelope[TenantBrandingResponse]:
    response = await update_tenant_branding(session, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/tenant/memberships")
async def list_memberships_route(
    session: SessionDep,
    _principal: UserManagerDep,
) -> Envelope[list[MembershipResponse]]:
    response = await list_memberships(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/tenant/users")
async def create_user_route(
    request: TenantUserCreateRequest,
    session: SessionDep,
    principal: UserManagerDep,
    email_provider: EmailProviderDep,
    http_request: Request,
) -> Envelope[TenantUserCreateResponse]:
    response = await create_user(
        session,
        request,
        actor_id=principal.user_id,
        email_provider=email_provider,
        settings=http_request.app.state.settings,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


__all__ = ["router"]
