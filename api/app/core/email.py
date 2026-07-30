from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol

import httpx

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError


class EmailTemplate(StrEnum):
    magic_link = "magic_link"
    password_reset = "password_reset"  # noqa: S105


@dataclass(frozen=True)
class TransactionalEmail:
    to_email: str
    subject: str
    html: str


class EmailProvider(Protocol):
    async def send(self, email: TransactionalEmail) -> None:
        pass


class LocalEmailProvider:
    async def send(self, email: TransactionalEmail) -> None:
        _ = email


class ResendEmailProvider:
    def __init__(self, *, client: httpx.AsyncClient | None = None) -> None:
        self.client = client

    async def send(self, email: TransactionalEmail) -> None:
        settings = get_settings()
        if not settings.resend_api_key:
            msg = "Resend API key is not configured"
            raise ValidationAppError(msg)
        payload = {
            "from": settings.resend_from_email,
            "to": [email.to_email],
            "subject": email.subject,
            "html": email.html,
        }
        headers = {"Authorization": f"Bearer {settings.resend_api_key}"}
        if self.client is not None:
            response = await self.client.post(
                "https://api.resend.com/emails",
                json=payload,
                headers=headers,
            )
        else:
            async with httpx.AsyncClient(timeout=30.0) as transient_client:
                response = await transient_client.post(
                    "https://api.resend.com/emails",
                    json=payload,
                    headers=headers,
                )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            msg = "transactional email delivery failed"
            raise ValidationAppError(msg) from exc


def get_email_provider() -> EmailProvider:
    if get_settings().resend_api_key:
        return ResendEmailProvider()
    return LocalEmailProvider()


def auth_token_email(
    *,
    template: EmailTemplate,
    to_email: str,
    token: str,
) -> TransactionalEmail:
    settings = get_settings()
    if template is EmailTemplate.magic_link:
        path = "magic-link/verify"
        label = "Sign in to OmniXtra"
        action = "sign in"
    else:
        path = "password-reset/complete"
        label = "Reset your OmniXtra password"
        action = "reset your password"
    link = f"{settings.web_app_url.rstrip('/')}/auth/{path}?token={token}"
    return TransactionalEmail(
        to_email=to_email,
        subject=label,
        html=(
            "<p>You requested an OmniXtra secure link.</p>"
            f'<p><a href="{link}">Click here to {action}</a>.</p>'
            "<p>This link expires in 15 minutes.</p>"
        ),
    )


__all__ = [
    "EmailProvider",
    "EmailTemplate",
    "LocalEmailProvider",
    "ResendEmailProvider",
    "TransactionalEmail",
    "auth_token_email",
    "get_email_provider",
]
