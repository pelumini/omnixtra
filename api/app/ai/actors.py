import asyncio
from datetime import UTC, datetime
from typing import cast
from uuid import UUID

import dramatiq
import httpx
from redis.exceptions import RedisError
from sqlalchemy.exc import SQLAlchemyError

from app.ai.cache import semantic_hash
from app.ai.citations import citations_from_chunks
from app.ai.graph import TutorGraphResult, run_tutor_graph
from app.ai.jobs import EmbeddingJobPayload, build_embedding_chunks
from app.ai.models import (
    ConversationRole,
    LessonEmbedding,
    SemanticCacheEntry,
    TutorJobStatus,
    TutorMessage,
)
from app.ai.provider_selection import (
    is_advisory_provider,
    select_embedding_provider,
    select_tutor_provider,
)
from app.ai.providers import TutorProvider
from app.ai.repositories import semantic_cache_by_hash, tutor_job_by_id
from app.ai.retrieval import (
    RetrievedChunk,
    hybrid_retrieve_chunks,
)
from app.ai.streaming import TutorEventContext, publish_tutor_event
from app.ai.tracing import traced_tutor_graph
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.database import async_session_factory
from app.core.exceptions import AppError
from app.core.redis import create_redis_client
from app.workers.broker import broker


@dramatiq.actor(queue_name="ai_embeddings", max_retries=3)
def generate_lesson_embeddings(
    *,
    tenant_id: str,
    course_id: str,
    lesson_id: str,
    lesson_version: int,
    text: str,
) -> None:
    asyncio.run(
        _generate_lesson_embeddings(
            tenant_id=UUID(tenant_id),
            course_id=UUID(course_id),
            lesson_id=UUID(lesson_id),
            lesson_version=lesson_version,
            text=text,
        ),
    )


@dramatiq.actor(queue_name="ai_tutor", max_retries=3)
def run_tutor_job(
    *,
    tenant_id: str,
    job_id: str,
    course_id: str,
    learner_id: str,
) -> None:
    asyncio.run(
        _run_tutor_job(
            tenant_id=UUID(tenant_id),
            job_id=UUID(job_id),
            course_id=UUID(course_id),
            learner_id=UUID(learner_id),
        ),
    )


@dramatiq.actor(queue_name="ai_embeddings", max_retries=3)
def reenqueue_course_embedding_jobs(
    *,
    tenant_id: str,
    course_id: str,
    lessons: list[dict[str, object]],
) -> None:
    for lesson in lessons:
        lesson_version = lesson["lesson_version"]
        if not isinstance(lesson_version, int):
            lesson_version = int(cast("str", lesson_version))
        generate_lesson_embeddings.send(
            tenant_id=tenant_id,
            course_id=course_id,
            lesson_id=str(lesson["lesson_id"]),
            lesson_version=lesson_version,
            text=str(lesson["text"]),
        )


async def _generate_lesson_embeddings(
    *,
    tenant_id: UUID,
    course_id: UUID,
    lesson_id: UUID,
    lesson_version: int,
    text: str,
) -> None:
    set_tenant_id(str(tenant_id))
    try:
        payload = EmbeddingJobPayload(
            tenant_id=tenant_id,
            course_id=course_id,
            lesson_id=lesson_id,
            lesson_version=lesson_version,
            text=text,
        )
        async with async_session_factory() as session:
            embedding_provider = select_embedding_provider()
            for chunk in build_embedding_chunks(payload):
                session.add(
                    LessonEmbedding(
                        course_id=course_id,
                        lesson_id=lesson_id,
                        lesson_version=lesson_version,
                        chunk_index=chunk.chunk_index,
                        chunk_text=chunk.text,
                        embedding=await embedding_provider.embed(text=chunk.text),
                        embedding_provider=embedding_provider.name,
                    ),
                )
            await session.commit()
    finally:
        clear_tenant_id()


