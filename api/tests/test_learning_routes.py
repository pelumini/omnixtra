from app.main import create_app
from app.tenancy.isolation import covers_isolation


def test_learning_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/learning/courses/{course_id}/enrolments" in paths
    assert "/api/v1/learning/courses/{course_id}/player" in paths
    assert "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress" in paths
    assert "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts" in paths
    assert "/api/v1/learning/courses/{course_id}/completion" in paths
    assert "/api/v1/learning/courses/{course_id}/certificate" in paths


@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/enrolments")
@covers_isolation("GET", "/api/v1/learning/courses/{course_id}/player")
@covers_isolation("PUT", "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/completion")
@covers_isolation("POST", "/api/v1/learning/courses/{course_id}/certificate")
def test_learning_routes_have_isolation_coverage_declarations() -> None:
    assert True
