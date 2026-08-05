from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import (
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    AuthenticatedPrincipal,
    require_authenticated_principal,
)
from app.auth.models import AuthTokenPurpose
from app.auth.schemas import (
    AuthResponse,
    InvitationAcceptRequest,
    InvitationPreviewResponse,
    LoginRequest,
    MagicLinkRequest,
    MagicLinkVerifyRequest,
    PasswordResetCompleteRequest,
    PasswordResetRequest,
    SessionResponse,
    TokenRequestAccepted,
)
from app.auth.services import (
    AuthSession,
    accept_invitation,
    complete_password_reset,
    get_auth_session,
    issue_auth_token,
    login_with_session,
    logout_refresh_session,
    preview_invitation,
    refresh_auth_session,
    verify_magic_link,
)
from app.core.database import get_session
from app.core.email import EmailProvider, EmailTemplate, auth_token_email, get_email_provider
from app.core.exceptions import AuthenticationError, RateLimitError
from app.shared.responses import Envelope, Meta
from app.tenancy.context import require_tenant_id

router = APIRouter(prefix="/auth", tags=["auth"])
SessionDep = Annotated[AsyncSession, Depends(get_session)]
EmailProviderDep = Annotated[EmailProvider, Depends(get_email_provider)]
AuthenticatedDep = Annotated[AuthenticatedPrincipal, Depends(require_authenticated_principal)]


@dataclass
class RateLimitBucket:
    count: int
    reset_at: datetime


RATE_LIMIT_WINDOW = timedelta(minutes=1)
RATE_LIMIT_MAX_ATTEMPTS = 5
INVITATION_PREVIEW_RATE_LIMIT_MAX_ATTEMPTS = 5
_rate_limit_buckets: dict[str, RateLimitBucket] = {}

INVALID_INVITATION_PREVIEW_BODY = {
    "data": None,
    "error": {
        "type": "NotFoundError",
        "message": "this invitation isn't valid",
        "details": [],
    },
    "meta": {"request_id": "invitation-preview", "timestamp": None},
}


@router.post("/login")
async def login_route(
    request: LoginRequest,
    session: SessionDep,
    response: Response,
    http_request: Request,
) -> Envelope[AuthResponse]:
    _enforce_rate_limit("login", http_request, request.email)
    auth_session = await login_with_session(
        session,
        UUID(require_tenant_id()),
        request.email,
        request.password,
    )
    _set_auth_cookies(response, auth_session)
    return Envelope(data=auth_session.response, error=None, meta=Meta.current())


@router.post("/magic-link")
async def magic_link_route(
    request: MagicLinkRequest,
    session: SessionDep,
    email_provider: EmailProviderDep,
    http_request: Request,
) -> Envelope[TokenRequestAccepted]:
    _enforce_rate_limit("magic-link", http_request, request.email)
    token = await issue_auth_token(
        session,
        UUID(require_tenant_id()),
        request.email,
        AuthTokenPurpose.magic_link,
    )
    await email_provider.send(
        auth_token_email(
            template=EmailTemplate.magic_link,
            to_email=request.email,
            token=token.raw_token,
        ),
    )
    return Envelope(data=TokenRequestAccepted(accepted=True), error=None, meta=Meta.current())


@router.post("/magic-link/verify")
async def magic_link_verify_route(
    request: MagicLinkVerifyRequest,
    session: SessionDep,
    response: Response,
) -> Envelope[AuthResponse]:
    auth_session = await verify_magic_link(session, UUID(require_tenant_id()), request.token)
    _set_auth_cookies(response, auth_session)
    return Envelope(data=auth_session.response, error=None, meta=Meta.current())


@router.post("/password-reset")
async def password_reset_route(
    request: PasswordResetRequest,
    session: SessionDep,
    email_provider: EmailProviderDep,
    http_request: Request,
) -> Envelope[TokenRequestAccepted]:
    _enforce_rate_limit("password-reset", http_request, request.email)
    token = await issue_auth_token(
        session,
        UUID(require_tenant_id()),
        request.email,
        AuthTokenPurpose.password_reset,
    )
    await email_provider.send(
        auth_token_email(
            template=EmailTemplate.password_reset,
            to_email=request.email,
            token=token.raw_token,
        ),
    )
    return Envelope(data=TokenRequestAccepted(accepted=True), error=None, meta=Meta.current())


