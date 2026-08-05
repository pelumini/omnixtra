from app.main import create_app


def test_learning_routes_are_registered_under_api_v1() -> None:
    paths = set(create_app().openapi()["paths"])

    assert "/api/v1/learning/courses/{course_id}/enrolments" in paths
    assert "/api/v1/learning/my-courses" in paths
    assert "/api/v1/learning/courses/{course_id}/player" in paths
    assert "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress" in paths
    assert "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts" in paths
    assert "/api/v1/learning/courses/{course_id}/completion" in paths
    assert "/api/v1/learning/courses/{course_id}/certificate" in paths
    assert "/api/v1/learning/courses/{course_id}/certificate/download" in paths
