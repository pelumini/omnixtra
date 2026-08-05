"""Add SSO provider foundation.

Revision ID: 0013_sso_foundation
Revises: 0012_identity_membership_authz
Create Date: 2026-08-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.core.db_privileges import grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0013_sso_foundation"
down_revision: str | None = "0012_identity_membership_authz"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sso_identity_providers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("protocol", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("issuer", sa.String(length=2048), nullable=True),
        sa.Column("authorization_url", sa.String(length=2048), nullable=True),
        sa.Column("token_url", sa.String(length=2048), nullable=True),
        sa.Column("jwks_url", sa.String(length=2048), nullable=True),
        sa.Column("metadata_url", sa.String(length=2048), nullable=True),
        sa.Column("entity_id", sa.String(length=2048), nullable=True),
        sa.Column("sso_url", sa.String(length=2048), nullable=True),
        sa.Column("certificate_fingerprint", sa.String(length=128), nullable=True),
        sa.Column("client_id", sa.String(length=255), nullable=True),
        sa.Column("client_secret_ref", sa.String(length=255), nullable=True),
        sa.Column("attribute_mapping", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "name", name="uq_sso_identity_providers_tenant_name"),
    )
    op.create_index(
        "ix_sso_identity_providers_tenant_id_id",
        "sso_identity_providers",
        ["tenant_id", "id"],
    )
    op.create_index(
        "ix_sso_identity_providers_tenant_id_protocol",
        "sso_identity_providers",
        ["tenant_id", "protocol"],
    )
    enable_tenant_rls(op, "sso_identity_providers")
    grant_table_privileges(op, "sso_identity_providers")

    op.create_table(
        "sso_login_states",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("provider_id", sa.Uuid(), nullable=False),
        sa.Column("state_hash", sa.String(length=128), nullable=False),
        sa.Column("nonce_hash", sa.String(length=128), nullable=True),
        sa.Column("relay_state_hash", sa.String(length=128), nullable=True),
        sa.Column("redirect_uri", sa.String(length=2048), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["provider_id"], ["sso_identity_providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("state_hash", name="uq_sso_login_states_state_hash"),
    )
    op.create_index(
        "ix_sso_login_states_tenant_id_id",
        "sso_login_states",
        ["tenant_id", "id"],
    )
    op.create_index(
        "ix_sso_login_states_tenant_id_provider_id",
        "sso_login_states",
        ["tenant_id", "provider_id"],
    )
    enable_tenant_rls(op, "sso_login_states")
    grant_table_privileges(op, "sso_login_states")


def downgrade() -> None:
    disable_tenant_rls(op, "sso_login_states")
    op.drop_index("ix_sso_login_states_tenant_id_provider_id", table_name="sso_login_states")
    op.drop_index("ix_sso_login_states_tenant_id_id", table_name="sso_login_states")
    op.drop_table("sso_login_states")
    disable_tenant_rls(op, "sso_identity_providers")
    op.drop_index(
        "ix_sso_identity_providers_tenant_id_protocol",
        table_name="sso_identity_providers",
    )
    op.drop_index("ix_sso_identity_providers_tenant_id_id", table_name="sso_identity_providers")
    op.drop_table("sso_identity_providers")