@router.post("/password-reset/complete")
async def password_reset_complete_route(
    request: PasswordResetCompleteRequest,
    session: SessionDep,
    response: Response,
) -> Envelope[AuthResponse]:
    auth_session = await complete_password_reset(
        session,
        UUID(require_tenant_id()),
        request.token,
        request.password,
    )
    _set_auth_cookies(response, auth_session)
    return Envelope(data=auth_session.response, error=None, meta=Meta.current())


@router.post("/invitations/accept")
async def accept_invitation_route(
    request: InvitationAcceptRequest,
    session: SessionDep,
    response: Response,
    http_request: Request,
) -> Envelope[AuthResponse]:
    _enforce_rate_limit("invitation-accept", http_request, request.email)
    auth_session = await accept_invitation(session, UUID(require_tenant_id()), request)
    _set_auth_cookies(response, auth_session)
    return Envelope(data=auth_session.response, error=None, meta=Meta.current())


@router.get("/invitations/{token}", response_model=None)
async def invitation_preview_route(
    token: str,
    session: SessionDep,
    http_request: Request,
) -> Envelope[InvitationPreviewResponse] | JSONResponse:
    _enforce_ip_rate_limit("invitation-preview", http_request)
    preview = await preview_invitation(session, UUID(require_tenant_id()), token)
    if preview is None:
        return JSONResponse(status_code=404, content=INVALID_INVITATION_PREVIEW_BODY)
    return Envelope(data=preview, error=None, meta=Meta.current())


@router.post("/refresh")
async def refresh_route(
    http_request: Request,
    response: Response,
    session: SessionDep,
) -> Envelope[AuthResponse]:
    refresh_token = http_request.cookies.get(REFRESH_TOKEN_COOKIE)
    if refresh_token is None:
        msg = "refresh token required"
        raise AuthenticationError(msg)
    auth_session = await refresh_auth_session(session, UUID(require_tenant_id()), refresh_token)
    _set_auth_cookies(response, auth_session)
    return Envelope(data=auth_session.response, error=None, meta=Meta.current())


@router.post("/logout")
async def logout_route(
    http_request: Request,
    response: Response,
    session: SessionDep,
) -> Envelope[TokenRequestAccepted]:
    await logout_refresh_session(
        session,
        UUID(require_tenant_id()),
        http_request.cookies.get(REFRESH_TOKEN_COOKIE),
    )
    _clear_auth_cookies(response)
    return Envelope(data=TokenRequestAccepted(accepted=True), error=None, meta=Meta.current())


@router.get("/session", tags=["tenant-owned"])
async def session_route(
    session: SessionDep,
    principal: AuthenticatedDep,
) -> Envelope[SessionResponse]:
    response = await get_auth_session(
        session,
        user_id=principal.user_id,
        tenant_id=principal.tenant_id,
    )
    return Envelope(data=response, error=None, meta=Meta.current())


def _set_auth_cookies(response: Response, auth_session: AuthSession) -> None:
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        auth_session.response.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        auth_session.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, path="/")


def _enforce_rate_limit(kind: str, request: Request, email: str) -> None:
    now = datetime.now(UTC)
    client_host = request.client.host if request.client is not None else "unknown"
    key = f"{kind}:{client_host}:{email.strip().lower()}"
    bucket = _rate_limit_buckets.get(key)
    if bucket is None or bucket.reset_at <= now:
        _rate_limit_buckets[key] = RateLimitBucket(count=1, reset_at=now + RATE_LIMIT_WINDOW)
        return
    if bucket.count >= RATE_LIMIT_MAX_ATTEMPTS:
        msg = "too many authentication attempts"
        raise RateLimitError(msg)
    bucket.count += 1


def _enforce_ip_rate_limit(kind: str, request: Request) -> None:
    now = datetime.now(UTC)
    client_host = request.client.host if request.client is not None else "unknown"
    key = f"{kind}:{client_host}"
    bucket = _rate_limit_buckets.get(key)
    if bucket is None or bucket.reset_at <= now:
        _rate_limit_buckets[key] = RateLimitBucket(count=1, reset_at=now + RATE_LIMIT_WINDOW)
        return
    if bucket.count >= INVITATION_PREVIEW_RATE_LIMIT_MAX_ATTEMPTS:
        msg = "too many invitation preview attempts"
        raise RateLimitError(msg)
    bucket.count += 1
