import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.action_plans import service
from src.action_plans.schemas import (
    ActionPlanCreate,
    ActionPlanResponse,
    ActionPlanStatusUpdate,
    ActionPlanUpdate,
    CommentCreate,
    CommentResponse,
)
from src.core.database import get_db
from src.core.dependencies import get_current_org_member, get_current_user
from src.core.enums import ActionPlanStatus
from src.organizations.models import User, UserOrganizationRole

router = APIRouter(tags=["action-plans"])


@router.get(
    "/organizations/{org_id}/action-plans", response_model=list[ActionPlanResponse]
)
async def list_action_plans(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: ActionPlanStatus | None = None,
    responsible_user_id: uuid.UUID | None = None,
    priority: str | None = None,
):
    return await service.list_action_plans(db, org_id, status, responsible_user_id, priority)


@router.post("/answers/{answer_id}/action-plans", response_model=ActionPlanResponse)
async def create_action_plan(
    answer_id: uuid.UUID,
    body: ActionPlanCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_action_plan(db, answer_id, body, user.id)


@router.get("/action-plans/{plan_id}", response_model=ActionPlanResponse)
async def get_action_plan(
    plan_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_action_plan(db, plan_id)


@router.put("/action-plans/{plan_id}", response_model=ActionPlanResponse)
async def update_action_plan(
    plan_id: uuid.UUID,
    body: ActionPlanUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_action_plan(db, plan_id, body)


@router.put("/action-plans/{plan_id}/status", response_model=ActionPlanResponse)
async def update_action_plan_status(
    plan_id: uuid.UUID,
    body: ActionPlanStatusUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_action_plan_status(db, plan_id, body)


@router.get("/action-plans/{plan_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    plan_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.list_comments(db, plan_id)


@router.post("/action-plans/{plan_id}/comments", response_model=CommentResponse)
async def add_comment(
    plan_id: uuid.UUID,
    body: CommentCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.add_comment(db, plan_id, body, user.id)
