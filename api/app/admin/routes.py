from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.schemas import CourseCompletionAnalyticsResponse, LearnerProgressReportRow
from app.admin.services import (
    course_completion_analytics,
    learner_progress_csv,
    learner_progress_report,
)
from app.auth.dependencies import require_permission
from app.core.database import get_session
from app.shared.responses import Envelope, Meta

SessionDep = Annotated[AsyncSession, Depends(get_session)]

router = APIRouter(
    prefix="/admin",
    tags=["tenant-owned"],
    dependencies=[Depends(require_permission("reports:read"))],
)


@router.get("/analytics/completions")
async def course_completion_analytics_route(
    session: SessionDep,
) -> Envelope[list[CourseCompletionAnalyticsResponse]]:
    response = await course_completion_analytics(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/reports/learner-progress")
async def learner_progress_report_route(
    session: SessionDep,
) -> Envelope[list[LearnerProgressReportRow]]:
    response = await learner_progress_report(session)
    return Envelope(data=response, error=None, meta=Meta.current())


@router.get("/reports/learner-progress.csv")
async def learner_progress_csv_route(session: SessionDep) -> Response:
    rows = await learner_progress_report(session)
    return Response(
        content=learner_progress_csv(rows),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="learner-progress.csv"'},
    )


__all__ = ["router"]
