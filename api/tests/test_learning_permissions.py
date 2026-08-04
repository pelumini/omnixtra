from uuid import UUID

import pytest

from app.core.exceptions import NotFoundError
from app.learning.models import CourseRole, Enrolment, EnrolmentStatus
from app.learning.permissions import require_course_permission

USER_ID = UUID("00000000-0000-0000-0000-000000000001")
COURSE_A_ID = UUID("00000000-0000-0000-0000-0000000000a1")
COURSE_B_ID = UUID("00000000-0000-0000-0000-0000000000b1")
TENANT_ID = UUID("00000000-0000-0000-0000-000000000002")


@pytest.mark.anyio
async def test_course_permission_is_per_enrolment_not_per_user() -> None:
    session = _Session(
        {
            COURSE_A_ID: _enrolment(COURSE_A_ID, CourseRole.learner),
            COURSE_B_ID: _enrolment(COURSE_B_ID, CourseRole.course_owner),
        },
    )

    with pytest.raises(NotFoundError):
        await require_course_permission(
            session,
            user_id=USER_ID,
            course_id=COURSE_A_ID,
            permission="course.publish",
        )

    enrolment = await require_course_permission(
        session,
        user_id=USER_ID,
        course_id=COURSE_B_ID,
        permission="course.publish",
    )

    assert enrolment.course_role == CourseRole.course_owner.value


class _Session:
    def __init__(self, enrolments: dict[UUID, Enrolment]) -> None:
        self.enrolments = enrolments

    async def scalar(self, statement: object) -> Enrolment | None:
        params = getattr(statement.compile(), "params", {})
        for course_id, enrolment in self.enrolments.items():
            if course_id in params.values():
                return enrolment
        return None


def _enrolment(course_id: UUID, role: CourseRole) -> Enrolment:
    return Enrolment(
        tenant_id=TENANT_ID,
        learner_id=USER_ID,
        course_id=course_id,
        course_role=role.value,
        status=EnrolmentStatus.active.value,
        idempotency_key=f"{course_id}-{USER_ID}",
    )
