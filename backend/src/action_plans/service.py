import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.action_plans.models import ActionPlan, ActionPlanComment
from src.action_plans.schemas import (
    ActionPlanCreate,
    ActionPlanStatusUpdate,
    ActionPlanUpdate,
    CommentCreate,
)
from src.core.enums import ActionPlanStatus, ConformityStatus
from src.core.exceptions import BadRequestError, NotFoundError
from src.forms.models import Form
from src.responses.models import Answer, Response


async def create_action_plan(
    db: AsyncSession,
    answer_id: uuid.UUID,
    data: ActionPlanCreate,
    user_id: uuid.UUID,
) -> ActionPlan:
    # Get answer and verify it's non-conforming
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise NotFoundError("Answer not found")
    if answer.conformity_status != ConformityStatus.NON_CONFORMING:
        raise BadRequestError("Action plans can only be created for non-conforming answers")

    # Get response to find org_id
    result = await db.execute(
        select(Response).join(Form).where(Response.id == answer.response_id)
    )
    response = result.scalar_one_or_none()
    result = await db.execute(select(Form).where(Form.id == response.form_id))
    form = result.scalar_one_or_none()

    plan = ActionPlan(
        answer_id=answer_id,
        response_id=answer.response_id,
        organization_id=form.organization_id,
        title=data.title,
        description=data.description,
        root_cause=data.root_cause,
        priority=data.priority,
        responsible_user_id=data.responsible_user_id,
        deadline=data.deadline,
        created_by=user_id,
    )
    db.add(plan)
    return plan


async def get_action_plan(db: AsyncSession, plan_id: uuid.UUID) -> ActionPlan:
    result = await db.execute(select(ActionPlan).where(ActionPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Action plan not found")
    return plan


async def list_action_plans(
    db: AsyncSession,
    org_id: uuid.UUID,
    status: ActionPlanStatus | None = None,
    responsible_user_id: uuid.UUID | None = None,
    priority: str | None = None,
) -> list[ActionPlan]:
    query = select(ActionPlan).where(ActionPlan.organization_id == org_id)
    if status:
        query = query.where(ActionPlan.status == status)
    if responsible_user_id:
        query = query.where(ActionPlan.responsible_user_id == responsible_user_id)
    if priority:
        query = query.where(ActionPlan.priority == priority)
    query = query.order_by(ActionPlan.deadline.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_action_plan(
    db: AsyncSession, plan_id: uuid.UUID, data: ActionPlanUpdate
) -> ActionPlan:
    plan = await get_action_plan(db, plan_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    return plan


async def update_action_plan_status(
    db: AsyncSession, plan_id: uuid.UUID, data: ActionPlanStatusUpdate
) -> ActionPlan:
    plan = await get_action_plan(db, plan_id)
    plan.status = data.status
    if data.status == ActionPlanStatus.COMPLETED:
        plan.completed_at = datetime.now(timezone.utc)
    return plan


async def add_comment(
    db: AsyncSession,
    plan_id: uuid.UUID,
    data: CommentCreate,
    user_id: uuid.UUID,
) -> ActionPlanComment:
    await get_action_plan(db, plan_id)  # Verify exists
    comment = ActionPlanComment(
        action_plan_id=plan_id,
        user_id=user_id,
        comment=data.comment,
        created_at=datetime.now(timezone.utc),
    )
    db.add(comment)
    return comment


async def list_comments(
    db: AsyncSession, plan_id: uuid.UUID
) -> list[ActionPlanComment]:
    result = await db.execute(
        select(ActionPlanComment)
        .where(ActionPlanComment.action_plan_id == plan_id)
        .order_by(ActionPlanComment.created_at.asc())
    )
    return list(result.scalars().all())
