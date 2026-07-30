# Adding Tenant-Owned Tables

Tenant-owned tables must use all three isolation layers from ADR-002:

1. Include a non-null `tenant_id` column.
2. Use the SQLAlchemy `TenantOwnedMixin`.
3. Add compound indexes that begin with `tenant_id` for common access paths.
4. Call `enable_tenant_rls(op, "<table_name>")` in the creation migration.
5. Call `disable_tenant_rls(op, "<table_name>")` before dropping the table in downgrade.
6. Add tenant isolation tests for every route that touches the table.

CI runs `uv run python -m scripts.check_rls_migrations` and fails if a migration creates a table with `tenant_id` but does not call the RLS helper.
