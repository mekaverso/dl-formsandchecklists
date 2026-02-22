import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.enums import UserRole
from src.core.exceptions import BadRequestError, ConflictError, NotFoundError
from src.organizations.models import (
    Node,
    NodeType,
    Organization,
    User,
    UserNodeAssignment,
    UserOrganizationRole,
)
from src.organizations.schemas import (
    MemberInvite,
    NodeAssignmentUpdate,
    NodeCreate,
    NodeMove,
    NodeUpdate,
    NodeTypeCreate,
    OrganizationCreate,
    OrganizationUpdate,
)


# ─── Organizations ────────────────────────────────────────────────

async def create_organization(
    db: AsyncSession, data: OrganizationCreate, user: User
) -> Organization:
    org = Organization(name=data.name, slug=data.slug)
    db.add(org)
    await db.flush()

    # Creator becomes admin
    role = UserOrganizationRole(
        user_id=user.id,
        organization_id=org.id,
        role=UserRole.ADMIN,
        created_at=datetime.now(timezone.utc),
    )
    db.add(role)
    return org


async def get_organization(db: AsyncSession, org_id: uuid.UUID) -> Organization:
    result = await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.is_active == True)  # noqa: E712
    )
    org = result.scalar_one_or_none()
    if not org:
        raise NotFoundError("Organization not found")
    return org


