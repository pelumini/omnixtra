import re

from alembic.operations import Operations

IDENTIFIER_PATTERN = re.compile(r"^[a-z_][a-z0-9_]*$")


def enable_tenant_rls(
    op: Operations,
    table_name: str,
    *,
    tenant_column: str = "tenant_id",
) -> None:
    quoted_table = quote_identifier(table_name)
    quoted_tenant_column = quote_identifier(tenant_column)
    tenant_expression = "NULLIF(current_setting('app.current_tenant_id', true), '')::uuid"

    op.execute(f"ALTER TABLE {quoted_table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {quoted_table} FORCE ROW LEVEL SECURITY")
    op.execute(
        f"""
        CREATE POLICY {quote_identifier(f"{table_name}_tenant_select")}
        ON {quoted_table}
        FOR SELECT
        USING ({quoted_tenant_column} = {tenant_expression})
        """,
    )
    op.execute(
        f"""
        CREATE POLICY {quote_identifier(f"{table_name}_tenant_insert")}
        ON {quoted_table}
        FOR INSERT
        WITH CHECK ({quoted_tenant_column} = {tenant_expression})
        """,
    )
    op.execute(
        f"""
        CREATE POLICY {quote_identifier(f"{table_name}_tenant_update")}
        ON {quoted_table}
        FOR UPDATE
        USING ({quoted_tenant_column} = {tenant_expression})
        WITH CHECK ({quoted_tenant_column} = {tenant_expression})
        """,
    )
    op.execute(
        f"""
        CREATE POLICY {quote_identifier(f"{table_name}_tenant_delete")}
        ON {quoted_table}
        FOR DELETE
        USING ({quoted_tenant_column} = {tenant_expression})
        """,
    )


def disable_tenant_rls(op: Operations, table_name: str) -> None:
    quoted_table = quote_identifier(table_name)
    for action in ("select", "insert", "update", "delete"):
        op.execute(
            f"DROP POLICY IF EXISTS {quote_identifier(f'{table_name}_tenant_{action}')} "
            f"ON {quoted_table}",
        )
    op.execute(f"ALTER TABLE {quoted_table} NO FORCE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {quoted_table} DISABLE ROW LEVEL SECURITY")


def quote_identifier(identifier: str) -> str:
    if IDENTIFIER_PATTERN.fullmatch(identifier) is None:
        msg = f"invalid SQL identifier: {identifier}"
        raise ValueError(msg)
    return f'"{identifier}"'