async def _run_tutor_job(
    *,
    tenant_id: UUID,
    job_id: UUID,
    course_id: UUID,
    learner_id: UUID,
) -> None:
    set_tenant_id(str(tenant_id))
    redis_client = create_redis_client()
    try:
        await publish_tutor_event(
            redis_client,
            context=TutorEventContext(tenant_id=tenant_id, course_id=course_id, job_id=job_id),
            event="running",
            data={"job_id": str(job_id), "status": TutorJobStatus.running.value},
        )
        async with async_session_factory() as session:
            job = await session.scalar(tutor_job_by_id(job_id))
            if job is None or job.learner_id != learner_id or job.course_id != course_id:
                return
            tutor_provider = select_tutor_provider()
            embedding_provider = select_embedding_provider()
            job.status = TutorJobStatus.running.value
            await session.flush()
            cache_hash = semantic_hash(
                f"{tutor_provider.name}:{embedding_provider.name}:{job.question}",
            )
            cache_entry = await session.scalar(semantic_cache_by_hash(course_id, cache_hash))
            if cache_entry is not None:
                answer = cache_entry.answer
                citations = cache_entry.citations
                refused = False
                provider_name = tutor_provider.name
                advisory = is_advisory_provider(tutor_provider)
            else:
                query_embedding = await embedding_provider.embed(text=job.question)
                retrieved = await hybrid_retrieve_chunks(
                    session,
                    tenant_id=tenant_id,
                    course_id=course_id,
                    question=job.question,
                    query_embedding=query_embedding,
                    embedding_provider=embedding_provider.name,
                    limit=5,
                )
                result = await _traced_graph(
                    tenant_id=tenant_id,
                    course_id=course_id,
                    question=job.question,
                    retrieved_context=[chunk.chunk_text for chunk in retrieved],
                    citations=_citations_from_retrieved(retrieved),
                    provider=tutor_provider,
                )
                answer = result.answer
                citations = result.citations
                refused = result.refused
                provider_name = result.provider
                advisory = result.advisory
                if not refused:
                    session.add(
                        SemanticCacheEntry(
                            course_id=course_id,
                            semantic_hash=cache_hash,
                            question=job.question,
                            answer=answer,
                            citations=citations,
                        ),
                    )
            session.add(
                TutorMessage(
                    conversation_id=job.conversation_id,
                    learner_id=learner_id,
                    course_id=course_id,
                    role=ConversationRole.assistant.value,
                    content=answer,
                    citations=_message_citations(
                        citations,
                        provider=provider_name,
                        advisory=advisory,
                    ),
                ),
            )
            job.status = TutorJobStatus.completed.value
            job.completed_at = datetime.now(UTC)
            job.trace_metadata = {
                **job.trace_metadata,
                "langsmith_project": "omnixtra-tutor",
                "completed_at": job.completed_at.isoformat(),
                "provider": provider_name,
                "advisory": advisory,
                "embedding_provider": embedding_provider.name,
            }
            await session.commit()
        await publish_tutor_event(
            redis_client,
            context=TutorEventContext(tenant_id=tenant_id, course_id=course_id, job_id=job_id),
            event="completed",
            data={
                "job_id": str(job_id),
                "status": TutorJobStatus.completed.value,
                "answer": answer,
                "citations": citations,
                "provider": provider_name,
                "advisory": advisory,
                "embedding_provider": embedding_provider.name,
            },
        )
    except (AppError, httpx.HTTPError, RuntimeError, ValueError, SQLAlchemyError, RedisError):
        async with async_session_factory() as session:
            job = await session.scalar(tutor_job_by_id(job_id))
            if job is not None:
                job.status = TutorJobStatus.failed.value
                await session.commit()
        await publish_tutor_event(
            redis_client,
            context=TutorEventContext(tenant_id=tenant_id, course_id=course_id, job_id=job_id),
            event="failed",
            data={"job_id": str(job_id), "status": TutorJobStatus.failed.value},
        )
        raise
    finally:
        await redis_client.aclose()
        clear_tenant_id()


@traced_tutor_graph
async def _traced_graph(  # noqa: PLR0913
    *,
    tenant_id: UUID,
    course_id: UUID,
    question: str,
    retrieved_context: list[str],
    citations: list[dict[str, object]],
    provider: TutorProvider,
) -> TutorGraphResult:
    return await run_tutor_graph(
        tenant_id=tenant_id,
        course_id=course_id,
        question=question,
        retrieved_context=retrieved_context,
        citations=citations,
        provider=provider,
    )


def _citations_from_retrieved(chunks: list[RetrievedChunk]) -> list[dict[str, object]]:
    embeddings = [
        LessonEmbedding(
            id=chunk.id,
            course_id=chunk.course_id,
            lesson_id=chunk.lesson_id,
            lesson_version=chunk.lesson_version,
            chunk_index=chunk.chunk_index,
            chunk_text=chunk.chunk_text,
            embedding=[],
            embedding_provider=chunk.embedding_provider,
        )
        for chunk in chunks
    ]
    return citations_from_chunks(embeddings)


def _message_citations(
    citations: list[dict[str, object]],
    *,
    provider: str,
    advisory: bool,
) -> list[dict[str, object]]:
    return [
        *citations,
        {
            "metadata_type": "ai_provider",
            "provider": provider,
            "advisory": advisory,
        },
    ]


__all__ = [
    "broker",
    "generate_lesson_embeddings",
    "reenqueue_course_embedding_jobs",
    "run_tutor_job",
]
