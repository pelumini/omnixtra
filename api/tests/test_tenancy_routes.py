from app.main import create_app


def test_tenancy_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/tenants" in paths
    assert "/api/v1/tenant/branding" in paths
    assert "/api/v1/tenant/invitations" in paths
    assert "/api/v1/tenant/memberships" in paths
