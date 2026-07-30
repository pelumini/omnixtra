from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.context import clear_request_id, clear_tenant_id, set_request_id


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = set_request_id(request.headers.get("x-request-id"))
        clear_tenant_id()
        try:
            response = await call_next(request)
        finally:
            clear_tenant_id()
            clear_request_id()
        response.headers["x-request-id"] = request_id
        return response
