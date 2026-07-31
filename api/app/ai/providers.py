import asyncio
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Protocol

import httpx

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError

MAX_PROVIDER_ATTEMPTS = 3
TRANSIENT_PROVIDER_STATUSES = {429, 500, 502, 503, 504}


class TutorProvider(Protocol):
    name: str

    async def answer(self, *, question: str, context: list[str]) -> str: ...


class EmbeddingProvider(Protocol):
    name: str

    async def embed(self, *, text: str) -> list[float]: ...


class AdvisoryProvider:
    name = "advisory-local"

    async def answer(self, *, question: str, context: list[str]) -> str:
        if not context:
            return "I could not find relevant course material for that question."
        return f"Based on the course material for '{question}': {context[0]}"


@dataclass(frozen=True)
class ProviderConfig:
    api_key: str
    model: str
    timeout_seconds: float = 30.0


class OpenAIProvider:
    name = "openai"

    def __init__(
        self,
        config: ProviderConfig | None = None,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.config = config or ProviderConfig(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
        self.client = client

    async def answer(self, *, question: str, context: list[str]) -> str:
        _require_api_key(self.config.api_key, self.name)
        payload = {
            "model": self.config.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Answer only from the provided course context and cite relevant lessons."
                    ),
                },
                {
                    "role": "user",
                    "content": _context_prompt(question=question, context=context),
                },
            ],
            "temperature": 0.2,
        }
        data = await _post_json(
            "https://api.openai.com/v1/chat/completions",
            payload,
            headers={"Authorization": f"Bearer {self.config.api_key}"},
            timeout_seconds=self.config.timeout_seconds,
            client=self.client,
        )
        choices = _as_sequence(data.get("choices"))
        first_choice = _as_mapping(choices[0] if choices else {})
        message = _as_mapping(first_choice.get("message"))
        content = message.get("content")
        if not isinstance(content, str) or content == "":
            msg = "OpenAI response did not include answer content"
            raise ValidationAppError(msg)
        return content


class OpenAIEmbeddingProvider:
    name = "openai-embedding"

    def __init__(
        self,
        config: ProviderConfig | None = None,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.config = config or ProviderConfig(
            api_key=settings.openai_api_key,
            model=settings.openai_embedding_model,
        )
        self.client = client

    async def embed(self, *, text: str) -> list[float]:
        _require_api_key(self.config.api_key, self.name)
        data = await _post_json(
            "https://api.openai.com/v1/embeddings",
            {"input": text, "model": self.config.model},
            headers={"Authorization": f"Bearer {self.config.api_key}"},
            timeout_seconds=self.config.timeout_seconds,
            client=self.client,
        )
        embeddings = _as_sequence(data.get("data"))
        first_embedding = _as_mapping(embeddings[0] if embeddings else {})
        values = _as_sequence(first_embedding.get("embedding"))
        return [_float_embedding_value(value) for value in values]


class AnthropicProvider:
    name = "anthropic"

    def __init__(
        self,
        config: ProviderConfig | None = None,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.config = config or ProviderConfig(
            api_key=settings.anthropic_api_key,
            model=settings.anthropic_model,
        )
        self.client = client

    async def answer(self, *, question: str, context: list[str]) -> str:
        _require_api_key(self.config.api_key, self.name)
        data = await _post_json(
            "https://api.anthropic.com/v1/messages",
            {
                "max_tokens": 800,
                "messages": [
                    {
                        "role": "user",
                        "content": _context_prompt(question=question, context=context),
                    },
                ],
                "model": self.config.model,
                "system": "Answer only from the provided course context and cite relevant lessons.",
            },
            headers={
                "anthropic-version": "2023-06-01",
                "x-api-key": self.config.api_key,
            },
            timeout_seconds=self.config.timeout_seconds,
            client=self.client,
        )
        content_blocks = _as_sequence(data.get("content"))
        text_parts = [
            str(block["text"])
            for block in (_as_mapping(item) for item in content_blocks)
            if block.get("type") == "text" and isinstance(block.get("text"), str)
        ]
        if not text_parts:
            msg = "Anthropic response did not include answer content"
            raise ValidationAppError(msg)
        return "\n".join(text_parts)


def _context_prompt(*, question: str, context: list[str]) -> str:
    joined_context = "\n\n".join(f"[{index + 1}] {item}" for index, item in enumerate(context))
    return f"Course context:\n{joined_context}\n\nLearner question:\n{question}"


async def _post_json(
    url: str,
    payload: dict[str, object],
    *,
    headers: dict[str, str],
    timeout_seconds: float,
    client: httpx.AsyncClient | None,
) -> dict[str, Any]:
    request_headers = {"Content-Type": "application/json", **headers}
    response: httpx.Response | None = None
    for attempt in range(MAX_PROVIDER_ATTEMPTS):
        if client is not None:
            response = await client.post(url, json=payload, headers=request_headers)
        else:
            async with httpx.AsyncClient(timeout=timeout_seconds) as transient_client:
                response = await transient_client.post(url, json=payload, headers=request_headers)
        if (
            response.status_code not in TRANSIENT_PROVIDER_STATUSES
            or attempt == MAX_PROVIDER_ATTEMPTS - 1
        ):
            break
        await asyncio.sleep(_retry_delay_seconds(response, attempt=attempt))
    if response is None:
        msg = "AI provider request did not return a response"
        raise ValidationAppError(msg)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        msg = f"AI provider request failed with status {response.status_code}"
        raise ValidationAppError(msg) from exc
    data = response.json()
    if not isinstance(data, dict):
        msg = "AI provider response must be a JSON object"
        raise ValidationAppError(msg)
    return data


def _retry_delay_seconds(response: httpx.Response, *, attempt: int) -> float:
    retry_after = response.headers.get("retry-after")
    if retry_after is not None:
        try:
            return min(float(retry_after), 10.0)
        except ValueError:
            return 1.0
    return float(attempt + 1)


def _require_api_key(api_key: str, provider_name: str) -> None:
    if api_key:
        return
    msg = f"{provider_name} API key is not configured"
    raise ValidationAppError(msg)


def _as_sequence(value: object) -> Sequence[object]:
    return value if isinstance(value, list) else []


def _as_mapping(value: object) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _float_embedding_value(value: object) -> float:
    if isinstance(value, int | float | str):
        return float(value)
    msg = "embedding values must be numeric"
    raise ValidationAppError(msg)
