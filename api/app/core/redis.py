from collections.abc import AsyncIterator

from redis.asyncio import Redis

from app.core.config import get_settings


def create_redis_client() -> Redis:
    return Redis.from_url(get_settings().redis_url, decode_responses=True)


async def get_redis() -> AsyncIterator[Redis]:
    client = create_redis_client()
    try:
        yield client
    finally:
        await client.aclose()


__all__ = ["create_redis_client", "get_redis"]
