from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Membership, OrgRole
from app.auth.rbac import has_permission
from app.core.context import set_tenant_id
from app.core.database import get_session
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)
ACCESS_TOKEN_COOKIE = "omnixtra_access"  # noqa: S105
REFRESH_TOKEN_COOKIE = "omnixtra_refresh"  # noqa: S105


@dataclass(frozen=True)
class AuthPrincipal:
    user_id: UUID
    tenant_id: UUID
    role: OrgRole


@dataclass(frozen=True)
class AuthenticatedPrincipal:
    user_id: UUID
    tenant_id: UUID


async def require_authenticated_principal(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedPrincipal:
    token = (
        credentials.credentials
        if credentials is not None
        else request.cookies.get(ACCESS_TOKEN_COOKIE)
    )
    if token is None:
        msg = "authentication required"
        raise AuthenticationError(msg)
    try:
        payload = decode_access_token(token)
        user_id = UUID(str(payload["sub"]))
        tenant_id = UUID(str(payload["tenant_id"]))
    except (InvalidTokenError, KeyError, ValueError):
        msg = "invalid access token"
        raise AuthenticationError(msg) from None
    set_tenant_id(str(tenant_id))
    return AuthenticatedPrincipal(user_id=user_id, tenant_id=tenant_id)


def require_permission(
    permission: str,
) -> Callable[
    [Request, AsyncSession, HTTPAuthorizationCredentials | None],
    Awaitable[AuthPrincipal],
]:
    async def dependency(
        request: Request,
        session: Annotated[AsyncSession, Depends(get_session)],
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    ) -> AuthPrincipal:
        token = (
            credentials.credentials
            if credentials is not None
            else request.cookies.get(ACCESS_TOKEN_COOKIE)
        )
        if token is None:
            msg = "authentication required"
            raise AuthenticationError(msg)
        try:
            payload = decode_access_token(token)
            user_id = UUID(str(payload["sub"]))
            tenant_id = UUID(str(payload["tenant_id"]))
        except (InvalidTokenError, KeyError, ValueError):
            msg = "invalid access token"
            raise AuthenticationError(msg) from None
        set_tenant_id(str(tenant_id))
        membership = await session.scalar(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.deleted_at.is_(None),
            ),
        )
        if membership is None or membership.tenant_id != tenant_id:
            msg = "membership required"
            raise AuthenticationError(msg)
        role = OrgRole(membership.org_role)
        if not has_permission(role, permission):
            msg = "permission denied"
            raise AuthorizationError(msg)
        return AuthPrincipal(user_id=user_id, tenant_id=tenant_id, role=role)

    return dependency


__all__ = [
    "ACCESS_TOKEN_COOKIE",
    "REFRESH_TOKEN_COOKIE",
    "AuthPrincipal",
    "AuthenticatedPrincipal",
    "require_authenticated_principal",
    "require_permission",
]
