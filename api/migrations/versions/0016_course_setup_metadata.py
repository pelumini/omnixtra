"""Add optional course setup metadata.

Revision ID: 0016_course_setup_metadata
Revises: 0015_admin_provisioned_users
Create Date: 2026-10-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016_course_setup_metadata"
down_revision: str | None = "0015_admin_provisioned_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("thumbnail_url", sa.String(length=700), nullable=True))
    op.add_column("courses", sa.Column("category", sa.String(length=120), nullable=True))
    op.add_column("courses", sa.Column("tags", postgresql.JSONB(), nullable=True))
    op.add_column("courses", sa.Column("language", sa.String(length=16), nullable=True))
    op.add_column("courses", sa.Column("learning_outcomes", postgresql.JSONB(), nullable=True))
    op.add_column("courses", sa.Column("target_audience", sa.Text(), nullable=True))
    op.add_column("courses", sa.Column("difficulty", sa.String(length=32), nullable=True))
    op.add_column("courses", sa.Column("delivery_format", sa.String(length=32), nullable=True))
    op.add_column("courses", sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("courses", "estimated_duration_minutes")
    op.drop_column("courses", "delivery_format")
    op.drop_column("courses", "difficulty")
    op.drop_column("courses", "target_audience")
    op.drop_column("courses", "learning_outcomes")
    op.drop_column("courses", "language")
    op.drop_column("courses", "tags")
    op.drop_column("courses", "category")
    op.drop_column("courses", "thumbnail_url")
