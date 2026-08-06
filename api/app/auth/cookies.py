from fastapi import Response

from app.auth.dependencies import ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE
from app.core.config import Settings


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    settings: Settings,
) -> None:
    cookie_domain = settings.cookie_domain
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        domain=cookie_domain,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        domain=cookie_domain,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=30 * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response, *, settings: Settings) -> None:
    cookie_domain = settings.cookie_domain
    response.delete_cookie(ACCESS_TOKEN_COOKIE, domain=cookie_domain, path="/")
    response.delete_cookie(REFRESH_TOKEN_COOKIE, domain=cookie_domain, path="/")


__all__ = ["clear_auth_cookies", "set_auth_cookies"]
