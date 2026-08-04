import pytest
from pydantic import ValidationError

from app.auth.schemas import (
    InvitationAcceptRequest,
    InviteUserRequest,
    LoginRequest,
    PasswordResetCompleteRequest,
)
from app.tenancy.schemas import TenantCreateRequest


def test_tenant_create_schema_validates_tenant_slug() -> None:
    with pytest.raises(ValidationError):
        TenantCreateRequest(
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


def test_invite_schema_accepts_member_role() -> None:
    request = InviteUserRequest(
        email="sofia@example.com",
        org_role="member",
    )

    assert request.org_role == "member"


def test_invitation_accept_schema_does_not_define_body_role() -> None:
    request = InvitationAcceptRequest(
        token="x" * 32,
        email="sofia@example.com",
        full_name="Sofia Creator",
        password="long-enough-password",
    )

    assert "org_role" not in InvitationAcceptRequest.model_fields
    assert not hasattr(request, "org_role")
