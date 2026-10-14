"""Add course builder metadata.

Revision ID: 0017_course_builder_metadata
Revises: 0016_course_setup_metadata
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0017_course_builder_metadata"
down_revision: str | None = "0016_course_setup_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("course_sections", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("course_sections", sa.Column("image_url", sa.String(700), nullable=True))
    op.add_column("lessons", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("lessons", sa.Column("image_url", sa.String(700), nullable=True))
    op.add_column("lessons", sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True))
    op.add_column(
        "lessons",
        sa.Column(
            "required_for_completion", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
    )
    op.add_column(
        "courses",
        sa.Column("access", sa.String(32), server_default="enrolled_only", nullable=False),
    )
    op.add_column(
        "courses",
        sa.Column("complete_in_order", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "courses",
        sa.Column(
            "certificate_on_completion", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("courses", "certificate_on_completion")
    op.drop_column("courses", "complete_in_order")
    op.drop_column("courses", "access")
    op.drop_column("lessons", "required_for_completion")
    op.drop_column("lessons", "estimated_duration_minutes")
    op.drop_column("lessons", "image_url")
    op.drop_column("lessons", "summary")
    op.drop_column("course_sections", "image_url")
    op.drop_column("course_sections", "description")
