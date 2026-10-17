from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AuditEvent, User
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("")
def list_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "auditor", "senior_investigator"]))
):
    query = db.query(AuditEvent)
    if action and action != "All":
        query = query.filter(AuditEvent.action == action)
    if username:
        query = query.filter(AuditEvent.username.ilike(f"%{username}%"))

    logs = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "username": l.username,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        }
        for l in logs
    ]
