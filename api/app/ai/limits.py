from collections.abc import Awaitable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol
from uuid import UUID

from app.core.config import Settings
from app.core.exceptions import RateLimitError

AI_LIMIT_KEY_PREFIX = "ai_limits"
SECONDS_PER_MINUTE = 60
DECEMBER = 12


class AiLimitStore(Protocol):
    def incr(self, name: str, amount: int = 1) -> Awaitable[int]: ...

    def incrby(self, name: str, amount: int = 1) -> Awaitable[int]: ...

    def decrby(self, name: str, amount: int = 1) -> Awaitable[int]: ...

    def expire(self, name: str, time: int) -> Awaitable[bool]: ...


@dataclass(frozen=True)
class AiLimitDecision:
    estimated_tokens: int
    monthly_tokens_used: int
    monthly_budget: int
    warning_threshold: int
    warning: bool


@dataclass(frozen=True)
class MonthlyBudgetConfig:
    estimated_tokens: int
    monthly_budget: int
    warning_percent: int


async def enforce_tutor_limits(
    store: AiLimitStore,
    *,
    tenant_id: UUID,
    learner_id: UUID,
    settings: Settings,
    now: datetime | None = None,
) -> AiLimitDecision:
    """Reserve tutor usage before a job is enqueued."""
    current_time = now or datetime.now(UTC)
    estimated_tokens = min(
        settings.ai_tutor_estimated_tokens_per_request,
        settings.ai_tutor_feature_token_limit,
    )
    if estimated_tokens <= 0:
        msg = "AI tutor token estimate must be positive"
        raise RateLimitError(msg)

    await _enforce_request_rate(
        store,
        tenant_id=tenant_id,
        learner_id=learner_id,
        max_requests=settings.ai_tutor_requests_per_minute,
    )
    return await _reserve_monthly_budget(
        store,
        tenant_id=tenant_id,
        config=MonthlyBudgetConfig(
            estimated_tokens=estimated_tokens,
            monthly_budget=settings.ai_monthly_token_budget,
            warning_percent=settings.ai_monthly_token_warning_percent,
        ),
        now=current_time,
    )


async def _enforce_request_rate(
    store: AiLimitStore,
    *,
    tenant_id: UUID,
    learner_id: UUID,
    max_requests: int,
) -> None:
    if max_requests <= 0:
        msg = "AI tutor is temporarily unavailable"
        raise RateLimitError(msg)
    for key in (
        f"{AI_LIMIT_KEY_PREFIX}:tenant:{tenant_id}:tutor:requests:minute",
        f"{AI_LIMIT_KEY_PREFIX}:tenant:{tenant_id}:user:{learner_id}:tutor:requests:minute",
    ):
        count = await store.incr(key)
        if count == 1:
            await store.expire(key, SECONDS_PER_MINUTE)
        if count > max_requests:
            msg = "AI tutor rate limit exceeded"
            raise RateLimitError(msg)


async def _reserve_monthly_budget(
    store: AiLimitStore,
    *,
    tenant_id: UUID,
    config: MonthlyBudgetConfig,
    now: datetime,
) -> AiLimitDecision:
    if config.monthly_budget <= 0:
        msg = "AI tutor monthly budget exhausted"
        raise RateLimitError(msg)
    key = f"{AI_LIMIT_KEY_PREFIX}:tenant:{tenant_id}:tokens:{now:%Y%m}"
    tokens_used = await store.incrby(key, config.estimated_tokens)
    if tokens_used == config.estimated_tokens:
        await store.expire(key, _seconds_until_next_month(now))
    if tokens_used > config.monthly_budget:
        await store.decrby(key, config.estimated_tokens)
        msg = "AI tutor monthly budget exhausted"
        raise RateLimitError(msg)
    warning_threshold = max(1, config.monthly_budget * config.warning_percent // 100)
    return AiLimitDecision(
        estimated_tokens=config.estimated_tokens,
        monthly_tokens_used=tokens_used,
        monthly_budget=config.monthly_budget,
        warning_threshold=warning_threshold,
        warning=tokens_used >= warning_threshold,
    )


def _seconds_until_next_month(now: datetime) -> int:
    if now.tzinfo is None:
        now = now.replace(tzinfo=UTC)
    if now.month == DECEMBER:
        next_month = now.replace(year=now.year + 1, month=1, day=1)
    else:
        next_month = now.replace(month=now.month + 1, day=1)
    next_month = next_month.replace(hour=0, minute=0, second=0, microsecond=0)
    return max(1, int((next_month - now).total_seconds()))


__all__ = [
    "AI_LIMIT_KEY_PREFIX",
    "AiLimitDecision",
    "AiLimitStore",
    "enforce_tutor_limits",
]
