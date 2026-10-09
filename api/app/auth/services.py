from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from typing import Literal, cast
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import (
    AuthToken,
    AuthTokenPurpose,
    Invitation,
    Membership,
    OrgRole,
    RefreshSession,
    User,
    UserStatus,
)
from app.auth.schemas import (
    AuthenticatedUser,
    AuthResponse,
    InvitationAcceptRequest,
    InvitationPreviewResponse,
    SessionMembership,
    SessionResponse,
    SessionUser,
)
from app.billing.services import ensure_admin_activation_capacity
from app.core.exceptions import AuthenticationError, NotFoundError, ValidationAppError
from app.core.security import create_access_token, hash_password, verify_password
from app.tenancy.models import Tenant


@dataclass(frozen=True)
class IssuedAuthToken:
    raw_token: str
    token_hash: str


@dataclass(frozen=True)
class AuthSession:
    response: AuthResponse
    refresh_token: str


SessionOrgRole = Literal["tenant_admin", "member"]


async def login(session: AsyncSession, tenant_id: UUID, email: str, password: str) -> AuthResponse:
    user = await session.scalar(select(User).where(User.email == _normalize_email(email)))
    if (
        user is None
        or user.password_hash is None
        or not verify_password(password, user.password_hash)
    ):
        msg = "invalid email or password"
        raise AuthenticationError(msg)
    if user.status != UserStatus.active.value or user.tenant_id != tenant_id:
        msg = "invalid email or password"
        raise AuthenticationError(msg)
    return await _auth_response(session, user)


async def login_with_session(
    session: AsyncSession,
    tenant_id: UUID,
    email: str,
    password: str,
) -> AuthSession:
    response = await login(session, tenant_id, email, password)
    refresh_token = await _create_refresh_session(
        session,
        tenant_id=tenant_id,
        user_id=UUID(response.user.id),
    )
    return AuthSession(response=response, refresh_token=refresh_token)


async def issue_auth_token(
    session: AsyncSession,
    tenant_id: UUID,
    email: str,
    purpose: AuthTokenPurpose,
) -> IssuedAuthToken:
    raw_token = token_urlsafe(32)
    token_hash = hash_auth_token(raw_token)
    normalized_email = _normalize_email(email)
    user = await session.scalar(select(User).where(User.email == normalized_email))
    token = AuthToken(
        tenant_id=tenant_id,
        user_id=user.id if user is not None else None,
        email=normalized_email,
        token_hash=token_hash,
        purpose=purpose.value,
        expires_at=datetime.now(UTC) + timedelta(minutes=15),
    )
    session.add(token)
    await session.commit()
    return IssuedAuthToken(raw_token=raw_token, token_hash=token_hash)


async def accept_invitation(
    session: AsyncSession,
    tenant_id: UUID,
    request: InvitationAcceptRequest,
) -> AuthSession:
    invitation = await _consume_invitation(
        session,
        tenant_id=tenant_id,
        raw_token=request.token,
        email=str(request.email),
    )
    user = await session.scalar(
        select(User).where(
            User.tenant_id == tenant_id,
            User.email == _normalize_email(request.email),
            User.status == UserStatus.invited.value,
            User.password_hash.is_(None),
        ),
    )
    if user is None:
        msg = "pending user not found"
        raise AuthenticationError(msg)
    membership = await session.scalar(
        select(Membership).where(
            Membership.tenant_id == tenant_id,
            Membership.user_id == user.id,
            Membership.deleted_at.is_(None),
        )
    )
    if membership is None or membership.org_role != invitation.org_role:
        msg = "pending membership not found"
        raise AuthenticationError(msg)
    if membership.org_role == OrgRole.tenant_admin.value:
        await ensure_admin_activation_capacity(session)

    user.password_hash = hash_password(request.password)
    user.status = UserStatus.active.value
    response = await _auth_response(session, user)
    refresh_token = await _create_refresh_session(
        session,
        tenant_id=tenant_id,
        user_id=user.id,
        commit=False,
    )
    await session.commit()
    return AuthSession(response=response, refresh_token=refresh_token)


