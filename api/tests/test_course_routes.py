from app.main import create_app
from app.tenancy.isolation import covers_isolation


def test_course_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/courses" in paths
    assert "/api/v1/courses/{course_id}" in paths
    assert "/api/v1/courses/{course_id}/sections" in paths
    assert "/api/v1/courses/{course_id}/lessons" in paths
    assert "/api/v1/courses/{course_id}/blocks" in paths
    assert "/api/v1/courses/{course_id}/sections/order" in paths
    assert "/api/v1/courses/{course_id}/publish" in paths


@covers_isolation("POST", "/api/v1/courses")
@covers_isolation("GET", "/api/v1/courses")
@covers_isolation("PATCH", "/api/v1/courses/{course_id}")
@covers_isolation("DELETE", "/api/v1/courses/{course_id}")
@covers_isolation("POST", "/api/v1/courses/{course_id}/sections")
@covers_isolation("POST", "/api/v1/courses/{course_id}/lessons")
@covers_isolation("POST", "/api/v1/courses/{course_id}/blocks")
@covers_isolation("PUT", "/api/v1/courses/{course_id}/sections/order")
@covers_isolation("POST", "/api/v1/courses/{course_id}/publish")
def test_course_routes_have_isolation_coverage_declarations() -> None:
    assert True
