from alembic.operations import Operations

APP_ROLE = "omnixtra_app"
SUPERADMIN_ROLE = "omnixtra_superadmin"


def grant_table_privileges(op: Operations, table_name: str) -> None:
    op.execute(f'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "{table_name}" TO {APP_ROLE}')
    op.execute(f'GRANT SELECT ON TABLE "{table_name}" TO {SUPERADMIN_ROLE}')
