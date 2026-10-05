import os
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool, Pool

from app.core.config import get_settings
from app.core.rls import register_rls_session_variable_hook
from app.tenancy.orm import register_tenant_orm_hooks

TEST_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"


def _poolclass() -> type[Pool] | None:
    return NullPool if os.getenv(TEST_DATABASE_URL_ENV) else None


def _connect_args() -> dict[str, object]:
    if get_settings().app_env.lower() == "local":
        return {}
    return {"ssl": True}


engine: AsyncEngine = create_async_engine(
    get_settings().database_url,
    pool_pre_ping=True,
    poolclass=_poolclass(),
    connect_args=_connect_args(),
)

register_rls_session_variable_hook(engine.sync_engine)
register_tenant_orm_hooks(Session)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
