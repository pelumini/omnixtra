from collections.abc import Awaitable, Callable
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.context import clear_request_id, clear_tenant_id, set_request_id, set_tenant_id
from app.core.database import async_session_factory
from app.core.exceptions import NotFoundError
from app.shared.responses import ErrorBody, ErrorEnvelope, Meta
from app.tenancy.models import Tenant, TenantStatus
from app.tenancy.resolver import resolve_tenant_slug


class RequestContextMiddleware(BaseHTTPMiddleware):
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
                set_tenant_id(str(tenant_id))
            response = await call_next(request)
        except NotFoundError as exc:
            response = _not_found_response(exc)
        finally:
            clear_tenant_id()
            clear_request_id()
        response.headers["x-request-id"] = request_id
        return response


async def _resolve_request_tenant_id(request: Request) -> UUID | None:
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
            select(Tenant).where(
                Tenant.slug == result.slug,
                Tenant.status == TenantStatus.active.value,
                Tenant.deleted_at.is_(None),
            ),
        )
    if tenant is None:
        msg = "tenant not found"
        raise NotFoundError(msg)
    return tenant.id


def _not_found_response(exc: NotFoundError) -> JSONResponse:
    body = ErrorEnvelope(
        data=None,
        error=ErrorBody(type=exc.error_type, message=exc.message, details=[]),
        meta=Meta.current(include_timestamp=True),
    )
    return JSONResponse(status_code=404, content=body.model_dump(mode="json"))
