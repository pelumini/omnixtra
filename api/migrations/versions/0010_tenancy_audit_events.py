"""Create tenancy audit events.

Revision ID: 0010_tenancy_audit
Revises: 0009_refresh_sessions
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0010_tenancy_audit"
down_revision: str | None = "0009_refresh_sessions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenancy_audit_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("summary", sa.String(length=300), nullable=False),
        sa.Column("event_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_tenancy_audit_events_tenant_id_id",
        "tenancy_audit_events",
        ["tenant_id", "id"],
    )
    op.create_index(
        "ix_tenancy_audit_events_tenant_id_actor_id",
        "tenancy_audit_events",
        ["tenant_id", "actor_id"],
    )
    op.create_index(
        "ix_tenancy_audit_events_tenant_id_action",
        "tenancy_audit_events",
        ["tenant_id", "action"],
    )
    enable_tenant_rls(op, "tenancy_audit_events")
    grant_table_privileges(op, "tenancy_audit_events")


def downgrade() -> None:
    disable_tenant_rls(op, "tenancy_audit_events")
    op.drop_index("ix_tenancy_audit_events_tenant_id_action", table_name="tenancy_audit_events")
    op.drop_index("ix_tenancy_audit_events_tenant_id_actor_id", table_name="tenancy_audit_events")
    op.drop_index("ix_tenancy_audit_events_tenant_id_id", table_name="tenancy_audit_events")
    op.drop_table("tenancy_audit_events")
