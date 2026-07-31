import csv
from datetime import UTC, datetime
from io import StringIO
from uuid import UUID

from app.admin.schemas import CourseCompletionAnalyticsResponse, LearnerProgressReportRow
from app.admin.services import learner_progress_csv

LEARNER_ID = UUID("00000000-0000-0000-0000-000000000001")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000002")


def test_completion_analytics_schema_exposes_percentage() -> None:
    response = CourseCompletionAnalyticsResponse(
        course_id=COURSE_ID,
        course_title="Security Basics",
        enrolled_count=4,
        completed_count=3,
        completion_percentage=75,
    )

    assert response.completion_percentage == 75


def test_learner_progress_csv_contains_report_rows() -> None:
    completed_at = datetime(2026, 7, 30, 12, 0, tzinfo=UTC)
    csv_body = learner_progress_csv(
        [
            LearnerProgressReportRow(
                learner_id=LEARNER_ID,
                learner_name="Ada Admin",
                learner_email="ada@example.com",
                course_id=COURSE_ID,
                course_title="Security Basics",
                enrolment_status="completed",
                lessons_total=4,
                lessons_completed=4,
                average_progress_percent=100,
                completed_at=completed_at,
            ),
        ],
    )

    assert "learner_id,learner_name,learner_email,course_id" in csv_body
    assert "ada@example.com" in csv_body
    assert "Security Basics" in csv_body


def test_learner_progress_csv_neutralizes_formula_cells() -> None:
    csv_body = learner_progress_csv(
        [
            LearnerProgressReportRow(
                learner_id=LEARNER_ID,
                learner_name='=HYPERLINK("http://evil","x")',
                learner_email="+evil@example.com",
                course_id=COURSE_ID,
                course_title="@SUM(1+1)",
                enrolment_status="\tcompleted",
                lessons_total=4,
                lessons_completed=4,
                average_progress_percent=100,
                completed_at=None,
            ),
        ],
    )

    row = next(csv.DictReader(StringIO(csv_body)))
    assert row["learner_name"] == '\'=HYPERLINK("http://evil","x")'
    assert row["learner_email"] == "'+evil@example.com"
    assert row["course_title"] == "'@SUM(1+1)"
    assert row["enrolment_status"] == "'\tcompleted"
