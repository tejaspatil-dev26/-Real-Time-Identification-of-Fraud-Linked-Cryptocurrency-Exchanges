from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user_claims
from app.schemas.auth_schema import UserLogin, UserRegister, TokenResponse, RefreshTokenRequest, UserPublic
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await AuthService.authenticate_user(db, login_data)

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(register_data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await AuthService.register_user(db, register_data)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.refresh_access_token(db, request.refresh_token)

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(claims: Dict[str, Any] = Depends(get_current_user_claims)):
    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "role": claims.get("role"),
        "issuer": claims.get("iss"),
    }
