import argparse
import statistics
import time
from collections.abc import Sequence
from dataclasses import dataclass
from sys import stdout
from typing import Protocol
from uuid import UUID, uuid4

import psycopg
from psycopg import Connection

DEFAULT_ROWS_PER_TENANT = 500
DEFAULT_QUERY_COUNT = 100
DEFAULT_MAX_OVERHEAD_PERCENT = 5.0
POINT_READ_QUERIES = {
    "tenant_isolation_probes": (
        'SELECT id FROM "tenant_isolation_probes" WHERE tenant_id = %s AND id = %s'
    ),
    "tenant_isolation_probe_baseline": (
        'SELECT id FROM "tenant_isolation_probe_baseline" WHERE tenant_id = %s AND id = %s'
    ),
}


@dataclass(frozen=True)
class BenchmarkResult:
    rls_median_ms: float
    baseline_median_ms: float
    overhead_percent: float
    passed: bool


class Cursor(Protocol):
    def execute(self, query: str, params: tuple[object, ...] | None = None) -> object: ...

    def executemany(self, query: str, params_seq: Sequence[tuple[object, ...]]) -> object: ...

    def fetchall(self) -> list[tuple[object, ...]]: ...


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Benchmark tenant RLS overhead on synthetic data.")
    parser.add_argument("--database-url", required=True)
    parser.add_argument("--rows-per-tenant", type=int, default=DEFAULT_ROWS_PER_TENANT)
    parser.add_argument("--queries", type=int, default=DEFAULT_QUERY_COUNT)
    parser.add_argument("--max-overhead-percent", type=float, default=DEFAULT_MAX_OVERHEAD_PERCENT)
    args = parser.parse_args(argv)

    result = run_benchmark(
        args.database_url,
        rows_per_tenant=args.rows_per_tenant,
        query_count=args.queries,
        max_overhead_percent=args.max_overhead_percent,
    )
    stdout.write(
        f"rls_median_ms={result.rls_median_ms:.4f} "
        f"baseline_median_ms={result.baseline_median_ms:.4f} "
        f"overhead_percent={result.overhead_percent:.2f} "
        f"passed={result.passed}\n",
    )
    return 0 if result.passed else 1


def run_benchmark(
    database_url: str,
    *,
    rows_per_tenant: int,
    query_count: int,
    max_overhead_percent: float,
) -> BenchmarkResult:
    tenant_a_id = uuid4()
    tenant_b_id = uuid4()
    with psycopg.connect(database_url) as connection:
        tenant_a_probe_ids = _setup_benchmark_data(
            connection,
            tenant_a_id,
            tenant_b_id,
            rows_per_tenant,
        )
        rls_timings = _measure_queries(
            connection,
            table_name="tenant_isolation_probes",
            tenant_id=tenant_a_id,
            probe_ids=tenant_a_probe_ids,
            query_count=query_count,
        )
        baseline_timings = _measure_queries(
            connection,
            table_name="tenant_isolation_probe_baseline",
            tenant_id=tenant_a_id,
            probe_ids=tenant_a_probe_ids,
            query_count=query_count,
        )
        _drop_baseline_table(connection)

    rls_median_ms = statistics.median(rls_timings)
    baseline_median_ms = statistics.median(baseline_timings)
    overhead_percent = _overhead_percent(rls_median_ms, baseline_median_ms)
    return BenchmarkResult(
        rls_median_ms=rls_median_ms,
        baseline_median_ms=baseline_median_ms,
        overhead_percent=overhead_percent,
        passed=overhead_percent <= max_overhead_percent,
    )


def _setup_benchmark_data(
    connection: Connection[tuple[object, ...]],
    tenant_a_id: UUID,
    tenant_b_id: UUID,
    rows_per_tenant: int,
) -> list[UUID]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO tenants (
                id, slug, name, status, primary_color, locale, time_zone, created_at, updated_at
            )
            VALUES
                (%s, %s, 'Benchmark A', 'active', '#116149', 'en', 'UTC', now(), now()),
                (%s, %s, 'Benchmark B', 'active', '#116149', 'en', 'UTC', now(), now())
            """,
            (
                tenant_a_id,
                f"bench-a-{tenant_a_id.hex[:8]}",
                tenant_b_id,
                f"bench-b-{tenant_b_id.hex[:8]}",
            ),
        )
        tenant_a_probe_ids = _insert_probe_rows(cursor, tenant_a_id, rows_per_tenant)
        tenant_b_probe_ids = _insert_probe_rows(cursor, tenant_b_id, rows_per_tenant)
        cursor.execute(
            """
            CREATE TEMPORARY TABLE tenant_isolation_probe_baseline (
                id uuid NOT NULL,
                tenant_id uuid NOT NULL,
                label varchar(120) NOT NULL
            )
            """,
        )
        _insert_baseline_rows(cursor, tenant_a_id, tenant_a_probe_ids)
        _insert_baseline_rows(cursor, tenant_b_id, tenant_b_probe_ids)
        cursor.execute(
            """
            CREATE INDEX ix_probe_baseline_tenant_id_id
            ON tenant_isolation_probe_baseline (tenant_id, id)
            """,
        )
    connection.commit()
    return tenant_a_probe_ids


def _insert_probe_rows(cursor: Cursor, tenant_id: UUID, row_count: int) -> list[UUID]:
    probe_ids = [uuid4() for _ in range(row_count)]
    cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))
    cursor.executemany(
        """
        INSERT INTO tenant_isolation_probes (
            id, tenant_id, label, created_at, updated_at
        )
        VALUES (%s, %s, %s, now(), now())
        """,
        [
            (probe_id, tenant_id, f"benchmark-row-{index:06d}")
            for index, probe_id in enumerate(probe_ids)
        ],
    )
    return probe_ids


def _insert_baseline_rows(cursor: Cursor, tenant_id: UUID, probe_ids: Sequence[UUID]) -> None:
    cursor.executemany(
        """
        INSERT INTO tenant_isolation_probe_baseline (id, tenant_id, label)
        VALUES (%s, %s, %s)
        """,
        [
            (probe_id, tenant_id, f"benchmark-row-{index:06d}")
            for index, probe_id in enumerate(probe_ids)
        ],
    )


def _measure_queries(
    connection: Connection[tuple[object, ...]],
    *,
    table_name: str,
    tenant_id: UUID,
    probe_ids: Sequence[UUID],
    query_count: int,
) -> list[float]:
    timings: list[float] = []
    query = POINT_READ_QUERIES[table_name]
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))
        for index in range(query_count):
            probe_id = probe_ids[index % len(probe_ids)]
            start = time.perf_counter()
            cursor.execute(
                query,
                (tenant_id, probe_id),
            )
            cursor.fetchall()
            timings.append((time.perf_counter() - start) * 1000)
    return timings


def _drop_baseline_table(connection: Connection[tuple[object, ...]]) -> None:
    with connection.cursor() as cursor:
        cursor.execute('DROP TABLE IF EXISTS "tenant_isolation_probe_baseline"')
    connection.commit()


def _overhead_percent(rls_median_ms: float, baseline_median_ms: float) -> float:
    if baseline_median_ms <= 0:
        return 0
    return ((rls_median_ms - baseline_median_ms) / baseline_median_ms) * 100


if __name__ == "__main__":
    raise SystemExit(main())
