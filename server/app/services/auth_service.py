from datetime import timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.schemas.auth_schema import UserLogin, UserRegister, TokenResponse, UserPublic
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token

class AuthService:
    @staticmethod
    async def authenticate_user(session: AsyncSession, login_data: UserLogin) -> TokenResponse:
        stmt = select(User).where(User.email == login_data.email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials: username or password does not match.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Contact system administrator.",
            )

        access_token = create_access_token(user.id, user.email, user.role.value)
        refresh_token = create_refresh_token(user.id, user.email, user.role.value)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserPublic(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role.value,
                agency_or_firm=user.agency_or_firm,
                is_active=user.is_active,
            ),
        )

    @staticmethod
    async def register_user(session: AsyncSession, register_data: UserRegister) -> UserPublic:
        stmt = select(User).where(User.email == register_data.email)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A user with email '{register_data.email}' already exists.",
            )

        try:
            role_enum = UserRole[register_data.role.replace("ROLE_", "")]
        except KeyError:
            role_enum = UserRole.INVESTIGATOR

        new_user = User(
            email=register_data.email,
            hashed_password=get_password_hash(register_data.password),
            full_name=register_data.full_name,
            role=role_enum,
            agency_or_firm=register_data.agency_or_firm,
            is_active=True,
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        return UserPublic(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role.value,
            agency_or_firm=new_user.agency_or_firm,
            is_active=new_user.is_active,
        )

    @staticmethod
    async def refresh_access_token(session: AsyncSession, refresh_token: str) -> TokenResponse:
        claims = decode_token(refresh_token)
        if claims.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provided token is not a valid refresh token",
            )

        user_id = claims.get("sub")
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with refresh token is invalid or inactive",
            )

        new_access = create_access_token(user.id, user.email, user.role.value)
        new_refresh = create_refresh_token(user.id, user.email, user.role.value)

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserPublic(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                role=user.role.value,
                agency_or_firm=user.agency_or_firm,
                is_active=user.is_active,
            ),
        )
