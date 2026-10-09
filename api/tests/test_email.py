import httpx
import pytest

from app.core.config import get_settings
from app.core.email import EmailTemplate, ResendEmailProvider, activation_email, auth_token_email


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


def test_activation_email_uses_tenant_link_and_expiry() -> None:
    email = activation_email(
        to_email="ada@example.com",
        first_name="Ada",
        tenant_name="Acme Academy",
        activation_link="https://acme.example/join?token=raw-token",
    )

    assert email.subject == "Activate your Acme Academy account"
    assert "Hello Ada" in email.html
    assert "https://acme.example/join?token=raw-token" in email.html
    assert "72 hours" in email.html


def test_activation_email_escapes_profile_content() -> None:
    email = activation_email(
        to_email="ada@example.com",
        first_name="<Ada>",
        tenant_name='Acme "Academy"',
        activation_link='https://acme.example/join?token=a&next="bad"',
    )

    assert "&lt;Ada&gt;" in email.html
    assert "Acme &quot;Academy&quot;" in email.html
    assert "token=a&amp;next=&quot;bad&quot;" in email.html


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
