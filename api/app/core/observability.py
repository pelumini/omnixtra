import sentry_sdk
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

from app.core.config import Settings


def configure_observability(settings: Settings) -> None:
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.app_env)

    if settings.otel_exporter_otlp_endpoint:
        trace.set_tracer_provider(TracerProvider())
