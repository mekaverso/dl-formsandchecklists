import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base_model import Base, TimestampMixin, UUIDMixin
from src.core.enums import ConformityStatus, ResponseStatus


class Response(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "responses"

    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="RESTRICT"), nullable=False
    )
    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="RESTRICT"), nullable=False
    )
    respondent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    parent_response_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("responses.id", ondelete="CASCADE")
    )
    status: Mapped[ResponseStatus] = mapped_column(nullable=False, default=ResponseStatus.DRAFT)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    device_id: Mapped[str | None] = mapped_column(String(255))
    client_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    answers: Mapped[list["Answer"]] = relationship(back_populates="response")
    child_responses: Mapped[list["Response"]] = relationship(back_populates="parent_response")
    parent_response: Mapped["Response | None"] = relationship(
        remote_side="Response.id", back_populates="child_responses"
    )


class Answer(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("response_id", "question_id"),)

    response_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("responses.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False
    )
    value: Mapped[dict | None] = mapped_column(JSONB)
    comment: Mapped[str | None] = mapped_column(Text)
    conformity_status: Mapped[ConformityStatus | None] = mapped_column()
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    client_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    response: Mapped["Response"] = relationship(back_populates="answers")
    attachments: Mapped[list["AnswerAttachment"]] = relationship(back_populates="answer")


class AnswerAttachment(UUIDMixin, Base):
    __tablename__ = "answer_attachments"

    answer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("answers.id", ondelete="CASCADE"), nullable=False
    )
    file_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    is_evidence: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    answer: Mapped["Answer"] = relationship(back_populates="attachments")
