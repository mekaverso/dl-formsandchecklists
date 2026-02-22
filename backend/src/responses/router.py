import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_org_member, get_current_user
from src.core.enums import ResponseStatus
from src.core.storage import generate_upload_url
from src.organizations.models import User, UserOrganizationRole
from src.responses import service
from src.responses.schemas import (
    AnswerResponse,
    AnswerUpsert,
    ResponseCreate,
    ResponseDetailResponse,
    ResponseResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)

router = APIRouter(tags=["responses"])


@router.get("/organizations/{org_id}/responses", response_model=list[ResponseResponse])
async def list_responses(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
    form_id: uuid.UUID | None = None,
    node_id: uuid.UUID | None = None,
    respondent_id: uuid.UUID | None = None,
    status: ResponseStatus | None = None,
):
    return await service.list_responses(db, org_id, form_id, node_id, respondent_id, status)


@router.post("/forms/{form_id}/responses", response_model=ResponseResponse)
async def create_response(
    form_id: uuid.UUID,
    body: ResponseCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_response(db, form_id, user.id, body)


@router.get("/responses/{response_id}", response_model=ResponseDetailResponse)
async def get_response(
    response_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_response(db, response_id)


@router.put("/responses/{response_id}/answers", response_model=list[AnswerResponse])
async def upsert_answers(
    response_id: uuid.UUID,
    body: list[AnswerUpsert],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.upsert_answers(db, response_id, body)


@router.post("/responses/{response_id}/submit", response_model=ResponseResponse)
async def submit_response(
    response_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.submit_response(db, response_id)


@router.post("/answers/{answer_id}/attachments/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    answer_id: uuid.UUID,
    body: UploadUrlRequest,
    user: Annotated[User, Depends(get_current_user)],
):
    url, file_key = generate_upload_url(
        prefix=f"answers/{answer_id}",
        file_name=body.file_name,
        content_type=body.content_type,
    )
    return UploadUrlResponse(upload_url=url, file_key=file_key)