async def preview_invitation(
    session: AsyncSession,
    tenant_id: UUID,
    raw_token: str,
) -> InvitationPreviewResponse | None:
    invitation = await session.scalar(
        select(Invitation).where(
            Invitation.tenant_id == tenant_id,
            Invitation.token_hash == hash_auth_token(raw_token),
        ),
    )
    now = datetime.now(UTC)
    if invitation is None or invitation.expires_at <= now or invitation.used_at is not None:
        return None

    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        return None
    user = await session.scalar(
        select(User).where(
            User.tenant_id == tenant_id,
            User.email == invitation.email,
            User.status == UserStatus.invited.value,
        )
    )
    if user is None or user.first_name is None or user.last_name is None:
        return None

    return InvitationPreviewResponse(
        organization_name=tenant.name,
        email=invitation.email,
        first_name=user.first_name,
        last_name=user.last_name,
    )


async def verify_magic_link(
    session: AsyncSession,
    tenant_id: UUID,
    raw_token: str,
) -> AuthSession:
    auth_token = await _consume_auth_token(
        session,
        tenant_id=tenant_id,
        raw_token=raw_token,
        purpose=AuthTokenPurpose.magic_link,
    )
    if auth_token.user_id is None:
        msg = "invalid or expired token"
        raise AuthenticationError(msg)
    user = await _active_user(session, auth_token.user_id)
    response = await _auth_response(session, user)
    refresh_token = await _create_refresh_session(
        session,
        tenant_id=tenant_id,
        user_id=user.id,
        commit=False,
    )
    await session.commit()
    return AuthSession(response=response, refresh_token=refresh_token)


async def complete_password_reset(
    session: AsyncSession,
    tenant_id: UUID,
    raw_token: str,
    password: str,
) -> AuthSession:
    auth_token = await _consume_auth_token(
        session,
        tenant_id=tenant_id,
        raw_token=raw_token,
        purpose=AuthTokenPurpose.password_reset,
    )
    if auth_token.user_id is None:
        msg = "invalid or expired token"
        raise AuthenticationError(msg)
    user = await _active_user(session, auth_token.user_id)
    user.password_hash = hash_password(password)
    await _revoke_user_refresh_sessions(session, tenant_id=tenant_id, user_id=user.id)
    response = await _auth_response(session, user)
    refresh_token = await _create_refresh_session(
        session,
        tenant_id=tenant_id,
        user_id=user.id,
        commit=False,
    )
    await session.commit()
    return AuthSession(response=response, refresh_token=refresh_token)


async def refresh_auth_session(
    session: AsyncSession,
    tenant_id: UUID,
    raw_refresh_token: str,
) -> AuthSession:
    now = datetime.now(UTC)
    token_hash = hash_auth_token(raw_refresh_token)
    refresh_session = await session.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash),
    )
    if refresh_session is None:
        msg = "invalid refresh token"
        raise AuthenticationError(msg)
    if refresh_session.tenant_id != tenant_id:
        msg = "invalid refresh token"
        raise AuthenticationError(msg)
    if (
        refresh_session.revoked_at is not None
        or refresh_session.replaced_by_id is not None
        or refresh_session.expires_at <= now
    ):
        await _revoke_user_refresh_sessions(
            session,
            tenant_id=tenant_id,
            user_id=refresh_session.user_id,
        )
        await session.commit()
        msg = "invalid refresh token"
        raise AuthenticationError(msg)
    user = await _active_user(session, refresh_session.user_id)
    response = await _auth_response(session, user)
    replacement_raw = token_urlsafe(48)
    replacement = RefreshSession(
        tenant_id=tenant_id,
        user_id=user.id,
        token_hash=hash_auth_token(replacement_raw),
        expires_at=now + timedelta(days=30),
    )
    session.add(replacement)
    await session.flush()
    refresh_session.replaced_by_id = replacement.id
    refresh_session.revoked_at = now
    await session.commit()
    return AuthSession(response=response, refresh_token=replacement_raw)


async def logout_refresh_session(
    session: AsyncSession,
    tenant_id: UUID,
    raw_refresh_token: str | None,
) -> None:
    if raw_refresh_token is None:
        return
    refresh_session = await session.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == hash_auth_token(raw_refresh_token)
        ),
    )
    if refresh_session is None or refresh_session.tenant_id != tenant_id:
        return
    refresh_session.revoked_at = datetime.now(UTC)
    await session.commit()


