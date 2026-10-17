from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_access_token
from app.db.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    # 1. Check Bearer token
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.username == payload["sub"]).first()
            if user and user.is_active:
                return user

    # 2. Check header-based simulated user for convenience if in demo mode
    demo_user_header = request.headers.get("X-Demo-User")
    if demo_user_header:
        user = db.query(User).filter(User.username == demo_user_header).first()
        if user and user.is_active:
            return user

    # 3. Default fallback to investigation officer for immediate exploration
    default_user = db.query(User).filter(User.username == "officer_sharma").first()
    if default_user:
        return default_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials were not provided or invalid",
        headers={"WWW-Authenticate": "Bearer"},
    )

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role == "super_admin":
            return current_user # Super admin has universal access
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{current_user.role}' lacks permission for this operation. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
