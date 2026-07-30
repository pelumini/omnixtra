from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthTokenPurpose
from app.auth.schemas import (
    AuthResponse,
    LoginRequest,
    MagicLinkRequest,
    PasswordResetRequest,
    SignupRequest,
    TokenRequestAccepted,
)
from app.auth.services import issue_auth_token, login, signup
from app.core.database import get_session
from app.shared.responses import Envelope, Meta
from app.tenancy.context import require_tenant_id

router = APIRouter(prefix="/auth", tags=["auth"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.post("/signup")
async def signup_route(
    request: SignupRequest,
    session: SessionDep,
) -> Envelope[AuthResponse]:
    response = await signup(session, request)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/login")
async def login_route(
    request: LoginRequest,
    session: SessionDep,
) -> Envelope[AuthResponse]:
    response = await login(session, UUID(require_tenant_id()), request.email, request.password)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.post("/magic-link")
async def magic_link_route(
    request: MagicLinkRequest,
    session: SessionDep,
) -> Envelope[TokenRequestAccepted]:
    await issue_auth_token(
        session,
        UUID(require_tenant_id()),
        request.email,
        AuthTokenPurpose.magic_link,
    )
    return Envelope(data=TokenRequestAccepted(accepted=True), error=None, meta=Meta.current())


@router.post("/password-reset")
async def password_reset_route(
    request: PasswordResetRequest,
    session: SessionDep,
) -> Envelope[TokenRequestAccepted]:
    await issue_auth_token(
        session,
        UUID(require_tenant_id()),
        request.email,
        AuthTokenPurpose.password_reset,
    )
    return Envelope(data=TokenRequestAccepted(accepted=True), error=None, meta=Meta.current())
