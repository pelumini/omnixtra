from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.rls import register_rls_session_variable_hook
from app.tenancy.orm import register_tenant_orm_hooks

engine: AsyncEngine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
register_rls_session_variable_hook(engine.sync_engine)
register_tenant_orm_hooks(Session)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
