from uuid import UUID

import pytest
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request

from app.auth.dependencies import ACCESS_TOKEN_COOKIE, require_permission
from app.auth.models import Membership
from app.core.context import clear_tenant_id
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import create_access_token
from app.tenancy.context import require_tenant_id

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TENANT_ID = UUID("00000000-0000-0000-0000-000000000002")


@pytest.mark.anyio
async def test_permission_dependency_accepts_authorized_role() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="tenant_admin")

    try:
        principal = await dependency(
            _request(),
            _session("tenant_admin"),
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
        )

        assert require_tenant_id() == str(TENANT_ID)
        assert principal.user_id == USER_ID
        assert principal.tenant_id == TENANT_ID
    finally:
        clear_tenant_id()


@pytest.mark.anyio
async def test_permission_dependency_rejects_member_without_org_permission() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="member")

    with pytest.raises(AuthorizationError):
        await dependency(
            _request(),
            _session("member"),
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
        )


@pytest.mark.anyio
async def test_permission_dependency_requires_membership() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="tenant_admin")

    with pytest.raises(AuthenticationError):
        await dependency(
            _request(),
            _session(None),
            HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
        )


@pytest.mark.anyio
async def test_permission_dependency_accepts_access_cookie() -> None:
    dependency = require_permission("courses:manage")
    token = create_access_token(subject=USER_ID, tenant_id=TENANT_ID, role="tenant_admin")

    try:
        principal = await dependency(
            _request(cookie=f"{ACCESS_TOKEN_COOKIE}={token}"),
            _session("tenant_admin"),
            None,
        )

        assert principal.user_id == USER_ID
        assert principal.tenant_id == TENANT_ID
    finally:
        clear_tenant_id()


@pytest.mark.anyio
async def test_permission_dependency_requires_credentials() -> None:
    dependency = require_permission("courses:manage")

    with pytest.raises(AuthenticationError):
        await dependency(_request(), _session("tenant_admin"), None)


class _Session:
    def __init__(self, org_role: str | None) -> None:
        self.org_role = org_role

    async def scalar(self, _statement: object) -> Membership | None:
        if self.org_role is None:
            return None
        membership = Membership(user_id=USER_ID, org_role=self.org_role)
        membership.tenant_id = TENANT_ID
        return membership


def _session(org_role: str | None) -> _Session:
    return _Session(org_role)


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
