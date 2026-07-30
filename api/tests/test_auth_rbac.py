from app.auth.models import UserRole
from app.auth.rbac import DEFAULT_INVITE_ROLE, DEFAULT_SIGNUP_ROLE, has_permission


def test_default_signup_role_is_org_admin() -> None:
    assert DEFAULT_SIGNUP_ROLE is UserRole.org_admin


def test_default_invite_role_is_learner() -> None:
    assert DEFAULT_INVITE_ROLE is UserRole.learner


def test_org_admin_and_learner_permissions_are_distinct() -> None:
    assert has_permission(UserRole.org_admin, "billing:manage") is True
    assert has_permission(UserRole.learner, "billing:manage") is False
    assert has_permission(UserRole.learner, "tutor:use") is True
