from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="local", validation_alias="APP_ENV")
    app_name: str = Field(default="OmniXtra", validation_alias="APP_NAME")
    database_url: str = Field(
        default="postgresql+asyncpg://omnixtra_app:omnixtra_app_password@localhost:5432/omnixtra",
        validation_alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    sentry_dsn: str = Field(default="", validation_alias="SENTRY_DSN")
    otel_exporter_otlp_endpoint: str = Field(
        default="",
        validation_alias="OTEL_EXPORTER_OTLP_ENDPOINT",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
