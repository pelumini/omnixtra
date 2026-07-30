from app.auth.models import AuthTokenPurpose
from app.auth.services import hash_auth_token


def test_hash_auth_token_is_stable_sha256_hex() -> None:
    hashed = hash_auth_token("raw-token")

    assert hashed == hash_auth_token("raw-token")
    assert hashed != "raw-token"
    assert len(hashed) == 64


def test_auth_token_purposes_cover_magic_link_and_password_reset() -> None:
    assert AuthTokenPurpose.magic_link.value == "magic_link"
    assert AuthTokenPurpose.password_reset.value == "password_reset"
