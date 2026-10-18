from app.main import create_app


def test_course_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/courses" in paths
    assert "/api/v1/courses/{course_id}" in paths
    assert "/api/v1/courses/{course_id}/sections" in paths
    assert "/api/v1/courses/{course_id}/lessons" in paths
    assert "/api/v1/courses/{course_id}/blocks" in paths
    assert "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/{block_id}" in paths
    assert "/api/v1/courses/{course_id}/lessons/{lesson_id}/blocks/order" in paths
    assert "/api/v1/courses/{course_id}/media" in paths
    assert "/api/v1/courses/{course_id}/sections/order" in paths
    assert "/api/v1/courses/{course_id}/publish" in paths
