import json
from collections.abc import Callable
from typing import Self
from uuid import UUID

import httpx
import pytest

from app.ai import actors
from app.ai.models import (
    LessonEmbedding,
    SemanticCacheEntry,
    TutorJob,
    TutorJobStatus,
    TutorMessage,
)
from app.ai.provider_selection import LocalDeterministicEmbeddingProvider
from app.ai.providers import OpenAIProvider, ProviderConfig
from app.core.config import get_settings
from app.core.exceptions import ValidationAppError


class FakeRedis:
    def __init__(self) -> None:
        self.messages: list[tuple[str, str]] = []

    async def publish(self, channel: str, message: str) -> None:
        self.messages.append((channel, message))

    async def aclose(self) -> None:
        return None


class FakeMappings:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows

    def all(self) -> list[dict[str, object]]:
        return self.rows


class FakeExecuteResult:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows

    def mappings(self) -> FakeMappings:
        return FakeMappings(self.rows)


class FakeSession:
    def __init__(
        self,
        *,
        job: TutorJob | None,
        retrieved_rows: list[dict[str, object]] | None = None,
        cache_entry: SemanticCacheEntry | None = None,
    ) -> None:
        self.job = job
        self.retrieved_rows = retrieved_rows or []
        self.cache_entry = cache_entry
        self.added: list[object] = []
        self.execute_parameters: dict[str, object] = {}
        self.execute_count = 0
        self.commit_count = 0

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_exc_info: object) -> None:
        return None

    async def scalar(self, _statement: object) -> object:
        statement_text = str(_statement)
        if "tutor_jobs" in statement_text:
            return self.job
        if "semantic_cache_entries" in statement_text:
            return self.cache_entry
        return None

    async def execute(self, _statement: object, parameters: dict[str, object]) -> FakeExecuteResult:
        self.execute_count += 1
        self.execute_parameters = parameters
        return FakeExecuteResult(self.retrieved_rows)

    def add(self, value: object) -> None:
        self.added.append(value)
        if isinstance(value, SemanticCacheEntry):
            self.cache_entry = value

    async def flush(self) -> None:
        return None

    async def commit(self) -> None:
        self.commit_count += 1


def _job() -> TutorJob:
    return TutorJob(
        id=UUID("00000000-0000-0000-0000-000000000010"),
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        conversation_id=UUID("00000000-0000-0000-0000-000000000011"),
        learner_id=UUID("00000000-0000-0000-0000-000000000012"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        question="What is onboarding?",
        status=TutorJobStatus.queued.value,
        idempotency_key="idem-key-123",
        trace_metadata={},
    )


def _retrieved_rows() -> list[dict[str, object]]:
    return [
        {
            "id": UUID("00000000-0000-0000-0000-000000000020"),
            "course_id": UUID("00000000-0000-0000-0000-000000000002"),
            "lesson_id": UUID("00000000-0000-0000-0000-000000000030"),
            "lesson_version": 1,
            "chunk_index": 0,
            "chunk_text": "Onboarding introduces required workflows.",
            "score": 0.9,
            "embedding_provider": "local-deterministic",
        },
    ]


def _session_factory(fake_session: FakeSession) -> Callable[[], FakeSession]:
    return lambda: fake_session


@pytest.mark.anyio
async def test_tutor_actor_calls_provider_and_publishes_provider_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        provider_calls.append(str(request.url))
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "OpenAI tutor answer"}}]},
        )

    provider = OpenAIProvider(
        ProviderConfig(api_key="test-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    fake_session = FakeSession(job=_job(), retrieved_rows=_retrieved_rows())
    fake_redis = FakeRedis()
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "create_redis_client", lambda: fake_redis)
    monkeypatch.setattr(actors, "select_tutor_provider", lambda: provider)
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)

    await actors._run_tutor_job(  # noqa: SLF001
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        job_id=UUID("00000000-0000-0000-0000-000000000010"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        learner_id=UUID("00000000-0000-0000-0000-000000000012"),
    )

    messages = [item for item in fake_session.added if isinstance(item, TutorMessage)]
    assert provider_calls == ["https://api.openai.com/v1/chat/completions"]
    assert messages[0].content == "OpenAI tutor answer"
    assert {"metadata_type": "ai_provider", "provider": "openai", "advisory": False} in messages[
        0
    ].citations
    assert fake_session.job is not None
    assert fake_session.job.trace_metadata["provider"] == "openai"
    assert fake_session.job.trace_metadata["embedding_provider"] == "local-deterministic"
    assert fake_session.execute_parameters["embedding_provider"] == "local-deterministic"
    assert any('"provider":"openai"' in message for _channel, message in fake_redis.messages)


@pytest.mark.anyio
async def test_tutor_actor_marks_job_failed_on_provider_validation_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "invalid key"})

    provider = OpenAIProvider(
        ProviderConfig(api_key="bad-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    fake_session = FakeSession(job=_job(), retrieved_rows=_retrieved_rows())
    fake_redis = FakeRedis()
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "create_redis_client", lambda: fake_redis)
    monkeypatch.setattr(actors, "select_tutor_provider", lambda: provider)
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)

    with pytest.raises(ValidationAppError):
        await actors._run_tutor_job(  # noqa: SLF001
            tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
            job_id=UUID("00000000-0000-0000-0000-000000000010"),
            course_id=UUID("00000000-0000-0000-0000-000000000002"),
            learner_id=UUID("00000000-0000-0000-0000-000000000012"),
        )

    assert fake_session.job is not None
    assert fake_session.job.status == TutorJobStatus.failed.value
    assert any('"event":"failed"' in message for _channel, message in fake_redis.messages)


