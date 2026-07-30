"""Create billing tables.

Revision ID: 0008_billing
Revises: 0007_ai_tutor
Create Date: 2026-07-30
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.core.db_privileges import APP_ROLE, SUPERADMIN_ROLE, grant_table_privileges
from app.tenancy.rls import disable_tenant_rls, enable_tenant_rls

revision: str = "0008_billing"
down_revision: str | None = "0007_ai_tutor"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PLAN_ROWS = (
    {
        "slug": "starter",
        "name": "Starter",
        "monthly_price_cents": 4900,
        "currency": "usd",
        "included_admin_seats": 3,
        "included_learners": 50,
        "included_storage_gb": 10,
        "trial_days": 14,
        "status": "active",
    },
    {
        "slug": "growth",
        "name": "Growth",
        "monthly_price_cents": 14900,
        "currency": "usd",
        "included_admin_seats": 10,
        "included_learners": 250,
        "included_storage_gb": 50,
        "trial_days": 14,
        "status": "active",
    },
    {
        "slug": "business",
        "name": "Business",
        "monthly_price_cents": 39900,
        "currency": "usd",
        "included_admin_seats": 25,
        "included_learners": 1000,
        "included_storage_gb": 200,
        "trial_days": 14,
        "status": "active",
    },
)


def upgrade() -> None:
    op.create_table(
        "billing_plans",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("monthly_price_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("included_admin_seats", sa.Integer(), nullable=False),
        sa.Column("included_learners", sa.Integer(), nullable=False),
        sa.Column("included_storage_gb", sa.Integer(), nullable=False),
        sa.Column("trial_days", sa.Integer(), nullable=False),
        sa.Column("stripe_price_id", sa.String(length=120), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_billing_plans_slug", "billing_plans", ["slug"])
    op.create_index("ix_billing_plans_status", "billing_plans", ["status"])

    billing_plans = sa.table(
        "billing_plans",
        sa.column("id", sa.Uuid()),
        sa.column("slug", sa.String()),
        sa.column("name", sa.String()),
        sa.column("monthly_price_cents", sa.Integer()),
        sa.column("currency", sa.String()),
        sa.column("included_admin_seats", sa.Integer()),
        sa.column("included_learners", sa.Integer()),
        sa.column("included_storage_gb", sa.Integer()),
        sa.column("trial_days", sa.Integer()),
        sa.column("status", sa.String()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        billing_plans,
        [
            {
                **row,
                "id": uuid4(),
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            for row in PLAN_ROWS
        ],
    )

    op.create_table(
        "tenant_subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=120), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(length=120), nullable=True),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False),
        sa.Column("seats_used", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["plan_id"], ["billing_plans.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "stripe_customer_id", name="uq_subscription_customer"),
        sa.UniqueConstraint(
            "tenant_id",
            "stripe_subscription_id",
            name="uq_subscription_stripe_subscription",
        ),
    )
    _tenant_indexes(
        "tenant_subscriptions",
        ("id", "plan_id", "status", "stripe_customer_id", "stripe_subscription_id"),
    )

    op.create_table(
        "billing_audit_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("summary", sa.String(length=300), nullable=False),
        sa.Column("event_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    _tenant_indexes("billing_audit_events", ("id", "actor_id", "action"))

    for table_name in ("tenant_subscriptions", "billing_audit_events"):
        enable_tenant_rls(op, table_name)
        grant_table_privileges(op, table_name)
    op.execute(f'GRANT SELECT ON TABLE "billing_plans" TO {APP_ROLE}')
    op.execute(f'GRANT SELECT ON TABLE "billing_plans" TO {SUPERADMIN_ROLE}')


def downgrade() -> None:
    for table_name in ("billing_audit_events", "tenant_subscriptions"):
        disable_tenant_rls(op, table_name)
        op.drop_table(table_name)
    op.drop_table("billing_plans")


def _tenant_indexes(table_name: str, columns: tuple[str, ...]) -> None:
    for column in columns:
        op.create_index(f"ix_{table_name}_tenant_id_{column}", table_name, ["tenant_id", column])
