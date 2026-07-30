# RLS Benchmark

Sprint 1 uses a synthetic benchmark to keep tenant isolation overhead visible while the data model is still small.

Run against a migrated local database using the app role:

```bash
cd api
uv run python -m scripts.benchmark_rls \
  --database-url postgresql://omnixtra_app:omnixtra_app_password@localhost:15432/omnixtra \
  --rows-per-tenant 500 \
  --queries 100 \
  --max-overhead-percent 5
```

The benchmark compares median point-read latency on the tenant-owned RLS probe table against an equivalent temporary non-RLS baseline table in the same database session.

The Sprint 1 target is approximately under 5% overhead on representative workloads. The current script is a smoke benchmark, not a production performance certification; larger datasets should be run before production launch.

Latest Sprint 1 smoke result:

```text
rows_per_tenant=200 queries=50
rls_median_ms=1.6366 baseline_median_ms=1.6350 overhead_percent=0.10 passed=True
```
