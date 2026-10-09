from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import Literal, cast
from urllib.parse import quote, urlsplit
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Invitation, Membership, OrgRole, RefreshSession, User, UserStatus
from app.auth.services import hash_auth_token
from app.billing.services import ensure_admin_capacity
from app.core.config import Settings
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.email import EmailProvider, activation_email
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
    TenantUserCreateRequest,
    TenantUserCreateResponse,
)

OrgRoleValue = Literal["tenant_admin", "member"]


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
        raise ConflictError(
            msg,
            details=[
                {
                    "field": "subdomain",
                    "constraint": "subdomain_taken",
                    "message": "That subdomain is taken. Try another.",
                },
            ],
        )
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
            tenant_id=tenant.id,
            email=str(request.email).strip().lower(),
            full_name=request.full_name,
            password_hash=hash_password(request.password),
            role=OrgRole.member.value,
            status=UserStatus.active.value,
        )
        session.add(user)
        await session.flush()
        membership = Membership(
            tenant_id=tenant.id,
            user_id=user.id,
            org_role=OrgRole.tenant_admin.value,
        )
        session.add(membership)
        await session.flush()
        refresh_token = token_urlsafe(48)
        session.add(
            RefreshSession(
                tenant_id=tenant.id,
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
    membership_rows = list(
        (
            await session.execute(
                select(Membership, User)
                .join(User, User.id == Membership.user_id)
                .where(Membership.deleted_at.is_(None), User.deleted_at.is_(None))
                .order_by(User.email),
            )
        ).all(),
    )
    invitation_rows = list(
        (
            await session.scalars(
                select(Invitation)
                .where(
                    Invitation.used_at.is_(None),
                    Invitation.expires_at > datetime.now(UTC),
                )
                .order_by(Invitation.email),
            )
        ).all(),
    )
    active_emails = {user.email for _, user in membership_rows}
    return [
        MembershipResponse(
            id=str(membership.id),
            user_id=str(membership.user_id),
            org_role=cast("OrgRoleValue", membership.org_role),
            full_name=user.full_name,
            email=user.email,
            status=cast("Literal['active', 'invited']", user.status),
        )
        for membership, user in membership_rows
    ] + [
        MembershipResponse(
            id=str(invitation.id),
            user_id=None,
            org_role=cast("OrgRoleValue", invitation.org_role),
            full_name=None,
            email=invitation.email,
            status="invited",
            invitation_token=invitation.raw_token,
        )
        for invitation in invitation_rows
        if invitation.email not in active_emails
    ]


async def create_user(
    session: AsyncSession,
    request: TenantUserCreateRequest,
    *,
    email_provider: EmailProvider,
    settings: Settings,
    actor_id: UUID | None = None,
) -> TenantUserCreateResponse:
    normalized_email = str(request.email).strip().lower()
    first_name = request.first_name
    last_name = request.last_name
    phone = request.phone
    if request.org_role == OrgRole.tenant_admin.value:
        await ensure_admin_capacity(session)
    existing_user = await session.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        msg = "a user with this email already exists"
        raise ConflictError(msg)
    existing_invitation = await session.scalar(
        select(Invitation).where(Invitation.email == normalized_email)
    )
    if existing_invitation is not None:
        msg = "an activation for this email already exists"
        raise ConflictError(msg)

    user = User(
        tenant_id=UUID(require_tenant_id()),
        email=normalized_email,
        full_name=f"{first_name} {last_name}",
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        password_hash=None,
        role=OrgRole.member.value,
        status=UserStatus.invited.value,
    )
    session.add(user)
    await session.flush()
    session.add(
        Membership(
            tenant_id=user.tenant_id,
            user_id=user.id,
            org_role=request.org_role,
        )
    )
    raw_token = token_urlsafe(32)
    invitation = Invitation(
        tenant_id=user.tenant_id,
        email=normalized_email,
        org_role=request.org_role,
        token_hash=hash_auth_token(raw_token),
        raw_token=None,
        expires_at=datetime.now(UTC) + timedelta(hours=72),
    )
    session.add(invitation)
    await session.flush()
    tenant = await _current_tenant(session)
    activation_link = _activation_link(
        tenant_slug=tenant.slug,
        raw_token=raw_token,
        settings=settings,
    )
    await email_provider.send(
        activation_email(
            to_email=normalized_email,
            first_name=first_name,
            tenant_name=tenant.name,
            activation_link=activation_link,
        )
    )
    session.add(
        TenancyAuditEvent(
            actor_id=actor_id,
            action="tenant.user.provisioned",
            summary=f"Provisioned {request.org_role} user",
            event_data={"email": normalized_email, "org_role": request.org_role},
        ),
    )
    await session.commit()
    return TenantUserCreateResponse(
        id=str(user.id),
        email=normalized_email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        org_role=request.org_role,
        status="invited",
        activation_link=activation_link,
    )


def _activation_link(*, tenant_slug: str, raw_token: str, settings: Settings) -> str:
    is_local = settings.app_env.lower() == "local"
    scheme = "http" if is_local else "https"
    port = urlsplit(settings.web_app_url).port if is_local else None
    host = f"{tenant_slug}.{settings.app_base_domain.strip('.')}"
    authority = f"{host}:{port}" if port is not None else host
    return f"{scheme}://{authority}/join?token={quote(raw_token, safe='')}"


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
    "create_tenant",
    "create_user",
    "get_tenant_branding",
    "list_memberships",
    "tenant_branding_response",
    "update_tenant_branding",
]
