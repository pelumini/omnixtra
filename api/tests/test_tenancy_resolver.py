from app.tenancy.resolver import resolve_tenant_slug


def test_resolves_subdomain_slug() -> None:
    result = resolve_tenant_slug("acme.omnixtra.test", "omnixtra.test")

    assert result.slug == "acme"
    assert result.source == "host"


def test_rejects_reserved_subdomain() -> None:
    result = resolve_tenant_slug("api.omnixtra.test", "omnixtra.test")

    assert result.slug is None
    assert result.is_reserved is True


def test_root_domain_has_no_tenant() -> None:
    result = resolve_tenant_slug("omnixtra.test", "omnixtra.test")

    assert result.slug is None
    assert result.is_reserved is False


def test_authenticated_principal_claim_takes_precedence() -> None:
    result = resolve_tenant_slug(
        "api.omnixtra.test",
        "omnixtra.test",
        authenticated_tenant_slug="acme",
    )

    assert result.slug == "acme"
    assert result.source == "principal"
