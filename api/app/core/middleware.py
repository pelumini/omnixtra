from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi.responses import JSONResponse
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.auth.dependencies import ACCESS_TOKEN_COOKIE
from app.core.context import clear_request_id, clear_tenant_id, set_request_id, set_tenant_id
from app.core.database import async_session_factory
from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.security import decode_access_token
from app.shared.responses import ErrorBody, ErrorEnvelope, Meta
from app.tenancy.models import Tenant, TenantStatus
from app.tenancy.orm import TENANT_FILTER_BYPASS_OPTION
from app.tenancy.resolver import resolve_tenant_slug

TENANT_RESOLUTION_EXEMPT_ROUTES: frozenset[tuple[str, str]] = frozenset(
    {
        ("POST", "/api/v1/tenants"),
    }
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Bind request tenant context from Host and reject bearer tokens for other tenants."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = set_request_id(request.headers.get("x-request-id"))
        clear_tenant_id()
        try:
            tenant_id = await _resolve_request_tenant_id(request)
            if tenant_id is not None:
                _require_token_tenant_match(request, tenant_id)
                set_tenant_id(str(tenant_id))
            response = await call_next(request)
        except NotFoundError as exc:
            response = _not_found_response(exc)
        except AuthenticationError as exc:
            response = _authentication_response(exc)
        finally:
            clear_tenant_id()
            clear_request_id()
        response.headers["x-request-id"] = request_id
        return response


async def _resolve_request_tenant_id(request: Request) -> UUID | None:
    if (request.method, request.url.path) in TENANT_RESOLUTION_EXEMPT_ROUTES:
        return None

    result = resolve_tenant_slug(
        request.headers.get("host", ""),
        request.app.state.settings.app_base_domain,
    )
    if result.is_reserved:
        msg = "tenant not found"
        raise NotFoundError(msg)
    if result.slug is None:
        return None
    async with async_session_factory() as session:
        tenant = await session.scalar(
            select(Tenant)
            .where(
                Tenant.slug == result.slug,
                Tenant.status == TenantStatus.active.value,
                Tenant.deleted_at.is_(None),
            )
            .execution_options(**{TENANT_FILTER_BYPASS_OPTION: True}),
        )
    if tenant is None:
        msg = "tenant not found"
        raise NotFoundError(msg)
    return tenant.id


def _require_token_tenant_match(request: Request, tenant_id: UUID) -> None:
    authorization = request.headers.get("authorization")
    token = request.cookies.get(ACCESS_TOKEN_COOKIE)
    if authorization is not None and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", maxsplit=1)[1]
    if token is None:
        return
    try:
        payload = decode_access_token(token)
        token_tenant_id = UUID(str(payload["tenant_id"]))
    except (InvalidTokenError, KeyError, ValueError):
        msg = "invalid access token"
        raise AuthenticationError(msg) from None
    if token_tenant_id != tenant_id:
        msg = "invalid access token"
        raise AuthenticationError(msg)


def _authentication_response(exc: AuthenticationError) -> JSONResponse:
    body = ErrorEnvelope(
        data=None,
        error=ErrorBody(type=exc.error_type, message=exc.message, details=[]),
        meta=Meta.current(include_timestamp=True),
    )
    return JSONResponse(status_code=401, content=body.model_dump(mode="json"))


def _not_found_response(exc: NotFoundError) -> JSONResponse:
    body = ErrorEnvelope(
        data=None,
        error=ErrorBody(type=exc.error_type, message=exc.message, details=[]),
        meta=Meta.current(include_timestamp=True),
    )
    return JSONResponse(status_code=404, content=body.model_dump(mode="json"))
