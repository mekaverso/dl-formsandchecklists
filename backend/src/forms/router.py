import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_org_member, get_current_user, require_role
from src.core.enums import UserRole
from src.forms import service
from src.forms.schemas import (
    CompositeChildAdd,
    FormCreate,
    FormDetailResponse,
    FormNodeAssign,
    FormResponse,
    FormUpdate,
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    ReorderItem,
    SectionCreate,
    SectionResponse,
    SectionUpdate,
)
from src.organizations.models import User, UserOrganizationRole

router = APIRouter(tags=["forms"])


# ─── Forms ────────────────────────────────────────────────────────

@router.get("/organizations/{org_id}/forms", response_model=list[FormResponse])
async def list_forms(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_published: bool | None = None,
    is_composite: bool | None = None,
    search: str | None = None,
):
    return await service.list_forms(db, org_id, is_published, is_composite, search)


@router.post("/organizations/{org_id}/forms", response_model=FormResponse)
async def create_form(
    org_id: uuid.UUID,
    body: FormCreate,
    membership: Annotated[UserOrganizationRole, Depends(
        require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
    )],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_form(db, org_id, body, membership.user_id)


@router.get("/forms/{form_id}", response_model=FormDetailResponse)
async def get_form(
    form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    form = await service.get_form(db, form_id)
    return FormDetailResponse(
        **{c.key: getattr(form, c.key) for c in form.__table__.columns},
        sections=[s for s in form.sections if s.is_active],
        child_form_ids=[cl.child_form_id for cl in form.child_links],
        node_ids=[na.node_id for na in form.node_assignments if na.is_active],
    )


@router.put("/forms/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: uuid.UUID,
    body: FormUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_form(db, form_id, body)


@router.delete("/forms/{form_id}")
async def delete_form(
    form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.delete_form(db, form_id)
    return {"detail": "Form deactivated"}


@router.post("/forms/{form_id}/publish", response_model=FormResponse)
async def publish_form(
    form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.publish_form(db, form_id)


@router.post("/forms/{form_id}/duplicate", response_model=FormResponse)
async def duplicate_form(
    form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.duplicate_form(db, form_id, user.id)


# ─── Sections ─────────────────────────────────────────────────────

@router.get("/forms/{form_id}/sections", response_model=list[SectionResponse])
async def list_sections(
    form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.list_sections(db, form_id)


@router.post("/forms/{form_id}/sections", response_model=SectionResponse)
async def create_section(
    form_id: uuid.UUID,
    body: SectionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_section(db, form_id, body)


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: uuid.UUID,
    body: SectionUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_section(db, section_id, body)


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.delete_section(db, section_id)
    return {"detail": "Section deactivated"}


@router.put("/forms/{form_id}/sections/reorder")
async def reorder_sections(
    form_id: uuid.UUID,
    body: list[ReorderItem],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.reorder_sections(db, form_id, body)
    return {"detail": "Reordered"}


# ─── Questions ────────────────────────────────────────────────────

@router.post("/sections/{section_id}/questions", response_model=QuestionResponse)
async def create_question(
    section_id: uuid.UUID,
    body: QuestionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_question(db, section_id, body)


@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: uuid.UUID,
    body: QuestionUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_question(db, question_id, body)


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.delete_question(db, question_id)
    return {"detail": "Question deactivated"}


@router.put("/sections/{section_id}/questions/reorder")
async def reorder_questions(
    section_id: uuid.UUID,
    body: list[ReorderItem],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.reorder_questions(db, section_id, body)
    return {"detail": "Reordered"}


# ─── Composite ────────────────────────────────────────────────────

@router.post("/forms/{form_id}/children")
async def add_child_form(
    form_id: uuid.UUID,
    body: CompositeChildAdd,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.add_child_form(db, form_id, body)
    return {"detail": "Child form added"}


@router.delete("/forms/{form_id}/children/{child_form_id}")
async def remove_child_form(
    form_id: uuid.UUID,
    child_form_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.remove_child_form(db, form_id, child_form_id)
    return {"detail": "Child form removed"}


# ─── Node Assignments ────────────────────────────────────────────

@router.post("/forms/{form_id}/node-assignments")
async def assign_to_nodes(
    form_id: uuid.UUID,
    body: FormNodeAssign,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    node_ids = await service.assign_form_to_nodes(db, form_id, body)
    return {"detail": "Assigned", "node_ids": node_ids}
