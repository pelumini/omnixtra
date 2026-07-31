import asyncio
import os
from uuid import UUID, uuid4

import psycopg
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.ai.retrieval import RetrievedChunk, deterministic_embedding_values, hybrid_retrieve_chunks

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"


@pytest.mark.integration
def test_pgvector_retrieval_through_app_role_excludes_cross_tenant_chunks() -> None:
    database_url = os.getenv(APP_DATABASE_URL_ENV)
    if database_url is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_a_id = uuid4()
    tenant_b_id = uuid4()
    user_a_id = uuid4()
    course_a_id = uuid4()
    section_a_id = uuid4()
    lesson_a_id = uuid4()
    embedding_id = uuid4()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO tenants (
                    id, slug, name, status, primary_color, locale, time_zone, created_at, updated_at
                )
                VALUES
                    (%s, %s, 'Tenant A', 'active', '#116149', 'en', 'UTC', now(), now()),
                    (%s, %s, 'Tenant B', 'active', '#116149', 'en', 'UTC', now(), now())
                """,
                (
                    tenant_a_id,
                    f"tenant-a-{tenant_a_id.hex}",
                    tenant_b_id,
                    f"tenant-b-{tenant_b_id.hex}",
                ),
            )
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, true)",
                (str(tenant_a_id),),
            )
            cursor.execute(
                """
                INSERT INTO users (
                    id, tenant_id, email, full_name, role, status, password_hash,
                    created_at, updated_at
                )
                VALUES (
                    %s, %s, 'learner@example.com', 'Learner', 'learner', 'active',
                    'hash', now(), now()
                )
                """,
                (user_a_id, tenant_a_id),
            )
            cursor.execute(
                """
                INSERT INTO courses (
                    id, tenant_id, title, slug, status, created_at, updated_at
                )
                VALUES (%s, %s, 'Course A', 'course-a', 'published', now(), now())
                """,
                (course_a_id, tenant_a_id),
            )
            cursor.execute(
                """
                INSERT INTO course_sections (
                    id, tenant_id, course_id, title, position, created_at, updated_at
                )
                VALUES (%s, %s, %s, 'Section A', 1, now(), now())
                """,
                (section_a_id, tenant_a_id, course_a_id),
            )
            cursor.execute(
                """
                INSERT INTO lessons (
                    id, tenant_id, course_id, section_id, title, position, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, 'Lesson A', 1, now(), now())
                """,
                (lesson_a_id, tenant_a_id, course_a_id, section_a_id),
            )
            cursor.execute(
                """
                INSERT INTO lesson_embeddings (
                    id, tenant_id, course_id, lesson_id, lesson_version, chunk_index, chunk_text,
                    embedding, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, 1, 0, 'Tenant A private onboarding',
                    (
                        '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',')
                        || ']'
                    )::vector,
                    now(), now())
                """,
                (embedding_id, tenant_a_id, course_a_id, lesson_a_id),
            )
            connection.commit()

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, true)",
                (str(tenant_b_id),),
            )
            cursor.execute(
                """
                SELECT id
                FROM lesson_embeddings
                WHERE tenant_id = %s
                  AND course_id = %s
                ORDER BY embedding <=> (
                    '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',') || ']'
                )::vector
                """,
                (tenant_a_id, course_a_id),
            )

            assert cursor.fetchall() == []


@pytest.mark.integration
def test_hybrid_retrieval_filters_embedding_provenance() -> None:
    database_url = os.getenv(APP_DATABASE_URL_ENV)
    if database_url is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_id = uuid4()
    user_id = uuid4()
    course_id = uuid4()
    section_id = uuid4()
    lesson_id = uuid4()
    local_embedding_id = uuid4()
    openai_embedding_id = uuid4()

    with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
        cursor.execute(
            """
                INSERT INTO tenants (
                    id, slug, name, status, primary_color, locale, time_zone, created_at, updated_at
                )
                VALUES (%s, %s, 'Provenance Tenant', 'active', '#116149', 'en', 'UTC', now(), now())
                """,
            (tenant_id, f"provenance-{tenant_id.hex}"),
        )
        cursor.execute(
            "SELECT set_config('app.current_tenant_id', %s, true)",
            (str(tenant_id),),
        )
        cursor.execute(
            """
                INSERT INTO users (
                    id, tenant_id, email, full_name, role, status, password_hash,
                    created_at, updated_at
                )
                VALUES (
                    %s, %s, 'provenance@example.com', 'Provenance User', 'learner', 'active',
                    'hash', now(), now()
                )
                """,
            (user_id, tenant_id),
        )
        cursor.execute(
            """
                INSERT INTO courses (
                    id, tenant_id, title, slug, status, created_at, updated_at
                )
                VALUES (%s, %s, 'Provenance Course', %s, 'published', now(), now())
                """,
            (course_id, tenant_id, f"provenance-course-{course_id.hex}"),
        )
        cursor.execute(
            """
                INSERT INTO course_sections (
                    id, tenant_id, course_id, title, position, created_at, updated_at
                )
                VALUES (%s, %s, %s, 'Section', 1, now(), now())
                """,
            (section_id, tenant_id, course_id),
        )
        cursor.execute(
            """
                INSERT INTO lessons (
                    id, tenant_id, course_id, section_id, title, position, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, 'Lesson', 1, now(), now())
                """,
            (lesson_id, tenant_id, course_id, section_id),
        )
        cursor.execute(
            """
                INSERT INTO lesson_embeddings (
                    id, tenant_id, course_id, lesson_id, lesson_version, chunk_index, chunk_text,
                    embedding, embedding_provider, created_at, updated_at
                )
                VALUES
                    (%s, %s, %s, %s, 1, 0, 'Shared onboarding provenance text',
                        (
                            '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',')
                            || ']'
                        )::vector,
                        'local-deterministic', now(), now()),
                    (%s, %s, %s, %s, 1, 1, 'Shared onboarding provenance text',
                        (
                            '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',')
                            || ']'
                        )::vector,
                        'openai-embedding', now(), now())
                """,
            (
                local_embedding_id,
                tenant_id,
                course_id,
                lesson_id,
                openai_embedding_id,
                tenant_id,
                course_id,
                lesson_id,
            ),
        )
        connection.commit()

    chunks = _retrieve_provider_chunks(
        database_url=database_url,
        tenant_id=tenant_id,
        course_id=course_id,
        embedding_provider="openai-embedding",
    )

    assert [chunk.id for chunk in chunks] == [openai_embedding_id]
    assert {chunk.embedding_provider for chunk in chunks} == {"openai-embedding"}


def _retrieve_provider_chunks(
    *,
    database_url: str,
    tenant_id: UUID,
    course_id: UUID,
    embedding_provider: str,
) -> list[RetrievedChunk]:
    async def retrieve() -> list[RetrievedChunk]:
        async_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        engine = create_async_engine(async_url)
        try:
            async with AsyncSession(engine) as session:
                await session.execute(
                    text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
                    {"tenant_id": str(tenant_id)},
                )
                return await hybrid_retrieve_chunks(
                    session,
                    tenant_id=tenant_id,
                    course_id=course_id,
                    question="Shared onboarding provenance text",
                    query_embedding=deterministic_embedding_values(
                        "Shared onboarding provenance text",
                    ),
                    embedding_provider=embedding_provider,
                    limit=5,
                )
        finally:
            await engine.dispose()

    return asyncio.run(retrieve())
