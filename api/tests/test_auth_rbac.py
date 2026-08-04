from app.auth.models import OrgRole
from app.auth.rbac import DEFAULT_INVITE_ROLE, DEFAULT_TENANT_CREATOR_ROLE, has_permission


def test_default_tenant_creator_role_is_tenant_admin() -> None:
    assert DEFAULT_TENANT_CREATOR_ROLE is OrgRole.tenant_admin


def test_default_invite_role_is_member() -> None:
    assert DEFAULT_INVITE_ROLE is OrgRole.member


def test_tenant_admin_and_member_permissions_are_distinct() -> None:
    assert has_permission(OrgRole.tenant_admin, "billing:manage") is True
    assert has_permission(OrgRole.tenant_admin, "tenant:manage") is True
    assert has_permission(OrgRole.tenant_admin, "users:manage") is True
    assert has_permission(OrgRole.tenant_admin, "roles:manage") is True
    assert has_permission(OrgRole.member, "courses:read") is True
    assert has_permission(OrgRole.member, "billing:manage") is False
    assert has_permission(OrgRole.member, "courses:manage") is False
