from typing import Literal

from pydantic import BaseModel, EmailStr, Field

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
    full_name: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=12, max_length=128)


class MagicLinkVerifyRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)


class PasswordResetCompleteRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=12, max_length=128)


class TokenRequestAccepted(BaseModel):
    accepted: bool
