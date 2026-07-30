from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class TenantStatus(StrEnum):
    active = "active"
    suspended = "suspended"
    deleted = "deleted"


class Tenant(TimestampMixin, Base):
    __tablename__ = "tenants"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(63), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(32), default=TenantStatus.active.value)
    logo_url: Mapped[str | None] = mapped_column(String(2048), default=None)
    primary_color: Mapped[str] = mapped_column(String(16), default="#116149")
    locale: Mapped[str] = mapped_column(String(16), default="en")
    time_zone: Mapped[str] = mapped_column(String(64), default="UTC")
