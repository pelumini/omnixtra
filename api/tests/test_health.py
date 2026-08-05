from fastapi.testclient import TestClient

from app.main import create_app


def test_root_returns_service_pointers_without_tenant_context() -> None:
    app = create_app()
    client = TestClient(app)

    response = client.get("/", headers={"host": "localhost", "x-request-id": "req_root"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "req_root"
    assert response.json() == {
        "data": {
            "service": "OmniXtra",
            "status": "ok",
            "health": "/health",
            "docs": "/docs",
        },
        "error": None,
        "meta": {"request_id": "req_root", "timestamp": None},
    }
    assert "/" not in app.openapi()["paths"]


def test_health_returns_standard_envelope() -> None:
    client = TestClient(create_app())

    response = client.get("/health", headers={"x-request-id": "req_test"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "req_test"
    assert response.json() == {
        "data": {"status": "ok"},
        "error": None,
        "meta": {"request_id": "req_test", "timestamp": None},
    }


def test_api_v1_health_returns_standard_envelope() -> None:
    client = TestClient(create_app())

    response = client.get("/api/v1/health", headers={"x-request-id": "req_test"})

    assert response.status_code == 200
    assert response.json()["data"] == {"status": "ok"}
