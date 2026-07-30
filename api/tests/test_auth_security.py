from uuid import UUID

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_uses_argon2id_and_verifies() -> None:
    hashed_password = hash_password("correct horse battery staple")

    assert hashed_password.startswith("$argon2id$")
    assert verify_password("correct horse battery staple", hashed_password) is True
    assert verify_password("wrong password", hashed_password) is False


def test_create_access_token_contains_tenant_and_role_claims() -> None:
    user_id = UUID("00000000-0000-0000-0000-000000000001")
    tenant_id = UUID("00000000-0000-0000-0000-000000000002")

    token = create_access_token(subject=user_id, tenant_id=tenant_id, role="org_admin")
    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["tenant_id"] == str(tenant_id)
    assert payload["role"] == "org_admin"
