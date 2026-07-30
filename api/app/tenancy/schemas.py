from pydantic import AnyUrl, BaseModel, Field


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


__all__ = ["TenantBrandingResponse", "TenantBrandingUpdateRequest"]
