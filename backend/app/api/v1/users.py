from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["User and Role Management"])

class UserCreateRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str # super_admin, investigation_officer, senior_investigator, intelligence_analyst, auditor, read_only
    badge_number: Optional[str] = None
    department: Optional[str] = "Cyber Crime Investigation Unit"

class UserRoleUpdateRequest(BaseModel):
    role: str
    is_active: Optional[bool] = None

@router.get("")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "badge_number": u.badge_number,
            "department": u.department,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]

@router.post("")
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin"]))
):
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        badge_number=payload.badge_number,
        department=payload.department or "Cyber Crime Investigation Unit",
        role=payload.role,
        hashed_password=get_password_hash(payload.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log_event(
        db=db,
        action="CREATE_USER",
        resource_type="User",
        resource_id=new_user.username,
        user=current_user,
        details=f"Created user with role {payload.role}"
    )

    return {"success": True, "user_id": new_user.id, "message": "User created successfully."}

@router.put("/{user_id}")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = u.role
    u.role = payload.role
    if payload.is_active is not None:
        u.is_active = payload.is_active
    db.commit()

    AuditService.log_event(
        db=db,
        action="UPDATE_USER_ROLE",
        resource_type="User",
        resource_id=u.username,
        user=current_user,
        details=f"Modified role from {old_role} to {payload.role}"
    )

    return {"success": True, "message": f"User {u.username} role updated to {payload.role}."}
