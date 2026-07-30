from app.main import create_app


def test_auth_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/auth/signup" in paths
    assert "/api/v1/auth/login" in paths
    assert "/api/v1/auth/magic-link" in paths
    assert "/api/v1/auth/password-reset" in paths
