import uuid
from datetime import datetime

from pydantic import BaseModel

from src.core.enums import ConformityStatus, ResponseStatus


class ResponseCreate(BaseModel):
    node_id: uuid.UUID
    parent_response_id: uuid.UUID | None = None
    device_id: str | None = None
    client_created_at: datetime
    latitude: float | None = None
    longitude: float | None = None


class AnswerUpsert(BaseModel):
    question_id: uuid.UUID
    value: dict | None = None
    comment: str | None = None
    client_created_at: datetime


class AnswerResponse(BaseModel):
    id: uuid.UUID
    response_id: uuid.UUID
    question_id: uuid.UUID
    value: dict | None = None
    comment: str | None = None
    conformity_status: ConformityStatus | None = None
    answered_at: datetime | None = None

    model_config = {"from_attributes": True}


class ResponseResponse(BaseModel):
    id: uuid.UUID
    form_id: uuid.UUID
    node_id: uuid.UUID
    respondent_id: uuid.UUID
    parent_response_id: uuid.UUID | None = None
    status: ResponseStatus
    started_at: datetime
    submitted_at: datetime | None = None
    device_id: str | None = None
    created_at: datetime
    form_title: str | None = None
    node_name: str | None = None
    respondent_name: str | None = None

    model_config = {"from_attributes": True}


class ResponseDetailResponse(ResponseResponse):
    answers: list[AnswerResponse] = []


class UploadUrlRequest(BaseModel):
    file_name: str
    content_type: str


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_key: str
