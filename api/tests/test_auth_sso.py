import pytest
from pydantic import ValidationError

from app.auth.models import (
    SSOIdentityProvider,
    SSOLoginState,
    SSOProtocol,
    SSOProviderStatus,
)
from app.auth.schemas import SSOIdentityProviderCreateRequest


def test_sso_model_tables_are_tenant_owned() -> None:
    assert SSOIdentityProvider.__tablename__ == "sso_identity_providers"
    assert SSOLoginState.__tablename__ == "sso_login_states"
    assert "tenant_id" in SSOIdentityProvider.__table__.columns
    assert "tenant_id" in SSOLoginState.__table__.columns


def test_sso_enums_define_oidc_and_saml_foundation() -> None:
    assert SSOProtocol.oidc.value == "oidc"
    assert SSOProtocol.saml.value == "saml"
    assert SSOProviderStatus.active.value == "active"
    assert SSOProviderStatus.disabled.value == "disabled"


def test_oidc_provider_schema_requires_protocol_fields() -> None:
    with pytest.raises(ValidationError, match="OIDC provider missing required fields"):
        SSOIdentityProviderCreateRequest(name="Okta", protocol="oidc")

    request = SSOIdentityProviderCreateRequest(
        authorization_url="https://idp.example.com/oauth2/v1/authorize",
        client_id="client-id",
        issuer="https://idp.example.com/oauth2/default",
        jwks_url="https://idp.example.com/oauth2/v1/keys",
        name="Okta",
        protocol="oidc",
        token_url="https://idp.example.com/oauth2/v1/token",
    )

    assert request.attribute_mapping == {"email": "email", "full_name": "name"}


def test_saml_provider_schema_requires_protocol_fields() -> None:
    with pytest.raises(ValidationError, match="SAML provider missing required fields"):
        SSOIdentityProviderCreateRequest(name="Entra ID", protocol="saml")

    request = SSOIdentityProviderCreateRequest(
        certificate_fingerprint="sha256:abc123",
        entity_id="https://idp.example.com/saml/entity",
        name="Entra ID",
        protocol="saml",
        sso_url="https://idp.example.com/saml/sso",
    )

    assert request.protocol == "saml"
