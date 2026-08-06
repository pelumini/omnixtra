from uuid import UUID

import pytest
from starlette.requests import Request
from starlette.responses import Response

from app.auth.dependencies import ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE
from app.auth.routes import _enforce_rate_limit, _rate_limit_buckets, _set_auth_cookies
from app.auth.schemas import AuthenticatedUser, AuthResponse
from app.auth.services import AuthSession
from app.core.config import Settings
from app.core.exceptions import RateLimitError
from app.main import create_app


def test_auth_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/auth/signup" not in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/magic-link" in paths
    assert "/api/v1/auth/magic-link/verify" in paths
    assert "/api/v1/auth/password-reset" in paths
    assert "/api/v1/auth/password-reset/complete" in paths
    assert "/api/v1/auth/invitations/{token}" in paths
    assert "/api/v1/auth/invitations/accept" in paths
    assert "/api/v1/auth/refresh" in paths
    assert "/api/v1/auth/logout" in paths
    assert "/api/v1/auth/session" in paths


def test_auth_cookies_are_host_scoped_on_localhost_httponly_samesite_lax() -> None:
    response = Response()
    _set_auth_cookies(
        response,
        AuthSession(
            response=AuthResponse(
                access_token="access-token",
                user=AuthenticatedUser(
                    id=str(UUID("00000000-0000-0000-0000-000000000001")),
                    tenant_id=str(UUID("00000000-0000-0000-0000-000000000002")),
                    email="admin@example.com",
                    full_name="Admin User",
                    role="tenant_admin",
                ),
            ),
            refresh_token="refresh-token",
        ),
        Settings(APP_BASE_DOMAIN="localhost"),
    )

    set_cookie_headers = response.headers.getlist("set-cookie")

    assert any(header.startswith(f"{ACCESS_TOKEN_COOKIE}=") for header in set_cookie_headers)
    assert any(header.startswith(f"{REFRESH_TOKEN_COOKIE}=") for header in set_cookie_headers)
    assert all("Domain=" not in header for header in set_cookie_headers)
    assert all("HttpOnly" in header for header in set_cookie_headers)
    assert all("Secure" not in header for header in set_cookie_headers)
    assert all("SameSite=lax" in header for header in set_cookie_headers)


def test_auth_cookies_are_parent_scoped_and_secure_for_non_local_envs() -> None:
    response = Response()
    _set_auth_cookies(
        response,
        AuthSession(
            response=AuthResponse(
                access_token="access-token",
                user=AuthenticatedUser(
                    id=str(UUID("00000000-0000-0000-0000-000000000001")),
                    tenant_id=str(UUID("00000000-0000-0000-0000-000000000002")),
                    email="admin@example.com",
                    full_name="Admin User",
                    role="tenant_admin",
                ),
            ),
            refresh_token="refresh-token",
        ),
        Settings(APP_ENV="production", APP_BASE_DOMAIN="omnixtra.app"),
    )

    set_cookie_headers = response.headers.getlist("set-cookie")

    assert all("Domain=.omnixtra.app" in header for header in set_cookie_headers)
    assert all("Secure" in header for header in set_cookie_headers)


def test_auth_rate_limit_blocks_excess_attempts() -> None:
    _rate_limit_buckets.clear()
    request = _request()

    for _index in range(5):
        _enforce_rate_limit("login", request, "USER@example.com")

    with pytest.raises(RateLimitError):
        _enforce_rate_limit("login", request, "user@example.com")


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/auth/login",
            "headers": [],
            "client": ("127.0.0.1", 12345),
        },
    )
