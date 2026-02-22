import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.enums import UserRole


async def user_can_access_node(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_node_id: uuid.UUID,
    org_id: uuid.UUID,
    role: UserRole,
) -> bool:
    """Check if a user can access a given node based on their node assignments.

    Admins can access everything. Managers can access everything in their org.
    Supervisors and end_users can only access nodes they are assigned to (and descendants).
    """
    if role in (UserRole.ADMIN, UserRole.MANAGER):
        return True

    query = text("""
        SELECT EXISTS (
            SELECT 1
            FROM user_node_assignments una
            JOIN nodes assigned ON una.node_id = assigned.id
            JOIN nodes target ON target.id = :target_node_id
            WHERE una.user_id = :user_id
              AND assigned.organization_id = :org_id
              AND target.materialized_path LIKE assigned.materialized_path || '%'
        )
    """)
    result = await db.execute(
        query,
        {"user_id": user_id, "target_node_id": target_node_id, "org_id": org_id},
    )
    return bool(result.scalar())


async def get_accessible_node_ids(
    db: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    role: UserRole,
) -> list[uuid.UUID] | None:
    """Get all node IDs accessible to a user. Returns None if user has access to all nodes."""
    if role in (UserRole.ADMIN, UserRole.MANAGER):
        return None  # Access to all

    query = text("""
        SELECT DISTINCT n.id
        FROM nodes n
        JOIN user_node_assignments una ON una.user_id = :user_id
        JOIN nodes assigned ON una.node_id = assigned.id
        WHERE n.organization_id = :org_id
          AND n.materialized_path LIKE assigned.materialized_path || '%'
          AND n.is_active = true
    """)
    result = await db.execute(query, {"user_id": user_id, "org_id": org_id})
    return [row[0] for row in result.fetchall()]
