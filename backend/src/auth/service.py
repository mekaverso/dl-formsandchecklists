import re
import uuid
from datetime import datetime, timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.auth.models import RefreshToken
from src.config import settings
from src.core.enums import UserRole
from src.core.exceptions import BadRequestError, UnauthorizedError
from src.core.security import (
    create_access_token,
    create_refresh_token,
    get_refresh_token_expiry,
    hash_refresh_token,
)
from src.organizations.models import Organization, User, UserOrganizationRole


async def verify_google_token(credential: str) -> dict:
    """Verify a Google ID token and return user info."""
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
        return {
            "email": idinfo["email"],
            "full_name": idinfo.get("name", ""),
            "google_sub": idinfo["sub"],
            "avatar_url": idinfo.get("picture"),
        }
    except ValueError as e:
        raise BadRequestError(f"Invalid Google token: {e}")


async def _issue_tokens(
    db: AsyncSession, user: User, device_id: str | None = None
) -> tuple[str, str]:
    """Create access + refresh tokens for a user."""
    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    access_token = create_access_token(user_id=user.id, email=user.email)
    raw_refresh, token_hash = create_refresh_token()

    refresh = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        device_id=device_id,
        expires_at=get_refresh_token_expiry(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(refresh)

    return access_token, raw_refresh


async def authenticate_google(
    db: AsyncSession, credential: str, device_id: str | None = None
) -> tuple[str, str]:
    """Authenticate via Google. Returns (access_token, refresh_token)."""
    google_info = await verify_google_token(credential)

    # Find or create user
    result = await db.execute(
        select(User).where(User.google_sub == google_info["google_sub"])
    )
    user = result.scalar_one_or_none()

    if not user:
        # Try by email
        result = await db.execute(
            select(User).where(User.email == google_info["email"])
        )
        user = result.scalar_one_or_none()
        if user:
            user.google_sub = google_info["google_sub"]
            if not user.avatar_url and google_info.get("avatar_url"):
                user.avatar_url = google_info["avatar_url"]
        else:
            user = User(
                email=google_info["email"],
                full_name=google_info["full_name"],
                google_sub=google_info["google_sub"],
                avatar_url=google_info.get("avatar_url"),
            )
            db.add(user)

    return await _issue_tokens(db, user, device_id)


async def authenticate_dev(
    db: AsyncSession, email: str, full_name: str, password: str,
    username: str | None = None,
) -> tuple[str, str]:
    """Username/password login. Auto-creates admin user on first login."""
    import hashlib

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    lookup = username or email

    if not lookup:
        raise BadRequestError("Username is required")

    result = await db.execute(select(User).where(User.email == lookup))
    user = result.scalar_one_or_none()

    if user:
        if user.password_hash != password_hash:
            raise UnauthorizedError("Invalid username or password")
    else:
        display_name = full_name if full_name else (username or lookup)
        user = User(
            email=lookup,
            full_name=display_name,
            password_hash=password_hash,
        )
        db.add(user)
        await db.flush()

    # Ensure user has at least one organization
    result = await db.execute(
        select(UserOrganizationRole).where(UserOrganizationRole.user_id == user.id)
    )
    membership = result.scalar_one_or_none()

    if not membership:
        slug = re.sub(r"[^a-z0-9]+", "-", lookup.lower()).strip("-") or "default"
        result = await db.execute(select(Organization).where(Organization.slug == slug))
        org = result.scalar_one_or_none()

        if not org:
            org_name = display_name + "'s Organization"
            org = Organization(
                name=org_name,
                slug=slug,
                is_active=True,
            )
            db.add(org)
            await db.flush()

        membership = UserOrganizationRole(
            user_id=user.id,
            organization_id=org.id,
            role=UserRole.ADMIN,
            created_at=datetime.now(timezone.utc),
        )
        db.add(membership)

    return await _issue_tokens(db, user)


async def get_user_with_orgs(db: AsyncSession, user: User) -> dict:
    """Load user with organization memberships for the /me response."""
    result = await db.execute(
        select(UserOrganizationRole)
        .options(selectinload(UserOrganizationRole.organization))
        .where(UserOrganizationRole.user_id == user.id)
    )
    memberships = result.scalars().all()

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "organizations": [
            {
                "organization_id": m.organization_id,
                "organization_name": m.organization.name,
                "role": m.role.value if hasattr(m.role, "value") else m.role,
            }
            for m in memberships
        ],
    }


async def refresh_access_token(
    db: AsyncSession, raw_refresh_token: str, device_id: str | None = None
) -> tuple[str, str]:
    """Refresh an access token. Returns (new_access_token, new_refresh_token)."""
    token_hash = hash_refresh_token(raw_refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    )
    stored_token = result.scalar_one_or_none()

    if not stored_token:
        raise UnauthorizedError("Invalid refresh token")

    if stored_token.expires_at < datetime.now(timezone.utc):
        stored_token.is_revoked = True
        raise UnauthorizedError("Refresh token expired")

    # Revoke old token (rotation)
    stored_token.is_revoked = True

    # Get user
    result = await db.execute(select(User).where(User.id == stored_token.user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    # Issue new tokens
    access_token = create_access_token(user_id=user.id, email=user.email)
    new_raw_refresh, new_token_hash = create_refresh_token()

    new_refresh = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        device_id=device_id,
        expires_at=get_refresh_token_expiry(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_refresh)

    return access_token, new_raw_refresh


async def revoke_refresh_token(db: AsyncSession, raw_refresh_token: str) -> None:
    """Revoke a refresh token (logout)."""
    token_hash = hash_refresh_token(raw_refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored_token = result.scalar_one_or_none()
    if stored_token:
        stored_token.is_revoked = True
