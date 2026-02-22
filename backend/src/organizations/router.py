import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_org_member, get_current_user, require_role
from src.core.enums import UserRole
from src.organizations.models import User, UserOrganizationRole
from src.organizations.schemas import (
    MemberInvite,
    MemberRoleUpdate,
    MemberResponse,
    NodeAssignmentUpdate,
    NodeCreate,
    NodeMove,
    NodeResponse,
    NodeTreeResponse,
    NodeTypeCreate,
    NodeTypeResponse,
    NodeUpdate,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from src.organizations import service

router = APIRouter(tags=["organizations"])


# ─── Organizations ────────────────────────────────────────────────

@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    body: OrganizationCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_organization(db, body, user)


@router.get("/organizations", response_model=list[OrganizationResponse])
async def list_organizations(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.list_user_organizations(db, user.id)


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_organization(db, org_id)


@router.put("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: uuid.UUID,
    body: OrganizationUpdate,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_organization(db, org_id, body)


# ─── Node Types ───────────────────────────────────────────────────

@router.get("/organizations/{org_id}/node-types", response_model=list[NodeTypeResponse])
async def list_node_types(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.list_node_types(db, org_id)


@router.post("/organizations/{org_id}/node-types", response_model=NodeTypeResponse)
async def create_node_type(
    org_id: uuid.UUID,
    body: NodeTypeCreate,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_node_type(db, org_id, body)


# ─── Nodes (Hierarchy) ───────────────────────────────────────────

@router.get("/organizations/{org_id}/hierarchy", response_model=list[NodeResponse])
async def get_hierarchy(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.get_hierarchy_tree(db, org_id)


@router.post("/organizations/{org_id}/nodes", response_model=NodeResponse)
async def create_node(
    org_id: uuid.UUID,
    body: NodeCreate,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.create_node(db, org_id, body)


@router.put("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: uuid.UUID,
    body: NodeUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.update_node(db, node_id, body)


@router.put("/nodes/{node_id}/move", response_model=NodeResponse)
async def move_node(
    node_id: uuid.UUID,
    body: NodeMove,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.move_node(db, node_id, body)


@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.delete_node(db, node_id)
    return {"detail": "Node deactivated"}


# ─── Members ─────────────────────────────────────────────────────

@router.get("/organizations/{org_id}/members", response_model=list[MemberResponse])
async def list_members(
    org_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await service.list_members(db, org_id)


@router.post("/organizations/{org_id}/members", response_model=MemberResponse)
async def invite_member(
    org_id: uuid.UUID,
    body: MemberInvite,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    membership = await service.invite_member(db, org_id, body)
    return {
        "user_id": membership.user_id,
        "email": body.email,
        "full_name": body.full_name,
        "role": membership.role,
        "node_assignments": [],
    }


@router.put("/organizations/{org_id}/members/{user_id}/role")
async def update_member_role(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    body: MemberRoleUpdate,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.update_member_role(db, org_id, user_id, body.role)
    return {"detail": "Role updated"}


@router.put("/organizations/{org_id}/members/{user_id}/node-assignments")
async def update_node_assignments(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    body: NodeAssignmentUpdate,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN, UserRole.MANAGER))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    node_ids = await service.update_node_assignments(db, org_id, user_id, body)
    return {"detail": "Assignments updated", "node_ids": node_ids}


@router.delete("/organizations/{org_id}/members/{user_id}")
async def remove_member(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    _: Annotated[UserOrganizationRole, Depends(require_role(UserRole.ADMIN))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await service.remove_member(db, org_id, user_id)
    return {"detail": "Member removed"}
