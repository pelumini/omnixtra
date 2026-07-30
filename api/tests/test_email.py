import httpx
import pytest

from app.core.config import get_settings
from app.core.email import EmailTemplate, ResendEmailProvider, auth_token_email


def test_auth_token_email_builds_template_link(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("WEB_APP_URL", "https://app.example")

    email = auth_token_email(
        template=EmailTemplate.password_reset,
        to_email="ada@example.com",
        token="raw-token",
    )

    assert email.to_email == "ada@example.com"
    assert email.subject == "Reset your OmniXtra password"
    assert "https://app.example/auth/password-reset/complete?token=raw-token" in email.html
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_resend_provider_posts_transactional_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("RESEND_API_KEY", "re_test_123")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "OmniXtra <no-reply@example.com>")

    async def handler(request: httpx.Request) -> httpx.Response:
        payload = request.read()
        assert request.headers["authorization"] == "Bearer re_test_123"
        assert b"ada@example.com" in payload
        assert b"OmniXtra <no-reply@example.com>" in payload
        return httpx.Response(200, json={"id": "email_123"})

    provider = ResendEmailProvider(client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))

    await provider.send(
        auth_token_email(
            template=EmailTemplate.magic_link,
            to_email="ada@example.com",
            token="raw-token",
        ),
    )
    get_settings.cache_clear()
