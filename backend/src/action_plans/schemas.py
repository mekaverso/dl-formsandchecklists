import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from src.core.enums import ActionPlanPriority, ActionPlanStatus


class ActionPlanCreate(BaseModel):
    title: str = Field(max_length=500)
    description: str
    root_cause: str | None = None
    priority: ActionPlanPriority = ActionPlanPriority.MEDIUM
    responsible_user_id: uuid.UUID | None = None
    deadline: date


class ActionPlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    root_cause: str | None = None
    priority: ActionPlanPriority | None = None
    responsible_user_id: uuid.UUID | None = None
    deadline: date | None = None


class ActionPlanStatusUpdate(BaseModel):
    status: ActionPlanStatus


class ActionPlanResponse(BaseModel):
    id: uuid.UUID
    answer_id: uuid.UUID
    response_id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    description: str
    root_cause: str | None = None
    priority: ActionPlanPriority
    status: ActionPlanStatus
    responsible_user_id: uuid.UUID | None = None
    deadline: date
    completed_at: datetime | None = None
    created_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    comment: str


class CommentResponse(BaseModel):
    id: uuid.UUID
    action_plan_id: uuid.UUID
    user_id: uuid.UUID | None = None
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}
