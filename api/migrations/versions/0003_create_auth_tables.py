"""Create auth tables.

Revision ID: 0003_auth
Revises: 0002_rls_probes
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0003_auth"
down_revision: str | None = "0002_rls_probes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )
    op.create_index("ix_users_tenant_id_id", "users", ["tenant_id", "id"])
    op.create_index("ix_users_tenant_id_email", "users", ["tenant_id", "email"])
    enable_tenant_rls(op, "users")
    grant_table_privileges(op, "users")

    op.create_table(
        "auth_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_auth_tokens_token_hash"),
    )
    op.create_index("ix_auth_tokens_tenant_id_id", "auth_tokens", ["tenant_id", "id"])
    op.create_index("ix_auth_tokens_tenant_id_email", "auth_tokens", ["tenant_id", "email"])
    enable_tenant_rls(op, "auth_tokens")
    grant_table_privileges(op, "auth_tokens")


def downgrade() -> None:
    disable_tenant_rls(op, "auth_tokens")
    op.drop_index("ix_auth_tokens_tenant_id_email", table_name="auth_tokens")
    op.drop_index("ix_auth_tokens_tenant_id_id", table_name="auth_tokens")
    op.drop_table("auth_tokens")
    disable_tenant_rls(op, "users")
    op.drop_index("ix_users_tenant_id_email", table_name="users")
    op.drop_index("ix_users_tenant_id_id", table_name="users")
    op.drop_table("users")
