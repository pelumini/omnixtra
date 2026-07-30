"""Create course media asset table.

Revision ID: 0005_course_media
Revises: 0004_courses
Create Date: 2026-07-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0005_course_media"
down_revision: str | None = "0004_courses"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "course_media_assets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("course_id", sa.Uuid(), nullable=False),
        sa.Column("object_key", sa.String(length=700), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("byte_size", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "object_key", name="uq_course_media_tenant_object_key"),
    )
    op.create_index(
        "ix_course_media_assets_tenant_id_id",
        "course_media_assets",
        ["tenant_id", "id"],
    )
    op.create_index(
        "ix_course_media_assets_tenant_id_course_id",
        "course_media_assets",
        ["tenant_id", "course_id"],
    )
    op.create_index(
        "ix_course_media_assets_tenant_id_object_key",
        "course_media_assets",
        ["tenant_id", "object_key"],
    )
    enable_tenant_rls(op, "course_media_assets")
    grant_table_privileges(op, "course_media_assets")


def downgrade() -> None:
    disable_tenant_rls(op, "course_media_assets")
    op.drop_table("course_media_assets")
