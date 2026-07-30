from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class BillingPlanStatus(StrEnum):
    active = "active"
    archived = "archived"


class SubscriptionStatus(StrEnum):
    incomplete = "incomplete"
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    unpaid = "unpaid"


class BillingPlan(TimestampMixin, Base):
    __tablename__ = "billing_plans"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    monthly_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="usd")
    included_admin_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    included_learners: Mapped[int] = mapped_column(Integer, nullable=False)
    included_storage_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    stripe_price_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=BillingPlanStatus.active.value,
    )


class TenantSubscription(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "tenant_subscriptions"
    __table_args__ = (
        UniqueConstraint("tenant_id", "stripe_customer_id", name="uq_subscription_customer"),
        UniqueConstraint(
            "tenant_id",
            "stripe_subscription_id",
            name="uq_subscription_stripe_subscription",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(ForeignKey("billing_plans.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    current_period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    seats_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class BillingAuditEvent(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "billing_audit_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    actor_id: Mapped[UUID | None] = mapped_column(nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    summary: Mapped[str] = mapped_column(String(300), nullable=False)
    event_data: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)


__all__ = [
    "BillingAuditEvent",
    "BillingPlan",
    "BillingPlanStatus",
    "SubscriptionStatus",
    "TenantSubscription",
]
