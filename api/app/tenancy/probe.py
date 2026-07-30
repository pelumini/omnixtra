from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class TenantIsolationProbe(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "tenant_isolation_probes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str] = mapped_column(String(120))
