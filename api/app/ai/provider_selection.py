from app.ai.providers import (
    AdvisoryProvider,
    AnthropicProvider,
    EmbeddingProvider,
    OpenAIEmbeddingProvider,
    OpenAIProvider,
    ProviderConfig,
    TutorProvider,
)
from app.ai.retrieval import deterministic_embedding_values
from app.core.config import get_settings

ADVISORY_PROVIDER_NAME = "advisory-local"
LOCAL_EMBEDDING_PROVIDER_NAME = "local-deterministic"


class LocalDeterministicEmbeddingProvider:
    name = LOCAL_EMBEDDING_PROVIDER_NAME

    async def embed(self, *, text: str) -> list[float]:
        return deterministic_embedding_values(text)


def select_tutor_provider() -> TutorProvider:
    settings = get_settings()
    provider_name = settings.ai_provider.strip().lower()
    timeout_seconds = settings.ai_provider_timeout_seconds

    if provider_name in {"advisory", "advisory-local", "local"}:
        return AdvisoryProvider()
    if provider_name == "openai":
        return OpenAIProvider(
            ProviderConfig(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                timeout_seconds=timeout_seconds,
            ),
        )
    if provider_name == "anthropic":
        return AnthropicProvider(
            ProviderConfig(
                api_key=settings.anthropic_api_key,
                model=settings.anthropic_model,
                timeout_seconds=timeout_seconds,
            ),
        )
    if settings.openai_api_key:
        return OpenAIProvider(
            ProviderConfig(
                api_key=settings.openai_api_key,
                model=settings.openai_model,
                timeout_seconds=timeout_seconds,
            ),
        )
    if settings.anthropic_api_key:
        return AnthropicProvider(
            ProviderConfig(
                api_key=settings.anthropic_api_key,
                model=settings.anthropic_model,
                timeout_seconds=timeout_seconds,
            ),
        )
    return AdvisoryProvider()


def select_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    provider_name = settings.ai_provider.strip().lower()
    timeout_seconds = settings.ai_provider_timeout_seconds

    if provider_name in {"advisory", "advisory-local", "local", "anthropic"}:
        return LocalDeterministicEmbeddingProvider()
    if provider_name == "openai" or settings.openai_api_key:
        return OpenAIEmbeddingProvider(
            ProviderConfig(
                api_key=settings.openai_api_key,
                model=settings.openai_embedding_model,
                timeout_seconds=timeout_seconds,
            ),
        )
    return LocalDeterministicEmbeddingProvider()


def is_advisory_provider(provider: TutorProvider) -> bool:
    return provider.name == ADVISORY_PROVIDER_NAME


__all__ = [
    "ADVISORY_PROVIDER_NAME",
    "LOCAL_EMBEDDING_PROVIDER_NAME",
    "LocalDeterministicEmbeddingProvider",
    "is_advisory_provider",
    "select_embedding_provider",
    "select_tutor_provider",
]
