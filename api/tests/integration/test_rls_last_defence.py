import os
from uuid import uuid4

import psycopg
import pytest

APP_DATABASE_URL_ENV = "OMNIXTRA_TEST_DATABASE_URL"


@pytest.mark.integration
def test_raw_sql_with_app_role_cannot_read_cross_tenant_rows() -> None:
    database_url = os.getenv(APP_DATABASE_URL_ENV)
    if database_url is None:
        pytest.skip(f"{APP_DATABASE_URL_ENV} is not set")

    tenant_a_id = uuid4()
    tenant_b_id = uuid4()
    tenant_a_probe_id = uuid4()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO tenants (
                    id, slug, name, status, primary_color, locale, time_zone, created_at, updated_at
                )
                VALUES
                    (%s, 'tenant-a', 'Tenant A', 'active', '#116149', 'en', 'UTC', now(), now()),
                    (%s, 'tenant-b', 'Tenant B', 'active', '#116149', 'en', 'UTC', now(), now())
                """,
                (tenant_a_id, tenant_b_id),
            )
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, true)",
                (str(tenant_a_id),),
            )
            cursor.execute(
                """
                INSERT INTO tenant_isolation_probes (
                    id, tenant_id, label, created_at, updated_at
                )
                VALUES (%s, %s, 'Tenant A probe', now(), now())
                """,
                (tenant_a_probe_id, tenant_a_id),
            )
            connection.commit()

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT set_config('app.current_tenant_id', %s, true)",
                (str(tenant_b_id),),
            )
            cursor.execute(
                "SELECT id FROM tenant_isolation_probes WHERE id = %s",
                (tenant_a_probe_id,),
            )

            assert cursor.fetchall() == []
