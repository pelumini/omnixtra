from dataclasses import dataclass

RESERVED_SUBDOMAINS: frozenset[str] = frozenset(
    {
        "www",
        "app",
        "api",
        "admin",
        "status",
        "docs",
        "blog",
        "mail",
    },
)


@dataclass(frozen=True)
class TenantResolutionResult:
    slug: str | None
    is_reserved: bool = False
    source: str = "host"


def resolve_tenant_slug(
    host: str,
    base_domain: str,
    authenticated_tenant_slug: str | None = None,
) -> TenantResolutionResult:
    if authenticated_tenant_slug is not None:
        return _resolve_authenticated_slug(authenticated_tenant_slug)

    normalized_host = _without_port(host).lower().strip(".")
    normalized_base_domain = base_domain.lower().strip(".")
    empty_result = TenantResolutionResult(slug=None)
    result = empty_result

    if normalized_host != normalized_base_domain:
        suffix = f".{normalized_base_domain}"
        if normalized_host.endswith(suffix):
            candidate = normalized_host.removesuffix(suffix)
            if "." not in candidate and candidate:
                result = (
                    TenantResolutionResult(slug=None, is_reserved=True)
                    if candidate in RESERVED_SUBDOMAINS
                    else TenantResolutionResult(slug=candidate)
                )

    return result


def _resolve_authenticated_slug(authenticated_tenant_slug: str) -> TenantResolutionResult:
    normalized_authenticated_slug = authenticated_tenant_slug.lower().strip()
    if normalized_authenticated_slug in RESERVED_SUBDOMAINS:
        return TenantResolutionResult(slug=None, is_reserved=True, source="principal")

    return TenantResolutionResult(slug=normalized_authenticated_slug, source="principal")


def _without_port(host: str) -> str:
    if host.startswith("["):
        return host
    return host.split(":", maxsplit=1)[0]
