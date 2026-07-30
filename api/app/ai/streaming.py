import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from uuid import UUID

from redis.asyncio import Redis


@dataclass(frozen=True)
class TutorEventContext:
    tenant_id: UUID
    course_id: UUID
    job_id: UUID


def tutor_job_channel(*, tenant_id: UUID, course_id: UUID, job_id: UUID) -> str:
    return f"tenant:{tenant_id}:ai_jobs:course:{course_id}:job:{job_id}"


def sse_frame(*, event: str, data: dict[str, object]) -> bytes:
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True)
    return f"event: {event}\ndata: {payload}\n\n".encode()


async def publish_tutor_event(
    redis_client: Redis,
    *,
    context: TutorEventContext,
    event: str,
    data: dict[str, object],
) -> None:
    message = json.dumps({"event": event, "data": data}, separators=(",", ":"), sort_keys=True)
    await redis_client.publish(
        tutor_job_channel(
            tenant_id=context.tenant_id,
            course_id=context.course_id,
            job_id=context.job_id,
        ),
        message,
    )


async def subscribe_tutor_events(
    redis_client: Redis,
    *,
    tenant_id: UUID,
    course_id: UUID,
    job_id: UUID,
) -> AsyncIterator[bytes]:
    yield sse_frame(event="ready", data={"course_id": str(course_id), "job_id": str(job_id)})
    channel_name = tutor_job_channel(tenant_id=tenant_id, course_id=course_id, job_id=job_id)
    async with redis_client.pubsub(ignore_subscribe_messages=True) as pubsub:
        await pubsub.subscribe(channel_name)
        while True:
            message = await pubsub.get_message(timeout=30)
            if message is None:
                yield sse_frame(event="keepalive", data={"job_id": str(job_id)})
                continue
            payload = json.loads(message["data"])
            yield sse_frame(event=payload["event"], data=payload["data"])
            if payload["event"] in {"completed", "failed"}:
                break


__all__ = [
    "TutorEventContext",
    "publish_tutor_event",
    "sse_frame",
    "subscribe_tutor_events",
    "tutor_job_channel",
]
