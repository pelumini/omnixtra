from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthToken, AuthTokenPurpose, User, UserStatus
from app.auth.rbac import DEFAULT_SIGNUP_ROLE
from app.auth.schemas import AuthenticatedUser, AuthResponse, SignupRequest
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import create_access_token, hash_password, verify_password
from app.tenancy.models import Tenant, TenantStatus
from app.tenancy.orm import TENANT_FILTER_BYPASS_OPTION


@dataclass(frozen=True)
class IssuedAuthToken:
    raw_token: str
    token_hash: str


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


def hash_auth_token(raw_token: str) -> str:
    return sha256(raw_token.encode("utf-8")).hexdigest()


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
