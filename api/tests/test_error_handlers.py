from fastapi.testclient import TestClient

from app.main import create_app


def test_request_validation_errors_are_normalized_for_forms() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/tenants",
        headers={"host": "localhost"},
        json={
            "tenant_name": "",
            "tenant_slug": "-bad",
            "full_name": "",
            "email": "not-an-email",
            "password": "short",
        },
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["type"] == "ValidationError"
    assert body["error"]["message"] == "Some fields need attention."
    assert {detail["field"] for detail in body["error"]["details"]} == {
        "email",
        "fullName",
        "password",
        "tenantName",
        "tenantSlug",
    }
    assert all(not detail["field"].startswith("body.") for detail in body["error"]["details"])
    assert {detail["constraint"] for detail in body["error"]["details"]} >= {
        "email",
        "min_length",
        "subdomain_format",
    }
