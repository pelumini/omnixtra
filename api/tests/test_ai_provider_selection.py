from collections.abc import Generator

import pytest

from app.ai.provider_selection import (
    LocalDeterministicEmbeddingProvider,
    select_embedding_provider,
    select_tutor_provider,
)
from app.ai.providers import (
    AdvisoryProvider,
    AnthropicProvider,
    OpenAIEmbeddingProvider,
    OpenAIProvider,
)
from app.core.config import get_settings


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Generator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_auto_provider_uses_advisory_without_api_keys(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_PROVIDER", "auto")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    get_settings.cache_clear()

    assert isinstance(select_tutor_provider(), AdvisoryProvider)
    assert isinstance(select_embedding_provider(), LocalDeterministicEmbeddingProvider)


def test_auto_provider_prefers_openai_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "auto")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    get_settings.cache_clear()

    assert isinstance(select_tutor_provider(), OpenAIProvider)
    assert isinstance(select_embedding_provider(), OpenAIEmbeddingProvider)


def test_explicit_anthropic_uses_local_embedding_fallback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("AI_PROVIDER", "anthropic")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    get_settings.cache_clear()

    assert isinstance(select_tutor_provider(), AnthropicProvider)
    assert isinstance(select_embedding_provider(), LocalDeterministicEmbeddingProvider)
