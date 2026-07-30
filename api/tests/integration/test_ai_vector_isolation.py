import os
from uuid import uuid4

import psycopg
import pytest

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
