from uuid import UUID

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request

from app.auth.dependencies import ACCESS_TOKEN_COOKIE, require_permission
from app.core.context import clear_tenant_id
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import create_access_token
from app.tenancy.context import require_tenant_id

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TENANT_ID = UUID("00000000-0000-0000-0000-000000000002")


def test_permission_dependency_accepts_authorized_role() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="org_admin")

    try:
        principal = dependency(
            _request(), HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        )

        assert require_tenant_id() == str(TENANT_ID)
        assert principal.user_id == USER_ID
        assert principal.tenant_id == TENANT_ID
    finally:
        clear_tenant_id()


def test_permission_dependency_rejects_unauthorized_role() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="learner")

    with pytest.raises(AuthorizationError):
        dependency(_request(), HTTPAuthorizationCredentials(scheme="Bearer", credentials=token))


def test_permission_dependency_accepts_access_cookie() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="org_admin")

    try:
        principal = dependency(_request(cookie=f"{ACCESS_TOKEN_COOKIE}={token}"), None)

        assert principal.user_id == USER_ID
        assert principal.tenant_id == TENANT_ID
    finally:
        clear_tenant_id()


def test_permission_dependency_requires_credentials() -> None:
    dependency = require_permission("courses:manage")

    with pytest.raises(AuthenticationError):
        dependency(_request(), None)


def _request(*, cookie: str | None = None) -> Request:
    headers: list[tuple[bytes, bytes]] = []
    if cookie is not None:
        headers.append((b"cookie", cookie.encode()))
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/courses",
            "headers": headers,
        },
    )
