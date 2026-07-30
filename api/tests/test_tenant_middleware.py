import asyncio
from types import SimpleNamespace
from typing import Self
from uuid import UUID

import pytest
from starlette.requests import Request
from starlette.responses import Response

from app.core.context import get_tenant_id
from app.core.exceptions import NotFoundError
from app.core.middleware import RequestContextMiddleware, _resolve_request_tenant_id
from app.tenancy.models import Tenant, TenantStatus


def test_valid_tenant_subdomain_sets_context(monkeypatch: pytest.MonkeyPatch) -> None:
    tenant_id = UUID("00000000-0000-0000-0000-000000000001")
    _patch_tenant_lookup(monkeypatch, _tenant(tenant_id, status=TenantStatus.active.value))
    middleware = RequestContextMiddleware(app=_noop_app)
    request = _request("acme.localhost")
    observed_context: list[str | None] = []

    async def call_next(_request: Request) -> Response:
        observed_context.append(get_tenant_id())
        return Response()

    response = asyncio.run(middleware.dispatch(request, call_next))

    assert response.status_code == 200
    assert observed_context == [str(tenant_id)]
    assert get_tenant_id() is None


def test_reserved_subdomain_returns_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_tenant_lookup(monkeypatch, None)

    with pytest.raises(NotFoundError):
        asyncio.run(_resolve_request_tenant_id(_request("api.localhost")))


def test_unknown_tenant_returns_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_tenant_lookup(monkeypatch, None)

    with pytest.raises(NotFoundError):
        asyncio.run(_resolve_request_tenant_id(_request("missing.localhost")))


def test_soft_deleted_tenant_returns_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_tenant_lookup(monkeypatch, None)

    with pytest.raises(NotFoundError):
        asyncio.run(_resolve_request_tenant_id(_request("deleted.localhost")))


def test_root_domain_does_not_bind_tenant(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_tenant_lookup(monkeypatch, None)

    assert asyncio.run(_resolve_request_tenant_id(_request("localhost"))) is None


def _request(host: str) -> Request:
    app = SimpleNamespace(
        state=SimpleNamespace(settings=SimpleNamespace(app_base_domain="localhost")),
    )
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/auth/login",
            "headers": [(b"host", host.encode())],
            "app": app,
        },
    )


def _tenant(tenant_id: UUID, *, status: str) -> Tenant:
    return Tenant(id=tenant_id, slug="acme", name="Acme", status=status)


def _patch_tenant_lookup(monkeypatch: pytest.MonkeyPatch, tenant: Tenant | None) -> None:
    class FakeSession:
        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *_exc: object) -> None:
            return None

        async def scalar(self, _statement: object) -> Tenant | None:
            return tenant

    monkeypatch.setattr("app.core.middleware.async_session_factory", FakeSession)


async def _noop_app(_scope: object, _receive: object, _send: object) -> None:
    return None
