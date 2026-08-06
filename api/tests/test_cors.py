from fastapi.testclient import TestClient

from app.main import create_app


def test_local_web_origin_can_preflight_tenant_creation() -> None:
    client = TestClient(create_app())

    response = client.options(
        "/api/v1/tenants",
        headers={
            "Access-Control-Request-Headers": "content-type",
            "Access-Control-Request-Method": "POST",
            "Origin": "http://localhost:3001",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_local_tenant_subdomain_origin_can_preflight_authenticated_routes() -> None:
    client = TestClient(create_app())

    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Access-Control-Request-Headers": "content-type",
            "Access-Control-Request-Method": "POST",
            "Origin": "http://acme.localhost:3001",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://acme.localhost:3001"
    assert response.headers["access-control-allow-credentials"] == "true"
