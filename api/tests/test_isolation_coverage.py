from pathlib import Path

from scripts.check_isolation_coverage import missing_isolation_coverage


def test_isolation_coverage_gate_requires_recorded_hits(tmp_path: Path) -> None:
    hits_path = tmp_path / "hits.json"

    assert missing_isolation_coverage(Path("tests"), hits_path=hits_path) != []


def test_isolation_coverage_gate_accepts_recorded_declared_hits(tmp_path: Path) -> None:
    hits_path = tmp_path / "hits.json"
    hits_path.write_text(
        """
        [
          {"method": "POST", "path": "/api/v1/courses"},
          {"method": "GET", "path": "/api/v1/courses"},
          {"method": "PATCH", "path": "/api/v1/courses/{course_id}"},
          {"method": "DELETE", "path": "/api/v1/courses/{course_id}"},
          {"method": "POST", "path": "/api/v1/courses/{course_id}/sections"},
          {"method": "POST", "path": "/api/v1/courses/{course_id}/lessons"},
          {"method": "POST", "path": "/api/v1/courses/{course_id}/blocks"},
          {"method": "POST", "path": "/api/v1/courses/{course_id}/media"},
          {"method": "PUT", "path": "/api/v1/courses/{course_id}/sections/order"},
          {"method": "POST", "path": "/api/v1/courses/{course_id}/publish"},
          {"method": "GET", "path": "/api/v1/auth/session"},
          {"method": "GET", "path": "/api/v1/auth/invitations/{token}"},
          {"method": "POST", "path": "/api/v1/learning/courses/{course_id}/enrolments"},
          {"method": "GET", "path": "/api/v1/learning/my-courses"},
          {"method": "GET", "path": "/api/v1/learning/courses/{course_id}/player"},
          {
            "method": "PUT",
            "path": "/api/v1/learning/courses/{course_id}/lessons/{lesson_id}/progress"
          },
          {
            "method": "POST",
            "path": "/api/v1/learning/courses/{course_id}/quizzes/{block_id}/attempts"
          },
          {"method": "POST", "path": "/api/v1/learning/courses/{course_id}/completion"},
          {"method": "POST", "path": "/api/v1/learning/courses/{course_id}/certificate"},
          {"method": "GET", "path": "/api/v1/learning/courses/{course_id}/certificate/download"},
          {"method": "POST", "path": "/api/v1/ai/courses/{course_id}/tutor/jobs"},
          {
            "method": "GET",
            "path": "/api/v1/ai/courses/{course_id}/tutor/jobs/{job_id}/events"
          },
          {"method": "GET", "path": "/api/v1/ai/conversations/{conversation_id}"},
          {"method": "GET", "path": "/api/v1/billing/plans"},
          {"method": "GET", "path": "/api/v1/billing/subscription"},
          {"method": "PATCH", "path": "/api/v1/billing/subscription/plan"},
          {"method": "POST", "path": "/api/v1/billing/checkout-sessions"},
          {"method": "GET", "path": "/api/v1/admin/analytics/completions"},
          {"method": "GET", "path": "/api/v1/admin/reports/learner-progress"},
          {"method": "GET", "path": "/api/v1/admin/reports/learner-progress.csv"},
          {"method": "POST", "path": "/api/v1/tenants"},
          {"method": "POST", "path": "/api/v1/tenant/invitations"},
          {"method": "GET", "path": "/api/v1/tenant/memberships"},
          {"method": "GET", "path": "/api/v1/tenant/branding"},
          {"method": "PATCH", "path": "/api/v1/tenant/branding"}
        ]
        """,
        encoding="utf-8",
    )

    assert missing_isolation_coverage(Path("tests"), hits_path=hits_path) == []
