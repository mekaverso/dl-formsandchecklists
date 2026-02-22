import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base_model import Base, TimestampMixin, UUIDMixin
from src.core.enums import FormFrequency, QuestionType


class Form(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "forms"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    code: Mapped[str | None] = mapped_column(String(50))
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_composite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    expected_frequency: Mapped[FormFrequency | None] = mapped_column()
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    sections: Mapped[list["Section"]] = relationship(
        back_populates="form", order_by="Section.sort_order"
    )
    node_assignments: Mapped[list["FormNodeAssignment"]] = relationship(back_populates="form")
    parent_links: Mapped[list["CompositeFormChild"]] = relationship(
        foreign_keys="CompositeFormChild.child_form_id", back_populates="child_form"
    )
    child_links: Mapped[list["CompositeFormChild"]] = relationship(
        foreign_keys="CompositeFormChild.parent_form_id",
        back_populates="parent_form",
        order_by="CompositeFormChild.sort_order",
    )


class FormNodeAssignment(UUIDMixin, Base):
    __tablename__ = "form_node_assignments"
    __table_args__ = (UniqueConstraint("form_id", "node_id"),)

    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    form: Mapped["Form"] = relationship(back_populates="node_assignments")


class CompositeFormChild(UUIDMixin, Base):
    __tablename__ = "composite_form_children"
    __table_args__ = (
        UniqueConstraint("parent_form_id", "child_form_id"),
        CheckConstraint("parent_form_id != child_form_id", name="ck_no_self_reference"),
    )

    parent_form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    child_form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    parent_form: Mapped["Form"] = relationship(
        foreign_keys=[parent_form_id], back_populates="child_links"
    )
    child_form: Mapped["Form"] = relationship(
        foreign_keys=[child_form_id], back_populates="parent_links"
    )


class Section(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "sections"

    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    form: Mapped["Form"] = relationship(back_populates="sections")
    questions: Mapped[list["Question"]] = relationship(
        back_populates="section", order_by="Question.sort_order"
    )


class Question(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "questions"

    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False
    )
    question_type: Mapped[QuestionType] = mapped_column(nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    requires_photo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    requires_comment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    reference_value: Mapped[dict | None] = mapped_column(JSONB)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    section: Mapped["Section"] = relationship(back_populates="questions")
