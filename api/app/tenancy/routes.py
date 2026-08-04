from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import (
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    AuthPrincipal,
    require_permission,
)
from app.core.database import get_session
from app.shared.responses import Envelope, Meta
from app.tenancy.schemas import (
    MembershipResponse,
    TenantBrandingResponse,
    TenantBrandingUpdateRequest,
    TenantCreateRequest,
    TenantCreateResponse,
    TenantInvitationCreateRequest,
    TenantInvitationCreateResponse,
)
from app.tenancy.services import (
    create_invitation,
    create_tenant,
    get_tenant_branding,
    list_memberships,
    update_tenant_branding,
)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
PrincipalDep = Annotated[AuthPrincipal, Depends(require_permission("tenant:manage"))]
UserManagerDep = Annotated[AuthPrincipal, Depends(require_permission("users:manage"))]

router = APIRouter(tags=["tenant-owned"])


@router.post("/tenants", tags=["tenants"])
async def create_tenant_route(
    request: TenantCreateRequest,
    session: SessionDep,
    response: Response,
) -> Envelope[TenantCreateResponse]:
    tenant_session = await create_tenant(session, request)
    _set_auth_cookies(response, tenant_session.response.access_token, tenant_session.refresh_token)
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


@router.post("/tenant/invitations")
async def create_invitation_route(
    request: TenantInvitationCreateRequest,
    session: SessionDep,
    principal: UserManagerDep,
) -> Envelope[TenantInvitationCreateResponse]:
    response = await create_invitation(session, request, actor_id=principal.user_id)
    return Envelope(data=response, error=None, meta=Meta.current())


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )


__all__ = ["router"]
