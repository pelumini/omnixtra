from app.auth.models import OrgRole

DEFAULT_TENANT_CREATOR_ROLE = OrgRole.tenant_admin
DEFAULT_INVITE_ROLE = OrgRole.member

ORG_ROLE_PERMISSIONS: dict[OrgRole, frozenset[str]] = {
    OrgRole.tenant_admin: frozenset(
        {
            "roles:manage",
            "tenant:manage",
            "users:manage",
            "courses:read",
            "courses:manage",
            "reports:read",
            "billing:manage",
            "learning:write",
            "tutor:use",
        },
    ),
    OrgRole.member: frozenset(
        {
            "courses:read",
            "learning:write",
            "tutor:use",
        },
    ),
}


def has_permission(role: OrgRole, permission: str) -> bool:
    return permission in ORG_ROLE_PERMISSIONS[role]
