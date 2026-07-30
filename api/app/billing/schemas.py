from datetime import datetime
from uuid import UUID

from pydantic import AnyUrl, BaseModel, Field


class BillingPlanResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    monthly_price_cents: int
    currency: str
    included_admin_seats: int
    included_learners: int
    included_storage_gb: int
    trial_days: int


class SubscriptionResponse(BaseModel):
    id: UUID
    plan_slug: str
    status: str
    stripe_customer_id: str | None
    stripe_subscription_id: str | None
    current_period_start: datetime | None
    current_period_end: datetime | None
    trial_ends_at: datetime | None
    cancel_at_period_end: bool
    seats_used: int


class CheckoutSessionRequest(BaseModel):
    plan_slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    success_url: AnyUrl
    cancel_url: AnyUrl


class CheckoutSessionResponse(BaseModel):
    provider_session_id: str
    url: str


class PlanChangeRequest(BaseModel):
    plan_slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")


class StripeSubscriptionEvent(BaseModel):
    tenant_id: UUID
    plan_slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    status: str = Field(min_length=2, max_length=32)
    stripe_customer_id: str = Field(min_length=3, max_length=120)
    stripe_subscription_id: str = Field(min_length=3, max_length=120)
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    trial_ends_at: datetime | None = None
    cancel_at_period_end: bool = False


class WebhookAcceptedResponse(BaseModel):
    accepted: bool


__all__ = [
    "BillingPlanResponse",
    "CheckoutSessionRequest",
    "CheckoutSessionResponse",
    "PlanChangeRequest",
    "StripeSubscriptionEvent",
    "SubscriptionResponse",
    "WebhookAcceptedResponse",
]
