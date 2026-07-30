from typing import Literal

from pydantic import BaseModel, EmailStr, Field

BEARER_TOKEN_TYPE: Literal["bearer"] = "bearer"  # noqa: S105


class SignupRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=200)
    tenant_slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$")
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


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


class TokenRequestAccepted(BaseModel):
    accepted: bool
