"""POST/GET /api/auth — Authentication API (Login, Logout, Session Status)"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import uuid
import hashlib
import binascii
from typing import Optional
from ...core.database import get_db
from ...models.user import User

router = APIRouter(tags=["Auth"])

# Global session cache mapping tokens to user dicts
ACTIVE_SESSIONS = {}


def hash_password(password: str) -> str:
    salt = b"smartwaste360_salt"
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return binascii.hexlify(dk).decode('utf-8')


@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    """POST /api/auth/login — Authenticates users and generates session tokens."""
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    hashed = hash_password(password)
    if user.hashed_password != hashed:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Generate token
    token = f"token_{uuid.uuid4().hex}"
    user_info = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }
    ACTIVE_SESSIONS[token] = user_info

    return {
        "token": token,
        "user": user_info,
        "detail": "Login successful"
    }


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    """POST /api/auth/logout — Invalidate session token."""
    if not authorization:
        return {"detail": "Logged out successfully (no token)"}

    # Extract token
    token = authorization.replace("Bearer ", "").strip()
    if token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[token]

    return {"detail": "Logged out successfully"}


@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    """GET /api/auth/me — Retrieves currently logged-in user profile from active sessions."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing"
        )

    token = authorization.replace("Bearer ", "").strip()
    if token not in ACTIVE_SESSIONS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )

    return ACTIVE_SESSIONS[token]
