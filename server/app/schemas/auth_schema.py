from typing import Optional
from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "INVESTIGATOR"
    agency_or_firm: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserPublic"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    agency_or_firm: str
    is_active: bool

TokenResponse.model_rebuild()
