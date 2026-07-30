from app.main import create_app


def test_admin_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/admin/analytics/completions" in paths
    assert "/api/v1/admin/reports/learner-progress" in paths
    assert "/api/v1/admin/reports/learner-progress.csv" in paths
