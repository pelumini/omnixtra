from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.learning.models import CourseRole, Enrolment, EnrolmentStatus
from app.learning.repositories import enrolment_by_learner_course

COURSE_ROLE_PERMISSIONS: dict[CourseRole, frozenset[str]] = {
    CourseRole.course_owner: frozenset(
        {
            "course.edit",
            "course.publish",
            "course.manage_enrolments",
            "course.view_progress",
        },
    ),
    CourseRole.facilitator: frozenset(
        {
            "course.view_progress",
        },
    ),
    CourseRole.learner: frozenset(
        {
            "course.learn",
        },
    ),
}


def has_course_permission(role: CourseRole, permission: str) -> bool:
    return permission in COURSE_ROLE_PERMISSIONS[role]


async def require_course_permission(
    session: AsyncSession,
    *,
    user_id: UUID,
    course_id: UUID,
    permission: str,
) -> Enrolment:
    enrolment = await session.scalar(enrolment_by_learner_course(user_id, course_id))
    if enrolment is None or enrolment.status != EnrolmentStatus.active.value:
        raise _not_found()
    role = CourseRole(enrolment.course_role)
    if not has_course_permission(role, permission):
        raise _not_found()
    return enrolment


def _not_found() -> NotFoundError:
    return NotFoundError("course not found")


__all__ = ["has_course_permission", "require_course_permission"]
