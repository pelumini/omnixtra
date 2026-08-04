from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Invitation, Membership, OrgRole, RefreshSession, User, UserStatus
from app.auth.services import hash_auth_token
from app.billing.services import ensure_admin_capacity
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import create_access_token, hash_password
from app.tenancy.context import require_tenant_id
from app.tenancy.models import TenancyAuditEvent, Tenant, TenantStatus
from app.tenancy.orm import TENANT_FILTER_BYPASS_OPTION
from app.tenancy.schemas import (
    MembershipResponse,
    TenantBrandingResponse,
    TenantBrandingUpdateRequest,
    TenantCreateRequest,
    TenantCreateResponse,
    TenantInvitationCreateRequest,
    TenantInvitationCreateResponse,
)


@dataclass(frozen=True)
class TenantCreationSession:
    response: TenantCreateResponse
    refresh_token: str


async def create_tenant(
    session: AsyncSession,
    request: TenantCreateRequest,
) -> TenantCreationSession:
    existing_tenant = await session.scalar(
        select(Tenant)
        .where(Tenant.slug == request.tenant_slug)
        .execution_options(**{TENANT_FILTER_BYPASS_OPTION: True}),
    )
    if existing_tenant is not None:
        msg = "tenant slug is already taken"
        raise ConflictError(msg)
    tenant = Tenant(
        slug=request.tenant_slug,
        name=request.tenant_name,
        description=request.tenant_description,
        status=TenantStatus.active.value,
        logo_url=str(request.logo_url) if request.logo_url is not None else None,
        primary_color=request.primary_color.lower(),
        locale=request.locale,
        time_zone=request.time_zone,
    )
    session.add(tenant)
    await session.flush()
    set_tenant_id(str(tenant.id))
    try:
        user = User(
            email=str(request.email).strip().lower(),
            full_name=request.full_name,
            password_hash=hash_password(request.password),
            role=OrgRole.member.value,
            status=UserStatus.active.value,
        )
        session.add(user)
        await session.flush()
        membership = Membership(user_id=user.id, org_role=OrgRole.tenant_admin.value)
        session.add(membership)
        await session.flush()
        refresh_token = token_urlsafe(48)
        session.add(
            RefreshSession(
                user_id=user.id,
                token_hash=hash_auth_token(refresh_token),
                expires_at=datetime.now(UTC) + timedelta(days=30),
            ),
        )
        access_token = create_access_token(
            subject=user.id,
            tenant_id=tenant.id,
            role=OrgRole.tenant_admin.value,
        )
        await session.commit()
        return TenantCreationSession(
            response=TenantCreateResponse(
                tenant_id=str(tenant.id),
                tenant_slug=tenant.slug,
                user_id=str(user.id),
                membership_id=str(membership.id),
                access_token=access_token,
            ),
            refresh_token=refresh_token,
        )
    finally:
        clear_tenant_id()


async def list_memberships(session: AsyncSession) -> list[MembershipResponse]:
    memberships = list(
        (
            await session.scalars(
                select(Membership).where(Membership.deleted_at.is_(None)).order_by(Membership.id),
            )
        ).all(),
    )
    return [
        MembershipResponse(
            id=str(membership.id),
            user_id=str(membership.user_id),
            org_role=membership.org_role,
        )
        for membership in memberships
    ]


async def create_invitation(
    session: AsyncSession,
    request: TenantInvitationCreateRequest,
    *,
    actor_id: UUID | None = None,
) -> TenantInvitationCreateResponse:
    normalized_email = str(request.email).strip().lower()
    if request.org_role == OrgRole.tenant_admin.value:
        await ensure_admin_capacity(session)
    existing_user = await session.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        existing_membership = await session.scalar(
            select(Membership).where(Membership.user_id == existing_user.id),
        )
        if existing_membership is not None:
            return TenantInvitationCreateResponse(accepted=True, token=None)
    raw_token = token_urlsafe(32)
    invitation = Invitation(
        email=normalized_email,
        org_role=request.org_role,
        token_hash=hash_auth_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(minutes=15),
    )
    session.add(invitation)
    session.add(
        TenancyAuditEvent(
            actor_id=actor_id,
            action="tenant.user.invited",
            summary=f"Invited {request.org_role} user",
            event_data={"email": normalized_email, "org_role": request.org_role},
        ),
    )
    await session.commit()
    return TenantInvitationCreateResponse(accepted=True, token=raw_token)


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


__all__ = [
    "create_invitation",
    "create_tenant",
    "get_tenant_branding",
    "list_memberships",
    "tenant_branding_response",
    "update_tenant_branding",
]
