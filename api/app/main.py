from fastapi import FastAPI

from app.api.router import api_router
from app.auth.routes import router as auth_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.core.observability import configure_observability
from app.shared.responses import Envelope, Meta


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)
    configure_observability(settings)

    application = FastAPI(title=settings.app_name)
    application.add_middleware(RequestContextMiddleware)
    register_exception_handlers(application)
    application.include_router(auth_router, prefix="/api/v1")
    application.include_router(api_router, prefix="/api/v1")

    @application.get("/health", tags=["system"])
    async def health() -> Envelope[dict[str, str]]:
        return Envelope(data={"status": "ok"}, error=None, meta=Meta.current())

    return application


app = create_app()
