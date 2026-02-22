import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.core.enums import UserRole


# --- Organization ---
class OrganizationCreate(BaseModel):
    name: str = Field(max_length=255)
    slug: str = Field(max_length=100, pattern=r"^[a-z0-9\-]+$")


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    logo_url: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Node Types ---
class NodeTypeCreate(BaseModel):
    name: str = Field(max_length=100)
    depth_level: int = 0
    icon: str | None = None


class NodeTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    depth_level: int
    icon: str | None = None

    model_config = {"from_attributes": True}


# --- Nodes (Hierarchy) ---
class NodeCreate(BaseModel):
    parent_id: uuid.UUID | None = None
    name: str = Field(max_length=255)
    node_type: str = Field(max_length=100)
    description: str | None = None
    sort_order: int = 0


class NodeUpdate(BaseModel):
    name: str | None = None
    node_type: str | None = None
    description: str | None = None
    sort_order: int | None = None


class NodeMove(BaseModel):
    new_parent_id: uuid.UUID | None = None


class NodeResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID | None = None
    name: str
    node_type: str
    description: str | None = None
    materialized_path: str
    depth: int
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NodeTreeResponse(BaseModel):
    """A node with its children nested recursively."""
    id: uuid.UUID
    parent_id: uuid.UUID | None = None
    name: str
    node_type: str
    description: str | None = None
    depth: int
    sort_order: int
    children: list["NodeTreeResponse"] = []

    model_config = {"from_attributes": True}


# --- Members ---
class MemberResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    role: UserRole
    node_assignments: list[uuid.UUID] = []

    model_config = {"from_attributes": True}


class MemberInvite(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.END_USER


class MemberRoleUpdate(BaseModel):
    role: UserRole


class NodeAssignmentUpdate(BaseModel):
    node_ids: list[uuid.UUID]