@pytest.mark.anyio
async def test_tutor_actor_marks_job_failed_on_provider_transport_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        msg = "network unavailable"
        raise httpx.ConnectError(msg, request=request)

    provider = OpenAIProvider(
        ProviderConfig(api_key="test-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    fake_session = FakeSession(job=_job(), retrieved_rows=_retrieved_rows())
    fake_redis = FakeRedis()
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "create_redis_client", lambda: fake_redis)
    monkeypatch.setattr(actors, "select_tutor_provider", lambda: provider)
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)

    with pytest.raises(httpx.ConnectError):
        await actors._run_tutor_job(  # noqa: SLF001
            tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
            job_id=UUID("00000000-0000-0000-0000-000000000010"),
            course_id=UUID("00000000-0000-0000-0000-000000000002"),
            learner_id=UUID("00000000-0000-0000-0000-000000000012"),
        )

    assert fake_session.job is not None
    assert fake_session.job.status == TutorJobStatus.failed.value
    assert any('"event":"failed"' in message for _channel, message in fake_redis.messages)


@pytest.mark.anyio
async def test_tutor_actor_uses_advisory_provider_without_http(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_session = FakeSession(job=_job(), retrieved_rows=_retrieved_rows())
    fake_redis = FakeRedis()
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "create_redis_client", lambda: fake_redis)
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)
    monkeypatch.setenv("AI_PROVIDER", "advisory-local")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    get_settings.cache_clear()

    await actors._run_tutor_job(  # noqa: SLF001
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        job_id=UUID("00000000-0000-0000-0000-000000000010"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        learner_id=UUID("00000000-0000-0000-0000-000000000012"),
    )

    messages = [item for item in fake_session.added if isinstance(item, TutorMessage)]
    completed_payloads = _event_payloads(fake_redis, event="completed")
    assert messages[0].content.startswith("Based on the course material")
    assert completed_payloads[0]["provider"] == "advisory-local"
    assert completed_payloads[0]["advisory"] is True
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_tutor_actor_reuses_semantic_cache_without_provider_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_calls = 0

    async def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal provider_calls
        provider_calls += 1
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "Cached OpenAI answer"}}]},
        )

    provider = OpenAIProvider(
        ProviderConfig(api_key="test-key", model="test-model"),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    fake_session = FakeSession(job=_job(), retrieved_rows=_retrieved_rows())
    fake_redis = FakeRedis()
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "create_redis_client", lambda: fake_redis)
    monkeypatch.setattr(actors, "select_tutor_provider", lambda: provider)
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)

    for _ in range(2):
        await actors._run_tutor_job(  # noqa: SLF001
            tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
            job_id=UUID("00000000-0000-0000-0000-000000000010"),
            course_id=UUID("00000000-0000-0000-0000-000000000002"),
            learner_id=UUID("00000000-0000-0000-0000-000000000012"),
        )

    assert provider_calls == 1
    assert fake_session.execute_count == 1


@pytest.mark.anyio
async def test_embedding_actor_persists_embedding_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_session = FakeSession(job=None)
    monkeypatch.setattr(actors, "async_session_factory", _session_factory(fake_session))
    monkeypatch.setattr(actors, "select_embedding_provider", LocalDeterministicEmbeddingProvider)

    await actors._generate_lesson_embeddings(  # noqa: SLF001
        tenant_id=UUID("00000000-0000-0000-0000-000000000001"),
        course_id=UUID("00000000-0000-0000-0000-000000000002"),
        lesson_id=UUID("00000000-0000-0000-0000-000000000003"),
        lesson_version=1,
        text="A short lesson about onboarding workflows.",
    )

    embeddings = [item for item in fake_session.added if isinstance(item, LessonEmbedding)]
    assert len(embeddings) == 1
    assert embeddings[0].embedding_provider == "local-deterministic"
    assert len(embeddings[0].embedding) == 1536


def test_reenqueue_course_embedding_jobs_dispatches_trackable_lesson_payloads(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sent: list[dict[str, object]] = []
    monkeypatch.setattr(
        actors.generate_lesson_embeddings,
        "send",
        lambda **payload: sent.append(payload),
    )

    actors.reenqueue_course_embedding_jobs.fn(
        tenant_id="00000000-0000-0000-0000-000000000001",
        course_id="00000000-0000-0000-0000-000000000002",
        lessons=[
            {
                "lesson_id": "00000000-0000-0000-0000-000000000003",
                "lesson_version": 2,
                "text": "Updated lesson text.",
            },
        ],
    )

    assert sent == [
        {
            "tenant_id": "00000000-0000-0000-0000-000000000001",
            "course_id": "00000000-0000-0000-0000-000000000002",
            "lesson_id": "00000000-0000-0000-0000-000000000003",
            "lesson_version": 2,
            "text": "Updated lesson text.",
        },
    ]


def _event_payloads(redis_client: FakeRedis, *, event: str) -> list[dict[str, object]]:
    payloads = []
    for _channel, message in redis_client.messages:
        decoded = json.loads(message)
        if decoded["event"] == event:
            payloads.append(decoded["data"])
    return payloads
