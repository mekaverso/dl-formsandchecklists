import uuid

from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class DevLoginRequest(BaseModel):
    email: str = ""
    full_name: str = ""
    password: str
    username: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
    device_id: str | None = None


class OrgMembership(BaseModel):
    organization_id: uuid.UUID
    organization_name: str
    role: str

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    organizations: list[OrgMembership] = []

    model_config = {"from_attributes": True}
