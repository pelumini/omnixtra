from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="local", validation_alias="APP_ENV")
    app_name: str = Field(default="OmniXtra", validation_alias="APP_NAME")
    app_base_domain: str = Field(default="localhost", validation_alias="APP_BASE_DOMAIN")
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
    anthropic_api_key: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-3-5-haiku-latest",
        validation_alias="ANTHROPIC_MODEL",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
