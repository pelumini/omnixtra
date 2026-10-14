from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class CourseStatus(StrEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class CourseDifficulty(StrEnum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class CourseDeliveryFormat(StrEnum):
    self_paced = "self_paced"
    instructor_led = "instructor_led"
    blended = "blended"


class CourseAccess(StrEnum):
    enrolled_only = "enrolled_only"
    link = "link"


class Course(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("tenant_id", "slug", name="uq_courses_tenant_slug"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True, default=list)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    learning_outcomes: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True, default=list)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(32), nullable=True)
    delivery_format: Mapped[str | None] = mapped_column(String(32), nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    access: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CourseAccess.enrolled_only.value
    )
    complete_in_order: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    certificate_on_completion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
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
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(700), nullable=True)


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
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    required_for_completion: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


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


class CourseMediaAsset(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_media_assets"
    __table_args__ = (
        UniqueConstraint("tenant_id", "object_key", name="uq_course_media_tenant_object_key"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    object_key: Mapped[str] = mapped_column(String(700), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)


class CourseAuditEvent(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_audit_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    actor_id: Mapped[UUID | None] = mapped_column(nullable=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    summary: Mapped[str] = mapped_column(String(300), nullable=False)
