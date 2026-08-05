from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class OrgRole(StrEnum):
    tenant_admin = "tenant_admin"
    member = "member"


class UserStatus(StrEnum):
    active = "active"
    invited = "invited"
    disabled = "disabled"


class AuthTokenPurpose(StrEnum):
    magic_link = "magic_link"
    password_reset = "password_reset"  # noqa: S105


class SSOProtocol(StrEnum):
    oidc = "oidc"
    saml = "saml"


class SSOProviderStatus(StrEnum):
    active = "active"
    disabled = "disabled"


class User(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(512), nullable=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=UserStatus.active.value)


class Membership(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("tenant_id", "user_id", name="uq_memberships_tenant_user"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    org_role: Mapped[str] = mapped_column(String(32), nullable=False, default=OrgRole.member.value)


class Invitation(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "invitations"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_invitations_tenant_email"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    org_role: Mapped[str] = mapped_column(String(32), nullable=False, default=OrgRole.member.value)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuthToken(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "auth_tokens"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    purpose: Mapped[str] = mapped_column(String(32), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RefreshSession(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "refresh_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    replaced_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("refresh_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SSOIdentityProvider(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "sso_identity_providers"
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_sso_identity_providers_tenant_name"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    protocol: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=SSOProviderStatus.disabled.value
    )
    issuer: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    authorization_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    token_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    jwks_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    metadata_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    sso_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    certificate_fingerprint: Mapped[str | None] = mapped_column(String(128), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_secret_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attribute_mapping: Mapped[dict[str, str]] = mapped_column(JSONB, nullable=False)


class SSOLoginState(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "sso_login_states"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("sso_identity_providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    state_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    nonce_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    relay_state_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    redirect_uri: Mapped[str] = mapped_column(String(2048), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
