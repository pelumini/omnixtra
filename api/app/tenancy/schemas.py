from typing import Literal

from pydantic import AnyUrl, BaseModel, EmailStr, Field, field_validator


class TenantCreateRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=200)
    tenant_description: str | None = Field(default=None, max_length=1000)
    tenant_slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$")
    logo_url: AnyUrl | None = None
    primary_color: str = Field(default="#116149", pattern=r"^#[0-9a-fA-F]{6}$")
    locale: str = Field(default="en", min_length=2, max_length=16)
    time_zone: str = Field(default="UTC", min_length=1, max_length=64)
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class TenantCreateResponse(BaseModel):
    tenant_id: str
    tenant_slug: str
    user_id: str
    membership_id: str
    access_token: str
    token_type: str = "bearer"  # noqa: S105


class MembershipResponse(BaseModel):
    id: str
    user_id: str | None
    full_name: str | None
    email: EmailStr
    org_role: Literal["tenant_admin", "member"]
    status: Literal["active", "invited"]
    invitation_token: str | None = None


class TenantUserCreateRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=32)
    org_role: Literal["tenant_admin", "member"] = "member"

    @field_validator("first_name", "last_name", "phone")
    @classmethod
    def trim_required_fields(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            msg = "field must not be empty"
            raise ValueError(msg)
        return normalized


class TenantUserCreateResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    org_role: Literal["tenant_admin", "member"]
    status: Literal["invited"]
    activation_link: str


class TenantBrandingResponse(BaseModel):
    tenant_name: str
    logo_url: str | None
    primary_color: str
    locale: str
    time_zone: str


class TenantBrandingUpdateRequest(BaseModel):
    logo_url: AnyUrl | None = None
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    locale: str | None = Field(default=None, min_length=2, max_length=16)
    time_zone: str | None = Field(default=None, min_length=1, max_length=64)


__all__ = [
    "MembershipResponse",
    "TenantBrandingResponse",
    "TenantBrandingUpdateRequest",
    "TenantCreateRequest",
    "TenantCreateResponse",
    "TenantUserCreateRequest",
    "TenantUserCreateResponse",
]
