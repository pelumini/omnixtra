from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.ai.types import Vector
from app.shared.models import Base, TenantOwnedMixin, TimestampMixin


class TutorJobStatus(StrEnum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ConversationRole(StrEnum):
    user = "user"
    assistant = "assistant"
    system = "system"


class LessonEmbedding(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "lesson_embeddings"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "lesson_id", "chunk_index", name="uq_embeddings_lesson_chunk"
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"))
    lesson_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(), nullable=False)


class TutorConversation(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "tutor_conversations"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))


class TutorMessage(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "tutor_messages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("tutor_conversations.id", ondelete="CASCADE"),
    )
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[list[dict[str, object]]] = mapped_column(JSONB, nullable=False, default=list)


class TutorJob(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "tutor_jobs"
    __table_args__ = (
        UniqueConstraint("tenant_id", "idempotency_key", name="uq_tutor_jobs_idempotency_key"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("tutor_conversations.id", ondelete="CASCADE"),
    )
    learner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=TutorJobStatus.queued.value
    )
    idempotency_key: Mapped[str] = mapped_column(String(120), nullable=False)
    trace_metadata: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, default=dict)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SemanticCacheEntry(TenantOwnedMixin, TimestampMixin, Base):
    __tablename__ = "semantic_cache_entries"
    __table_args__ = (
        UniqueConstraint("tenant_id", "course_id", "semantic_hash", name="uq_ai_cache_course_hash"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    semantic_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[list[dict[str, object]]] = mapped_column(JSONB, nullable=False, default=list)
