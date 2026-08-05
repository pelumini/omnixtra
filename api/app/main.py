from fastapi import FastAPI

from app.admin.routes import router as admin_router
from app.ai.routes import router as ai_router
from app.api.router import api_router
from app.auth.routes import router as auth_router
from app.billing.routes import router as billing_router
from app.billing.routes import webhook_router as billing_webhook_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.core.observability import configure_observability
from app.courses.routes import router as courses_router
from app.learning.routes import router as learning_router
from app.shared.responses import Envelope, Meta
from app.tenancy.routes import router as tenancy_router


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)
    configure_observability(settings)

    application = FastAPI(title=settings.app_name)
    application.state.settings = settings
    application.add_middleware(RequestContextMiddleware)
    register_exception_handlers(application)
    application.include_router(auth_router, prefix="/api/v1")
    application.include_router(admin_router, prefix="/api/v1")
    application.include_router(courses_router, prefix="/api/v1")
    application.include_router(learning_router, prefix="/api/v1")
    application.include_router(ai_router, prefix="/api/v1")
    application.include_router(billing_router, prefix="/api/v1")
    application.include_router(billing_webhook_router, prefix="/api/v1")
    application.include_router(tenancy_router, prefix="/api/v1")
    application.include_router(api_router, prefix="/api/v1")

    @application.get("/", include_in_schema=False)
    async def root() -> Envelope[dict[str, str]]:
        return Envelope(
            data={
                "service": settings.app_name,
                "status": "ok",
                "health": "/health",
                "docs": "/docs",
            },
            error=None,
            meta=Meta.current(),
        )

    @application.get("/health", tags=["system"])
    async def health() -> Envelope[dict[str, str]]:
        return Envelope(data={"status": "ok"}, error=None, meta=Meta.current())

    return application


app = create_app()
