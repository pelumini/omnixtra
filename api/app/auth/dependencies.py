from collections.abc import Callable
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.auth.models import UserRole
from app.auth.rbac import has_permission
from app.core.context import set_tenant_id
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)
ACCESS_TOKEN_COOKIE = "__Host-omnixtra_access"  # noqa: S105
REFRESH_TOKEN_COOKIE = "__Host-omnixtra_refresh"  # noqa: S105


@dataclass(frozen=True)
class AuthPrincipal:
    user_id: UUID
    tenant_id: UUID
    role: UserRole


def require_permission(
    permission: str,
) -> Callable[[Request, HTTPAuthorizationCredentials | None], AuthPrincipal]:
    def dependency(
        request: Request,
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
            role = UserRole(str(payload["role"]))
        except (InvalidTokenError, KeyError, ValueError):
            msg = "invalid access token"
            raise AuthenticationError(msg) from None
        if not has_permission(role, permission):
            msg = "permission denied"
            raise AuthorizationError(msg)
        set_tenant_id(str(tenant_id))
        return AuthPrincipal(user_id=user_id, tenant_id=tenant_id, role=role)

    return dependency


__all__ = ["ACCESS_TOKEN_COOKIE", "REFRESH_TOKEN_COOKIE", "AuthPrincipal", "require_permission"]
