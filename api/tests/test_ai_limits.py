from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.ai.limits import enforce_tutor_limits
from app.core.config import Settings
from app.core.exceptions import RateLimitError

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
OTHER_TENANT_ID = UUID("00000000-0000-0000-0000-000000000002")
LEARNER_ID = UUID("00000000-0000-0000-0000-000000000003")
NOW = datetime(2026, 7, 31, 12, 0, tzinfo=UTC)


class FakeLimitStore:
    def __init__(self) -> None:
        self.values: dict[str, int] = {}
        self.expirations: dict[str, int] = {}

    async def incr(self, name: str, amount: int = 1) -> int:
        self.values[name] = self.values.get(name, 0) + amount
        return self.values[name]

    async def incrby(self, name: str, amount: int = 1) -> int:
        return await self.incr(name, amount)

    async def decrby(self, name: str, amount: int = 1) -> int:
        self.values[name] = self.values.get(name, 0) - amount
        return self.values[name]

    async def expire(self, name: str, time: int) -> bool:
        self.expirations[name] = time
        return True


def _settings(**updates: object) -> Settings:
    return Settings(_env_file=None).model_copy(update=updates)


@pytest.mark.anyio
async def test_tutor_limits_track_tenant_and_user_minute_buckets() -> None:
    store = FakeLimitStore()
    settings = _settings(
        ai_tutor_requests_per_minute=2,
        ai_monthly_token_budget=10_000,
        ai_tutor_estimated_tokens_per_request=100,
    )

    await enforce_tutor_limits(
        store,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )
    await enforce_tutor_limits(
        store,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )

    with pytest.raises(RateLimitError):
        await enforce_tutor_limits(
            store,
            tenant_id=TENANT_ID,
            learner_id=LEARNER_ID,
            settings=settings,
            now=NOW,
        )


@pytest.mark.anyio
async def test_tutor_limits_are_tenant_scoped() -> None:
    store = FakeLimitStore()
    settings = _settings(
        ai_tutor_requests_per_minute=1,
        ai_monthly_token_budget=10_000,
        ai_tutor_estimated_tokens_per_request=100,
    )

    await enforce_tutor_limits(
        store,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )
    decision = await enforce_tutor_limits(
        store,
        tenant_id=OTHER_TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )

    assert decision.monthly_tokens_used == 100


@pytest.mark.anyio
async def test_tutor_limits_stop_at_monthly_budget_and_restore_counter() -> None:
    store = FakeLimitStore()
    settings = _settings(
        ai_tutor_requests_per_minute=10,
        ai_monthly_token_budget=150,
        ai_tutor_estimated_tokens_per_request=100,
    )

    await enforce_tutor_limits(
        store,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )

    with pytest.raises(RateLimitError):
        await enforce_tutor_limits(
            store,
            tenant_id=TENANT_ID,
            learner_id=LEARNER_ID,
            settings=settings,
            now=NOW,
        )

    assert store.values[f"ai_limits:tenant:{TENANT_ID}:tokens:202607"] == 100


@pytest.mark.anyio
async def test_tutor_limits_warn_after_configured_monthly_threshold() -> None:
    store = FakeLimitStore()
    settings = _settings(
        ai_tutor_requests_per_minute=10,
        ai_monthly_token_budget=1_000,
        ai_monthly_token_warning_percent=80,
        ai_tutor_estimated_tokens_per_request=800,
    )

    decision = await enforce_tutor_limits(
        store,
        tenant_id=TENANT_ID,
        learner_id=LEARNER_ID,
        settings=settings,
        now=NOW,
    )

    assert decision.warning is True
    assert decision.warning_threshold == 800
