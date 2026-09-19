"""Store invitation token for admin copy-link testing.

Revision ID: 0014_invitation_copy_link_token
Revises: 0013_sso_foundation
Create Date: 2026-08-10
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014_invitation_copy_link_token"
down_revision: str | None = "0013_sso_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("invitations", sa.Column("raw_token", sa.String(length=256), nullable=True))


def downgrade() -> None:
    op.drop_column("invitations", "raw_token")
