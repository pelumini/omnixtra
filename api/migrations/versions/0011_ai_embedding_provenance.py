"""Add AI embedding provider provenance.

Revision ID: 0011_ai_embedding_provenance
Revises: 0010_tenancy_audit
Create Date: 2026-07-30 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0011_ai_embedding_provenance"
down_revision = "0010_tenancy_audit"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "lesson_embeddings",
        sa.Column(
            "embedding_provider",
            sa.String(length=64),
            nullable=False,
            server_default="local-deterministic",
        ),
    )
    op.create_index(
        "ix_lesson_embeddings_tenant_course_provider",
        "lesson_embeddings",
        ["tenant_id", "course_id", "embedding_provider"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_lesson_embeddings_tenant_course_provider",
        table_name="lesson_embeddings",
    )
    op.drop_column("lesson_embeddings", "embedding_provider")
