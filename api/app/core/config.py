from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="local", validation_alias="APP_ENV")
    app_name: str = Field(default="OmniXtra", validation_alias="APP_NAME")
    app_base_domain: str = Field(default="localhost", validation_alias="APP_BASE_DOMAIN")
    origin_secret: str = Field(default="", validation_alias="ORIGIN_SECRET")
    jwt_secret_key: str = Field(
        default="local-dev-secret-change-me-32-bytes-minimum",
        validation_alias="JWT_SECRET_KEY",
    )
    jwt_issuer: str = Field(default="omnixtra-api", validation_alias="JWT_ISSUER")
    access_token_minutes: int = Field(default=15, validation_alias="ACCESS_TOKEN_MINUTES")
    database_url: str = Field(
        default="postgresql+asyncpg://omnixtra_app:omnixtra_app_password@localhost:5432/omnixtra",
        validation_alias="DATABASE_URL",
    )
    migrations_database_url: str = Field(
        default="postgresql+psycopg://omnixtra_migrations:omnixtra_migrations_password@localhost:5432/omnixtra",
        validation_alias="MIGRATIONS_DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    sentry_dsn: str = Field(default="", validation_alias="SENTRY_DSN")
    otel_exporter_otlp_endpoint: str = Field(
        default="",
        validation_alias="OTEL_EXPORTER_OTLP_ENDPOINT",
    )
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", validation_alias="OPENAI_MODEL")
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        validation_alias="OPENAI_EMBEDDING_MODEL",
    )
    ai_provider: str = Field(default="auto", validation_alias="AI_PROVIDER")
    ai_provider_timeout_seconds: float = Field(
        default=30.0,
        validation_alias="AI_PROVIDER_TIMEOUT_SECONDS",
    )
    ai_tutor_requests_per_minute: int = Field(
        default=20,
        validation_alias="AI_TUTOR_REQUESTS_PER_MINUTE",
    )
    ai_monthly_token_budget: int = Field(
        default=100_000,
        validation_alias="AI_MONTHLY_TOKEN_BUDGET",
    )
    ai_monthly_token_warning_percent: int = Field(
        default=80,
        validation_alias="AI_MONTHLY_TOKEN_WARNING_PERCENT",
    )
    ai_tutor_estimated_tokens_per_request: int = Field(
        default=1_500,
        validation_alias="AI_TUTOR_ESTIMATED_TOKENS_PER_REQUEST",
    )
    ai_tutor_feature_token_limit: int = Field(
        default=4_000,
        validation_alias="AI_TUTOR_FEATURE_TOKEN_LIMIT",
    )
    anthropic_api_key: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-3-5-haiku-latest",
        validation_alias="ANTHROPIC_MODEL",
    )
    stripe_secret_key: str = Field(default="", validation_alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(default="", validation_alias="STRIPE_WEBHOOK_SECRET")
    resend_api_key: str = Field(default="", validation_alias="RESEND_API_KEY")
    resend_from_email: str = Field(
        default="OmniXtra <no-reply@omnixtra.local>",
        validation_alias="RESEND_FROM_EMAIL",
    )
    web_app_url: str = Field(default="http://localhost:3000", validation_alias="WEB_APP_URL")
    cors_allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        validation_alias="CORS_ALLOWED_ORIGINS",
    )
    storage_endpoint_url: str = Field(
        default="http://minio:9000", validation_alias="STORAGE_ENDPOINT_URL"
    )
    storage_browser_endpoint_url: str = Field(
        default="", validation_alias="STORAGE_BROWSER_ENDPOINT_URL"
    )
    storage_region: str = Field(default="us-east-1", validation_alias="STORAGE_REGION")
    storage_bucket: str = Field(default="omnixtra-media", validation_alias="STORAGE_BUCKET")
    storage_access_key_id: str = Field(
        default="minioadmin", validation_alias="STORAGE_ACCESS_KEY_ID"
    )
    storage_secret_access_key: str = Field(
        default="minioadmin", validation_alias="STORAGE_SECRET_ACCESS_KEY"
    )
    storage_public_base_url: str = Field(default="", validation_alias="STORAGE_PUBLIC_BASE_URL")
    storage_max_upload_bytes: int = Field(
        default=52_428_800, validation_alias="STORAGE_MAX_UPLOAD_BYTES"
    )
    storage_tenant_quota_bytes: int = Field(
        default=104_857_600, validation_alias="STORAGE_TENANT_QUOTA_BYTES"
    )
    storage_presign_seconds: int = Field(default=300, validation_alias="STORAGE_PRESIGN_SECONDS")
    storage_download_seconds: int = Field(default=3600, validation_alias="STORAGE_DOWNLOAD_SECONDS")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def cookie_domain(self) -> str | None:
        normalized_base_domain = self.app_base_domain.lower().strip(".")
        if normalized_base_domain == "localhost":
            return None
        return f".{normalized_base_domain}"

    @property
    def cookie_secure(self) -> bool:
        return self.app_env.lower() != "local"

    @property
    def cors_origin_regex(self) -> str:
        escaped_base_domain = self.app_base_domain.lower().strip(".").replace(".", r"\.")
        return rf"^https?://([a-z0-9-]+\.)?{escaped_base_domain}(:\d+)?$"


@lru_cache
def get_settings() -> Settings:
    return Settings()
