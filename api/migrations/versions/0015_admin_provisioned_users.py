"""Add provisioned user profile fields.

Revision ID: 0015_admin_provisioned_users
Revises: 0014_invitation_copy_link_token
Create Date: 2026-10-09
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015_admin_provisioned_users"
down_revision: str | None = "0014_invitation_copy_link_token"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE users
            SET first_name = split_part(trim(full_name), ' ', 1),
                last_name = CASE
                    WHEN position(' ' in trim(full_name)) > 0
                    THEN ltrim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1))
                    ELSE ''
                END
            """
        )
    )


def downgrade() -> None:
    op.drop_column("users", "phone")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
