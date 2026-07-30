from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class CourseStatus(StrEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Course(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("tenant_id", "slug", name="uq_courses_tenant_slug"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CourseStatus.draft.value
    )


class CourseSection(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_sections"
    __table_args__ = (
        UniqueConstraint("tenant_id", "course_id", "position", name="uq_sections_position"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)


class Lesson(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "lessons"
    __table_args__ = (
        UniqueConstraint("tenant_id", "section_id", "position", name="uq_lessons_position"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    section_id: Mapped[UUID] = mapped_column(ForeignKey("course_sections.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)


class CourseBlock(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_blocks"
    __table_args__ = (
        UniqueConstraint("tenant_id", "lesson_id", "position", name="uq_blocks_position"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    block_type: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)


class CourseAuditEvent(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_audit_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    actor_id: Mapped[UUID | None] = mapped_column(nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    summary: Mapped[str] = mapped_column(String(300), nullable=False)