async def get_auth_session(
    session: AsyncSession,
    *,
    user_id: UUID,
    tenant_id: UUID,
) -> SessionResponse:
    user = await _active_user(session, user_id)
    if user.tenant_id != tenant_id:
        msg = "invalid access token"
        raise AuthenticationError(msg)
    membership = await session.scalar(
        select(Membership).where(
            Membership.tenant_id == tenant_id,
            Membership.user_id == user.id,
            Membership.deleted_at.is_(None),
        ),
    )
    return SessionResponse(
        user=SessionUser(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
        ),
        membership=(
            None
            if membership is None
            else SessionMembership(
                tenant_id=str(membership.tenant_id),
                org_role=cast("SessionOrgRole", membership.org_role),
            )
        ),
    )


def hash_auth_token(raw_token: str) -> str:
    return sha256(raw_token.encode("utf-8")).hexdigest()


async def _consume_auth_token(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    raw_token: str,
    purpose: AuthTokenPurpose,
) -> AuthToken:
    auth_token = await session.scalar(
        select(AuthToken).where(
            AuthToken.token_hash == hash_auth_token(raw_token),
            AuthToken.purpose == purpose.value,
        ),
    )
    now = datetime.now(UTC)
    if auth_token is None or auth_token.tenant_id != tenant_id:
        msg = "invalid or expired token"
        raise AuthenticationError(msg)
    if auth_token.used_at is not None:
        msg = "token has already been used"
        raise ValidationAppError(msg)
    if auth_token.expires_at <= now:
        msg = "invalid or expired token"
        raise AuthenticationError(msg)
    auth_token.used_at = now
    return auth_token


async def _active_user(session: AsyncSession, user_id: UUID) -> User:
    user = await session.get(User, user_id)
    if user is None or user.status != UserStatus.active.value:
        msg = "invalid or expired token"
        raise AuthenticationError(msg)
    return user


async def _create_refresh_session(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    user_id: UUID,
    commit: bool = True,
) -> str:
    raw_token = token_urlsafe(48)
    refresh_session = RefreshSession(
        tenant_id=tenant_id,
        user_id=user_id,
        token_hash=hash_auth_token(raw_token),
        expires_at=datetime.now(UTC) + timedelta(days=30),
    )
    session.add(refresh_session)
    if commit:
        await session.commit()
    else:
        await session.flush()
    return raw_token


async def _revoke_user_refresh_sessions(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    user_id: UUID,
) -> None:
    now = datetime.now(UTC)
    sessions = await session.scalars(
        select(RefreshSession).where(
            RefreshSession.tenant_id == tenant_id,
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        ),
    )
    for refresh_session in sessions:
        refresh_session.revoked_at = now


async def _consume_invitation(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    raw_token: str,
    email: str,
) -> Invitation:
    invitation = await session.scalar(
        select(Invitation).where(Invitation.token_hash == hash_auth_token(raw_token)),
    )
    now = datetime.now(UTC)
    if invitation is None:
        msg = "invitation not found"
        raise NotFoundError(msg)
    if invitation.email != _normalize_email(email) or invitation.expires_at <= now:
        msg = "invalid or expired invitation"
        raise AuthenticationError(msg)
    if invitation.tenant_id != tenant_id:
        msg = "invitation not found"
        raise NotFoundError(msg)
    if invitation.used_at is not None:
        msg = "invitation has already been used"
        raise ValidationAppError(msg)
    invitation.used_at = now
    return invitation


async def _auth_response(session: AsyncSession, user: User) -> AuthResponse:
    membership = await session.scalar(select(Membership).where(Membership.user_id == user.id))
    if membership is None:
        msg = "membership required"
        raise AuthenticationError(msg)
    access_token = create_access_token(
        subject=user.id,
        tenant_id=user.tenant_id,
        role=membership.org_role,
    )
    return AuthResponse(
        access_token=access_token,
        user=AuthenticatedUser(
            id=str(user.id),
            tenant_id=str(user.tenant_id),
            email=user.email,
            full_name=user.full_name,
            role=membership.org_role,
        ),
    )


def _normalize_email(email: str) -> str:
    return email.strip().lower()
