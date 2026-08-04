"""Add membership and invitation planes.

Revision ID: 0012_identity_membership_authz
Revises: 0011_ai_embedding_provenance
Create Date: 2026-08-04
"""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0012_identity_membership_authz"
down_revision: str | None = "0011_ai_embedding_provenance"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("description", sa.String(length=1000), nullable=True))
    op.add_column(
        "enrolments",
        sa.Column("course_role", sa.String(length=32), nullable=False, server_default="learner"),
    )
    op.alter_column("enrolments", "course_role", server_default=None)

    op.create_table(
        "memberships",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("org_role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "user_id", name="uq_memberships_tenant_user"),
    )
    op.create_index("ix_memberships_tenant_id_id", "memberships", ["tenant_id", "id"])
    op.create_index("ix_memberships_tenant_id_user_id", "memberships", ["tenant_id", "user_id"])
    enable_tenant_rls(op, "memberships")
    grant_table_privileges(op, "memberships")

    op.create_table(
        "invitations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("org_role", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "email", name="uq_invitations_tenant_email"),
        sa.UniqueConstraint("token_hash", name="uq_invitations_token_hash"),
    )
    op.create_index("ix_invitations_tenant_id_id", "invitations", ["tenant_id", "id"])
    op.create_index("ix_invitations_tenant_id_email", "invitations", ["tenant_id", "email"])
    enable_tenant_rls(op, "invitations")
    grant_table_privileges(op, "invitations")

    _backfill_memberships()


def downgrade() -> None:
    disable_tenant_rls(op, "invitations")
    op.drop_index("ix_invitations_tenant_id_email", table_name="invitations")
    op.drop_index("ix_invitations_tenant_id_id", table_name="invitations")
    op.drop_table("invitations")
    disable_tenant_rls(op, "memberships")
    op.drop_index("ix_memberships_tenant_id_user_id", table_name="memberships")
    op.drop_index("ix_memberships_tenant_id_id", table_name="memberships")
    op.drop_table("memberships")
    op.drop_column("enrolments", "course_role")
    op.drop_column("tenants", "description")


def _backfill_memberships() -> None:
    connection = op.get_bind()
    tenant_ids = connection.execute(sa.text("SELECT id::text FROM tenants")).scalars()
    for tenant_id in tenant_ids:
        connection.execute(
            sa.text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
            {"tenant_id": tenant_id},
        )
        users = connection.execute(
            sa.text(
                """
                SELECT id::text, role
                FROM users
                WHERE tenant_id = :tenant_id
                  AND deleted_at IS NULL
                """,
            ),
            {"tenant_id": tenant_id},
        )
        for user_id, role in users:
            org_role = "tenant_admin" if role in {"org_admin", "tenant_admin"} else "member"
            connection.execute(
                sa.text(
                    """
                    INSERT INTO memberships (
                        id, tenant_id, user_id, org_role, created_at, updated_at
                    )
                    VALUES (:id, :tenant_id, :user_id, :org_role, now(), now())
                    ON CONFLICT (tenant_id, user_id) DO NOTHING
                    """,
                ),
                {
                    "id": str(uuid4()),
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "org_role": org_role,
                },
            )
    connection.execute(sa.text("SELECT set_config('app.current_tenant_id', '', true)"))
