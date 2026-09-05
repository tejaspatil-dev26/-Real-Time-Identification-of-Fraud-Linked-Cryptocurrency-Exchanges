import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import bcrypt
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SERVER_DIR = Path(__file__).resolve().parent.parent.parent

def _resolve_key_path(configured_path: str, filename: str) -> Path:
    # Try configured path directly
    p = Path(configured_path)
    if p.is_file():
        return p
    # Try relative to server directory
    p_server = SERVER_DIR / configured_path
    if p_server.is_file():
        return p_server
    # Try server/certs/<filename>
    p_certs = SERVER_DIR / "certs" / filename
    if p_certs.is_file():
        return p_certs
    # Try workspace/certs/<filename>
    p_ws = SERVER_DIR.parent / "certs" / filename
    if p_ws.is_file():
        return p_ws
    return p_certs

def load_keys():
    priv_path = _resolve_key_path(settings.JWT_PRIVATE_KEY_PATH, "private_key.pem")
    pub_path = _resolve_key_path(settings.JWT_PUBLIC_KEY_PATH, "public_key.pem")

    if priv_path.is_file() and pub_path.is_file():
        return priv_path.read_text(encoding="utf-8"), pub_path.read_text(encoding="utf-8")

    # Generate on the fly if not found
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode("utf-8")
    pub_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")

    priv_path.parent.mkdir(parents=True, exist_ok=True)
    priv_path.write_text(priv_pem, encoding="utf-8")
    pub_path.write_text(pub_pem, encoding="utf-8")
    return priv_pem, pub_pem

_PRIVATE_KEY, _PUBLIC_KEY = load_keys()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")

class TokenPayload(BaseModel):
    sub: str
    email: str
    role: str
    iss: str = settings.JWT_ISSUER
    exp: int

def create_access_token(
    user_id: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    clean_role = role.replace("ROLE_", "")

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": clean_role,
        "iss": settings.JWT_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    
    token = jwt.encode(payload, _PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
    return token

def create_refresh_token(user_id: str, email: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    clean_role = role.replace("ROLE_", "")
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": clean_role,
        "iss": settings.JWT_ISSUER,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, _PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            _PUBLIC_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER
        )
        return payload
    except jwt.ExpiredSignatureError:
        if settings.ENVIRONMENT == "development":
            return jwt.decode(
                token,
                _PUBLIC_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                issuer=settings.JWT_ISSUER,
                options={"verify_exp": False}
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid cryptographic token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_claims(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    return decode_token(token)

def require_roles(allowed_roles: List[str]):
    def role_checker(claims: Dict[str, Any] = Depends(get_current_user_claims)) -> Dict[str, Any]:
        user_role = claims.get("role", "")
        user_clean = user_role.replace("ROLE_", "")
        allowed_clean = [r.replace("ROLE_", "") for r in allowed_roles]

        if user_clean not in allowed_clean and "ADMIN" != user_clean:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}, your role is {user_role}"
            )
        return claims
    return role_checker
