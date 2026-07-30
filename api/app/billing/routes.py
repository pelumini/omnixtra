from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AuthPrincipal, require_permission
from app.billing.schemas import (
    BillingPlanResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    StripeSubscriptionEvent,
    SubscriptionResponse,
    WebhookAcceptedResponse,
)
from app.billing.services import (
    BillingProvider,
    LocalBillingProvider,
    StripeBillingProvider,
    apply_signed_stripe_webhook,
    apply_stripe_subscription_event,
    create_checkout_session,
    get_current_subscription,
    list_plans,
)
from app.core.config import get_settings
from app.core.database import get_session
from app.shared.responses import Envelope, Meta

SessionDep = Annotated[AsyncSession, Depends(get_session)]
PrincipalDep = Annotated[AuthPrincipal, Depends(require_permission("billing:manage"))]
IdempotencyKeyHeader = Annotated[str, Header(min_length=8, max_length=120)]


def get_billing_provider() -> BillingProvider:
    if get_settings().stripe_secret_key:
        return StripeBillingProvider()
    return LocalBillingProvider()


ProviderDep = Annotated[BillingProvider, Depends(get_billing_provider)]

router = APIRouter(
    prefix="/billing",
    tags=["tenant-owned"],
    dependencies=[Depends(require_permission("billing:manage"))],
)
webhook_router = APIRouter(prefix="/billing/webhooks", tags=["billing"])


@router.get("/plans")
async def list_plans_route(session: SessionDep) -> Envelope[list[BillingPlanResponse]]:
    response = await list_plans(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/subscription")
async def current_subscription_route(
    session: SessionDep,
) -> Envelope[SubscriptionResponse | None]:
    response = await get_current_subscription(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/checkout-sessions")
async def create_checkout_session_route(
    request: CheckoutSessionRequest,
    session: SessionDep,
    principal: PrincipalDep,
    provider: ProviderDep,
    idempotency_key: IdempotencyKeyHeader,
) -> Envelope[CheckoutSessionResponse]:
    response = await create_checkout_session(
        session,
        request,
        provider,
        actor_id=principal.user_id,
        idempotency_key=idempotency_key,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


@webhook_router.post("/stripe/subscription")
async def stripe_subscription_webhook_route(
    request: StripeSubscriptionEvent,
    session: SessionDep,
) -> Envelope[WebhookAcceptedResponse]:
    await apply_stripe_subscription_event(session, request)
    return Envelope(data=WebhookAcceptedResponse(accepted=True), error=None, meta=Meta.current())


@webhook_router.post("/stripe")
async def stripe_signed_webhook_route(
    request: Request,
    session: SessionDep,
    stripe_signature: Annotated[str, Header(alias="Stripe-Signature")],
) -> Envelope[WebhookAcceptedResponse]:
    payload = await request.body()
    await apply_signed_stripe_webhook(
        session,
        payload=payload,
        signature_header=stripe_signature,
    )
    return Envelope(data=WebhookAcceptedResponse(accepted=True), error=None, meta=Meta.current())


__all__ = ["get_billing_provider", "router", "webhook_router"]
