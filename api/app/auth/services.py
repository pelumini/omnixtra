from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthToken, AuthTokenPurpose, RefreshSession, User, UserRole, UserStatus
from app.auth.rbac import DEFAULT_SIGNUP_ROLE
from app.auth.schemas import AuthenticatedUser, AuthResponse, InviteUserRequest, SignupRequest
from app.billing.services import ensure_admin_capacity
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import AuthenticationError, ConflictError, ValidationAppError
from app.core.security import create_access_token, hash_password, verify_password
from app.tenancy.models import TenancyAuditEvent, Tenant, TenantStatus
from app.tenancy.orm import TENANT_FILTER_BYPASS_OPTION


@dataclass(frozen=True)
class IssuedAuthToken:
    raw_token: str
    token_hash: str


@dataclass(frozen=True)
class AuthSession:
    response: AuthResponse
    refresh_token: str


async def signup(session: AsyncSession, request: SignupRequest) -> AuthResponse:
    existing_tenant = await session.scalar(
        select(Tenant)
        .where(Tenant.slug == request.tenant_slug)
        .execution_options(**{TENANT_FILTER_BYPASS_OPTION: True}),
    )
    if existing_tenant is not None:
        msg = "tenant slug is already taken"
        raise ConflictError(msg)

    tenant = Tenant(
        id=uuid4(),
        slug=request.tenant_slug,
        name=request.tenant_name,
        status=TenantStatus.active.value,
    )
    session.add(tenant)
    await session.flush()
    set_tenant_id(str(tenant.id))
    try:
        user = User(
            email=_normalize_email(request.email),
            full_name=request.full_name,
            password_hash=hash_password(request.password),
            role=DEFAULT_SIGNUP_ROLE.value,
            status=UserStatus.active.value,
        )
        session.add(user)
        await session.flush()
        await session.commit()
    finally:
        clear_tenant_id()

    return _auth_response(user)


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
    return _auth_response(user)


async def signup_with_session(session: AsyncSession, request: SignupRequest) -> AuthSession:
    response = await signup(session, request)
    tenant_id = UUID(response.user.tenant_id)
    set_tenant_id(str(tenant_id))
    try:
        refresh_token = await _create_refresh_session(
            session,
            tenant_id=tenant_id,
            user_id=UUID(response.user.id),
        )
    finally:
        clear_tenant_id()
    return AuthSession(response=response, refresh_token=refresh_token)


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


async def invite_user(
    session: AsyncSession,
    request: InviteUserRequest,
    *,
    actor_id: UUID | None = None,
) -> IssuedAuthToken:
    normalized_email = _normalize_email(request.email)
    existing_user = await session.scalar(select(User).where(User.email == normalized_email))
    if existing_user is not None:
        msg = "user email is already invited"
        raise ConflictError(msg)
    if request.role == UserRole.org_admin.value:
        await ensure_admin_capacity(session)
    user = User(
        email=normalized_email,
        full_name=request.full_name,
        password_hash=None,
        role=request.role,
        status=UserStatus.invited.value,
    )
    session.add(user)
    await session.flush()
    raw_token = token_urlsafe(32)
    token = AuthToken(
        user_id=user.id,
        email=normalized_email,
        token_hash=hash_auth_token(raw_token),
        purpose=AuthTokenPurpose.magic_link.value,
        expires_at=datetime.now(UTC) + timedelta(minutes=15),
    )
    session.add(token)
    session.add(
        TenancyAuditEvent(
            actor_id=actor_id,
            action="tenant.user.invited",
            summary=f"Invited {request.role} user",
            event_data={"email": normalized_email, "role": request.role},
        ),
    )
    await session.commit()
    return IssuedAuthToken(raw_token=raw_token, token_hash=token.token_hash)


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
    response = _auth_response(user)
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
    response = _auth_response(user)
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
    response = _auth_response(user)
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


def _auth_response(user: User) -> AuthResponse:
    access_token = create_access_token(
        subject=user.id,
        tenant_id=user.tenant_id,
        role=user.role,
    )
    return AuthResponse(
        access_token=access_token,
        user=AuthenticatedUser(
            id=str(user.id),
            tenant_id=str(user.tenant_id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
        ),
    )


def _normalize_email(email: str) -> str:
    return email.strip().lower()
