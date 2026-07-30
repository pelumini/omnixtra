from app.auth.models import UserRole

DEFAULT_SIGNUP_ROLE = UserRole.org_admin
DEFAULT_INVITE_ROLE = UserRole.learner

ROLE_PERMISSIONS: dict[UserRole, frozenset[str]] = {
    UserRole.org_admin: frozenset(
        {
            "tenant:manage",
            "users:manage",
            "courses:manage",
            "reports:read",
            "billing:manage",
        },
    ),
    UserRole.learner: frozenset(
        {
            "courses:read",
            "learning:write",
            "tutor:use",
        },
    ),
}


def has_permission(role: UserRole, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS[role]