async def update_organization(
    db: AsyncSession, org_id: uuid.UUID, data: OrganizationUpdate
) -> Organization:
    org = await get_organization(db, org_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    return org


async def list_user_organizations(db: AsyncSession, user_id: uuid.UUID) -> list[Organization]:
    result = await db.execute(
        select(Organization)
        .join(UserOrganizationRole)
        .where(
            UserOrganizationRole.user_id == user_id,
            Organization.is_active == True,  # noqa: E712
        )
    )
    return list(result.scalars().all())


# ─── Node Types ───────────────────────────────────────────────────

async def create_node_type(
    db: AsyncSession, org_id: uuid.UUID, data: NodeTypeCreate
) -> NodeType:
    node_type = NodeType(
        organization_id=org_id,
        name=data.name,
        depth_level=data.depth_level,
        icon=data.icon,
        created_at=datetime.now(timezone.utc),
    )
    db.add(node_type)
    await db.flush()
    return node_type


async def list_node_types(db: AsyncSession, org_id: uuid.UUID) -> list[NodeType]:
    result = await db.execute(
        select(NodeType)
        .where(NodeType.organization_id == org_id)
        .order_by(NodeType.depth_level)
    )
    return list(result.scalars().all())


# ─── Nodes (Hierarchy) ───────────────────────────────────────────

def _build_path(parent_path: str | None, node_id: uuid.UUID) -> str:
    if parent_path:
        return f"{parent_path}{node_id}/"
    return f"/{node_id}/"


async def create_node(db: AsyncSession, org_id: uuid.UUID, data: NodeCreate) -> Node:
    parent_path = ""
    depth = 0

    if data.parent_id:
        result = await db.execute(select(Node).where(Node.id == data.parent_id))
        parent = result.scalar_one_or_none()
        if not parent or parent.organization_id != org_id:
            raise BadRequestError("Parent node not found in this organization")
        parent_path = parent.materialized_path
        depth = parent.depth + 1

    node = Node(
        organization_id=org_id,
        parent_id=data.parent_id,
        name=data.name,
        node_type=data.node_type,
        description=data.description,
        sort_order=data.sort_order,
        depth=depth,
        materialized_path="",  # Temporary — set after flush
    )
    db.add(node)
    await db.flush()

    node.materialized_path = _build_path(parent_path, node.id)
    return node


async def update_node(db: AsyncSession, node_id: uuid.UUID, data: NodeUpdate) -> Node:
    result = await db.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundError("Node not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(node, field, value)
    return node


async def move_node(db: AsyncSession, node_id: uuid.UUID, data: NodeMove) -> Node:
    """Move a node to a new parent, updating materialized_path for it and all descendants."""
    result = await db.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundError("Node not found")

    old_path = node.materialized_path

    # Calculate new path
    if data.new_parent_id:
        result = await db.execute(select(Node).where(Node.id == data.new_parent_id))
        new_parent = result.scalar_one_or_none()
        if not new_parent or new_parent.organization_id != node.organization_id:
            raise BadRequestError("New parent node not found in this organization")
        # Prevent moving a node under itself
        if new_parent.materialized_path.startswith(old_path):
            raise BadRequestError("Cannot move a node under itself")
        new_path = _build_path(new_parent.materialized_path, node.id)
        node.depth = new_parent.depth + 1
    else:
        new_path = f"/{node.id}/"
        node.depth = 0

    node.parent_id = data.new_parent_id
    node.materialized_path = new_path

    # Update all descendants
    result = await db.execute(
        select(Node).where(
            Node.materialized_path.like(f"{old_path}%"),
            Node.id != node_id,
        )
    )
    descendants = result.scalars().all()
    for desc in descendants:
        desc.materialized_path = desc.materialized_path.replace(old_path, new_path, 1)
        # Recalculate depth based on path segments
        desc.depth = desc.materialized_path.strip("/").count("/")

    return node


async def get_hierarchy_tree(db: AsyncSession, org_id: uuid.UUID) -> list[Node]:
    """Get all nodes for an organization, ordered for tree construction."""
    result = await db.execute(
        select(Node)
        .where(Node.organization_id == org_id, Node.is_active == True)  # noqa: E712
        .order_by(Node.depth, Node.sort_order, Node.name)
    )
    return list(result.scalars().all())


async def delete_node(db: AsyncSession, node_id: uuid.UUID) -> None:
    result = await db.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundError("Node not found")
    node.is_active = False
    # Also deactivate all descendants
    result = await db.execute(
        select(Node).where(
            Node.materialized_path.like(f"{node.materialized_path}%"),
            Node.id != node_id,
        )
    )
    for desc in result.scalars().all():
        desc.is_active = False


# ─── Members ─────────────────────────────────────────────────────

async def invite_member(
    db: AsyncSession, org_id: uuid.UUID, data: MemberInvite
) -> UserOrganizationRole:
    # Find or create user
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=data.email, full_name=data.full_name)
        db.add(user)
        await db.flush()

    # Check if already a member
    result = await db.execute(
        select(UserOrganizationRole).where(
            UserOrganizationRole.user_id == user.id,
            UserOrganizationRole.organization_id == org_id,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictError("User is already a member of this organization")

    role = UserOrganizationRole(
        user_id=user.id,
        organization_id=org_id,
        role=data.role,
        created_at=datetime.now(timezone.utc),
    )
    db.add(role)
    return role


async def update_member_role(
    db: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID, new_role: UserRole
) -> UserOrganizationRole:
    result = await db.execute(
        select(UserOrganizationRole).where(
            UserOrganizationRole.user_id == user_id,
            UserOrganizationRole.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise NotFoundError("Member not found")
    membership.role = new_role
    return membership


async def update_node_assignments(
    db: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID, data: NodeAssignmentUpdate
) -> list[uuid.UUID]:
    # Verify all nodes belong to this org
    if data.node_ids:
        result = await db.execute(
            select(Node.id).where(
                Node.id.in_(data.node_ids),
                Node.organization_id == org_id,
            )
        )
        valid_ids = set(row[0] for row in result.fetchall())
        invalid = set(data.node_ids) - valid_ids
        if invalid:
            raise BadRequestError(f"Nodes not found in this organization: {invalid}")

    # Remove existing assignments for this org
    existing = await db.execute(
        select(UserNodeAssignment)
        .join(Node)
        .where(
            UserNodeAssignment.user_id == user_id,
            Node.organization_id == org_id,
        )
    )
    for assignment in existing.scalars().all():
        await db.delete(assignment)

    # Create new assignments
    now = datetime.now(timezone.utc)
    for node_id in data.node_ids:
        db.add(UserNodeAssignment(user_id=user_id, node_id=node_id, created_at=now))

    return data.node_ids


async def list_members(db: AsyncSession, org_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(UserOrganizationRole)
        .options(selectinload(UserOrganizationRole.user))
        .where(UserOrganizationRole.organization_id == org_id)
    )
    members = []
    for membership in result.scalars().all():
        user = membership.user
        # Get node assignments
        na_result = await db.execute(
            select(UserNodeAssignment.node_id)
            .join(Node)
            .where(
                UserNodeAssignment.user_id == user.id,
                Node.organization_id == org_id,
            )
        )
        node_ids = [row[0] for row in na_result.fetchall()]
        members.append({
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": membership.role,
            "node_assignments": node_ids,
        })
    return members


async def remove_member(db: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(UserOrganizationRole).where(
            UserOrganizationRole.user_id == user_id,
            UserOrganizationRole.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise NotFoundError("Member not found")
    await db.delete(membership)

    # Also remove node assignments
    await db.execute(
        delete(UserNodeAssignment).where(
            UserNodeAssignment.user_id == user_id,
            UserNodeAssignment.node_id.in_(
                select(Node.id).where(Node.organization_id == org_id)
            ),
        )
    )
