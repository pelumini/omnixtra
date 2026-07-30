"""Create tenants table.

Revision ID: 0001_tenants
Revises:
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges

revision: str = "0001_tenants"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=63), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("logo_url", sa.String(length=2048), nullable=True),
        sa.Column("primary_color", sa.String(length=16), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False),
        sa.Column("time_zone", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_tenants_slug"),
    )
    op.create_index("ix_tenants_slug_status", "tenants", ["slug", "status"])
    grant_table_privileges(op, "tenants")


def downgrade() -> None:
    op.drop_index("ix_tenants_slug_status", table_name="tenants")
    op.drop_table("tenants")
