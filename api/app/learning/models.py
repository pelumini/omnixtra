from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class EnrolmentStatus(StrEnum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class CompletionStatus(StrEnum):
    completed = "completed"


class CertificateStatus(StrEnum):
    issued = "issued"
    revoked = "revoked"


class Enrolment(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "enrolments"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "learner_id", "course_id", name="uq_enrolments_learner_course"
        ),
        UniqueConstraint("tenant_id", "idempotency_key", name="uq_enrolments_idempotency_key"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=EnrolmentStatus.active.value
    )
    idempotency_key: Mapped[str] = mapped_column(String(120), nullable=False)


class LessonProgress(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "learner_id",
            "lesson_id",
            name="uq_lesson_progress_learner_lesson",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    last_position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    percent_complete: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class QuizAttempt(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    block_id: Mapped[UUID] = mapped_column(ForeignKey("course_blocks.id", ondelete="CASCADE"))
    selected_option_id: Mapped[str] = mapped_column(String(64), nullable=False)
    score_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(nullable=False)


class CourseCompletion(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "course_completions"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "learner_id",
            "course_id",
            name="uq_course_completions_learner_course",
        ),
        UniqueConstraint(
            "tenant_id", "idempotency_key", name="uq_course_completions_idempotency_key"
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CompletionStatus.completed.value
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(120), nullable=False)


class Certificate(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "certificates"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "learner_id",
            "course_id",
            name="uq_certificates_learner_course",
        ),
        UniqueConstraint("tenant_id", "idempotency_key", name="uq_certificates_idempotency_key"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    completion_id: Mapped[UUID] = mapped_column(
        ForeignKey("course_completions.id", ondelete="CASCADE")
    )
    certificate_number: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=CertificateStatus.issued.value
    )
    pdf_object_key: Mapped[str | None] = mapped_column(String(700), nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(120), nullable=False)


class LearningAuditEvent(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "learning_audit_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    summary: Mapped[str] = mapped_column(String(300), nullable=False)
    event_data: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, default=dict)
