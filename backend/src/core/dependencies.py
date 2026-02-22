import uuid
from typing import Annotated

from fastapi import Depends, Path
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.enums import UserRole
from src.core.exceptions import ForbiddenError, NotFoundError, UnauthorizedError
from src.core.security import decode_access_token

security_scheme = HTTPBearer()

# Forward references — these models are imported at module level to avoid circular imports.
# The actual model classes are resolved at runtime.
from src.auth.models import RefreshToken  # noqa: E402
from src.organizations.models import Node, Organization, UserOrganizationRole  # noqa: E402
from src.organizations.models import User  # noqa: E402


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise UnauthorizedError("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


async def get_current_org_member(
    org_id: Annotated[uuid.UUID, Path()],
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserOrganizationRole:
    result = await db.execute(
        select(UserOrganizationRole).where(
            UserOrganizationRole.user_id == user.id,
            UserOrganizationRole.organization_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise ForbiddenError("Not a member of this organization")
    return membership


def require_role(*min_roles: UserRole):
    """Dependency that checks if the user has one of the allowed roles."""

    async def checker(
        membership: Annotated[UserOrganizationRole, Depends(get_current_org_member)],
    ) -> UserOrganizationRole:
        if membership.role not in min_roles:
            raise ForbiddenError(f"Requires one of: {[r.value for r in min_roles]}")
        return membership

    return checker
