"""Create refresh sessions.

Revision ID: 0009_refresh_sessions
Revises: 0008_billing
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0009_refresh_sessions"
down_revision: str | None = "0008_billing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("replaced_by_id", sa.Uuid(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["replaced_by_id"], ["refresh_sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_refresh_sessions_token_hash"),
    )
    op.create_index(
        "ix_refresh_sessions_tenant_id_user_id",
        "refresh_sessions",
        ["tenant_id", "user_id"],
    )
    op.create_index("ix_refresh_sessions_tenant_id_id", "refresh_sessions", ["tenant_id", "id"])
    enable_tenant_rls(op, "refresh_sessions")
    grant_table_privileges(op, "refresh_sessions")


def downgrade() -> None:
    disable_tenant_rls(op, "refresh_sessions")
    op.drop_index("ix_refresh_sessions_tenant_id_id", table_name="refresh_sessions")
    op.drop_index("ix_refresh_sessions_tenant_id_user_id", table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
