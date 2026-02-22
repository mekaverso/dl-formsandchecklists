from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.schemas import (
    DevLoginRequest,
    GoogleAuthRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserProfile,
)
from src.auth.service import (
    authenticate_dev,
    authenticate_google,
    get_user_with_orgs,
    refresh_access_token,
    revoke_refresh_token,
)
from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.organizations.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    body: GoogleAuthRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    access_token, refresh_token = await authenticate_google(db, body.credential)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(
    body: DevLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    access_token, refresh_token = await authenticate_dev(
        db, email=body.email, full_name=body.full_name,
        password=body.password, username=body.username,
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    access_token, new_refresh = await refresh_access_token(
        db, body.refresh_token, body.device_id
    )
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout")
async def logout(
    body: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await revoke_refresh_token(db, body.refresh_token)
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserProfile)
async def get_me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_user_with_orgs(db, user)
