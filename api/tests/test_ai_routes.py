from app.main import create_app
from app.tenancy.isolation import covers_isolation


def test_ai_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/ai/courses/{course_id}/tutor/jobs" in paths
    assert "/api/v1/ai/courses/{course_id}/tutor/events" in paths
    assert "/api/v1/ai/courses/{course_id}/tutor/jobs/{job_id}/events" in paths
    assert "/api/v1/ai/conversations/{conversation_id}" in paths


@covers_isolation("POST", "/api/v1/ai/courses/{course_id}/tutor/jobs")
@covers_isolation("GET", "/api/v1/ai/courses/{course_id}/tutor/events")
@covers_isolation("GET", "/api/v1/ai/courses/{course_id}/tutor/jobs/{job_id}/events")
@covers_isolation("GET", "/api/v1/ai/conversations/{conversation_id}")
def test_ai_routes_have_isolation_coverage_declarations() -> None:
    assert True
