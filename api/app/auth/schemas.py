from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator

BEARER_TOKEN_TYPE: Literal["bearer"] = "bearer"  # noqa: S105


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthenticatedUser(BaseModel):
    id: str
    tenant_id: str
    email: EmailStr
    full_name: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = BEARER_TOKEN_TYPE
    user: AuthenticatedUser


class SessionUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str


class SessionMembership(BaseModel):
    tenant_id: str
    org_role: Literal["tenant_admin", "member"]


class SessionResponse(BaseModel):
    user: SessionUser
    membership: SessionMembership | None


class MagicLinkRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    email: EmailStr


class InviteUserRequest(BaseModel):
    email: EmailStr
    org_role: Literal["tenant_admin", "member"] = "member"


class InvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class InvitationPreviewResponse(BaseModel):
    organization_name: str
    email: EmailStr
    first_name: str
    last_name: str


class MagicLinkVerifyRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)


class PasswordResetCompleteRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=12, max_length=128)


class TokenRequestAccepted(BaseModel):
    accepted: bool


class SSOIdentityProviderCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    protocol: Literal["oidc", "saml"]
    issuer: str | None = Field(default=None, max_length=2048)
    authorization_url: str | None = Field(default=None, max_length=2048)
    token_url: str | None = Field(default=None, max_length=2048)
    jwks_url: str | None = Field(default=None, max_length=2048)
    metadata_url: str | None = Field(default=None, max_length=2048)
    entity_id: str | None = Field(default=None, max_length=2048)
    sso_url: str | None = Field(default=None, max_length=2048)
    certificate_fingerprint: str | None = Field(default=None, max_length=128)
    client_id: str | None = Field(default=None, max_length=255)
    client_secret_ref: str | None = Field(default=None, max_length=255)
    attribute_mapping: dict[str, str] = Field(
        default_factory=lambda: {
            "email": "email",
            "full_name": "name",
        },
    )

    @model_validator(mode="after")
    def validate_protocol_fields(self) -> "SSOIdentityProviderCreateRequest":
        if self.protocol == "oidc":
            missing = [
                field
                for field in ("issuer", "authorization_url", "token_url", "jwks_url", "client_id")
                if getattr(self, field) is None
            ]
            if missing:
                msg = f"OIDC provider missing required fields: {', '.join(missing)}"
                raise ValueError(msg)
        if self.protocol == "saml":
            missing = [
                field
                for field in ("entity_id", "sso_url", "certificate_fingerprint")
                if getattr(self, field) is None
            ]
            if missing:
                msg = f"SAML provider missing required fields: {', '.join(missing)}"
                raise ValueError(msg)
        return self


class SSOIdentityProviderResponse(BaseModel):
    id: str
    name: str
    protocol: Literal["oidc", "saml"]
    status: Literal["active", "disabled"]
    issuer: str | None
    metadata_url: str | None
    entity_id: str | None
    sso_url: str | None
    client_id: str | None
    attribute_mapping: dict[str, str]
