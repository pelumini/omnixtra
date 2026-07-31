import httpx
import pytest

from app.ai.providers import (
    AnthropicProvider,
    OpenAIEmbeddingProvider,
    OpenAIProvider,
    ProviderConfig,
)
from app.core.exceptions import ValidationAppError


@pytest.mark.anyio
async def test_openai_provider_returns_chat_completion_content() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "AI-generated answer with citations"}}]},
        )

    provider = OpenAIProvider(
        ProviderConfig(api_key="test-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    answer = await provider.answer(question="What is onboarding?", context=["Onboarding context"])

    assert answer == ("AI-generated answer with citations")


@pytest.mark.anyio
async def test_provider_retries_transient_rate_limit() -> None:
    statuses = [429, 200]

    async def handler(_request: httpx.Request) -> httpx.Response:
        status = statuses.pop(0)
        if status == 429:
            return httpx.Response(429, headers={"retry-after": "0"}, json={"error": "limited"})
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "Retried answer"}}]},
        )

    provider = OpenAIProvider(
        ProviderConfig(api_key="test-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    answer = await provider.answer(question="What is onboarding?", context=["Onboarding context"])

    assert answer == "Retried answer"
    assert statuses == []


@pytest.mark.anyio
async def test_openai_embedding_provider_returns_float_vector() -> None:
    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"data": [{"embedding": [0.1, 0.2, 0.3]}]})

    provider = OpenAIEmbeddingProvider(
        ProviderConfig(api_key="test-key", model="embedding-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    assert await provider.embed(text="lesson text") == [0.1, 0.2, 0.3]


@pytest.mark.anyio
async def test_anthropic_provider_returns_text_blocks() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-api-key"] == "test-key"
        return httpx.Response(
            200,
            json={"content": [{"type": "text", "text": "Anthropic tutor answer"}]},
        )

    provider = AnthropicProvider(
        ProviderConfig(api_key="test-key", model="claude-test"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    answer = await provider.answer(question="When do I complete?", context=["Completion context"])

    assert answer == "Anthropic tutor answer"


@pytest.mark.anyio
async def test_provider_requires_configured_api_key() -> None:
    provider = OpenAIProvider(ProviderConfig(api_key="", model="test-model"))

    with pytest.raises(ValidationAppError):
        await provider.answer(question="What is onboarding?", context=["Onboarding context"])
