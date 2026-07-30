from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.auth.models import UserRole
from app.auth.rbac import has_permission
from app.core.context import set_tenant_id
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def require_permission(
    permission: str,
) -> Callable[[HTTPAuthorizationCredentials | None], None]:
    def dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    ) -> None:
        if credentials is None:
            msg = "authentication required"
            raise AuthenticationError(msg)
        try:
            payload = decode_access_token(credentials.credentials)
            tenant_id = UUID(str(payload["tenant_id"]))
            role = UserRole(str(payload["role"]))
        except (InvalidTokenError, KeyError, ValueError):
            msg = "invalid access token"
            raise AuthenticationError(msg) from None
        if not has_permission(role, permission):
            msg = "permission denied"
            raise AuthorizationError(msg)
        set_tenant_id(str(tenant_id))

    return dependency


__all__ = ["require_permission"]
