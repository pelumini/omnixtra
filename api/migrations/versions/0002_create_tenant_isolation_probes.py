"""Create tenant isolation probes table.

Revision ID: 0002_rls_probes
Revises: 0001_tenants
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0002_rls_probes"
down_revision: str | None = "0001_tenants"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenant_isolation_probes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_tenant_isolation_probes_tenant_id_id",
        "tenant_isolation_probes",
        ["tenant_id", "id"],
    )
    enable_tenant_rls(op, "tenant_isolation_probes")
    grant_table_privileges(op, "tenant_isolation_probes")


def downgrade() -> None:
    disable_tenant_rls(op, "tenant_isolation_probes")
    op.drop_index("ix_tenant_isolation_probes_tenant_id_id", table_name="tenant_isolation_probes")
    op.drop_table("tenant_isolation_probes")
