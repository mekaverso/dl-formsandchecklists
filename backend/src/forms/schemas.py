import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.core.enums import FormFrequency, QuestionType


# ─── Questions ────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_type: QuestionType
    text: str
    description: str | None = None
    is_required: bool = True
    requires_photo: bool = False
    requires_comment: bool = False
    sort_order: int = 0
    config: dict = {}
    reference_value: dict | None = None


class QuestionUpdate(BaseModel):
    question_type: QuestionType | None = None
    text: str | None = None
    description: str | None = None
    is_required: bool | None = None
    requires_photo: bool | None = None
    requires_comment: bool | None = None
    sort_order: int | None = None
    config: dict | None = None
    reference_value: dict | None = None


class QuestionResponse(BaseModel):
    id: uuid.UUID
    section_id: uuid.UUID
    question_type: QuestionType
    text: str
    description: str | None = None
    is_required: bool
    requires_photo: bool
    requires_comment: bool
    sort_order: int
    config: dict
    reference_value: dict | None = None
    is_active: bool

    model_config = {"from_attributes": True}


# ─── Sections ─────────────────────────────────────────────────────

class SectionCreate(BaseModel):
    title: str = Field(max_length=500)
    description: str | None = None
    sort_order: int = 0


class SectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    sort_order: int | None = None


class SectionResponse(BaseModel):
    id: uuid.UUID
    form_id: uuid.UUID
    title: str
    description: str | None = None
    sort_order: int
    is_active: bool
    questions: list[QuestionResponse] = []

    model_config = {"from_attributes": True}


# ─── Forms ────────────────────────────────────────────────────────

class FormCreate(BaseModel):
    title: str = Field(max_length=500)
    description: str | None = None
    code: str | None = None
    is_composite: bool = False
    expected_frequency: FormFrequency | None = None


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    code: str | None = None
    expected_frequency: FormFrequency | None = None


class FormResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: str | None = None
    code: str | None = None
    version: int
    is_composite: bool
    is_published: bool
    is_active: bool
    expected_frequency: FormFrequency | None = None
    created_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class FormDetailResponse(FormResponse):
    sections: list[SectionResponse] = []
    child_form_ids: list[uuid.UUID] = []
    node_ids: list[uuid.UUID] = []


# ─── Composite ────────────────────────────────────────────────────

class CompositeChildAdd(BaseModel):
    child_form_id: uuid.UUID
    sort_order: int = 0


class ReorderItem(BaseModel):
    id: uuid.UUID
    sort_order: int


class FormNodeAssign(BaseModel):
    node_ids: list[uuid.UUID]
