import pytest
from pydantic import ValidationError

from app.auth.schemas import LoginRequest, PasswordResetCompleteRequest, SignupRequest


def test_signup_schema_validates_tenant_slug() -> None:
    with pytest.raises(ValidationError):
        SignupRequest(
            tenant_name="Acme",
            tenant_slug="API",
            full_name="Ada Admin",
            email="ada@example.com",
            password="long-enough-password",
        )


def test_login_schema_normalizes_email_value() -> None:
    request = LoginRequest(email="USER@example.com", password="secret")

    assert str(request.email) == "USER@example.com"


def test_password_reset_completion_requires_strong_new_password() -> None:
    with pytest.raises(ValidationError):
        PasswordResetCompleteRequest(token="x" * 32, password="short")
