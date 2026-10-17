import datetime
import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.db.models import AuditEvent, User

class AuditService:
    """Provides tamper-evident audit logging for all compliance and investigative operations."""

    @staticmethod
    def log_event(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        user: Optional[User] = None,
        username: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        user_agent: str = "Investigation-Console",
        details: Optional[Any] = None
    ) -> AuditEvent:
        resolved_username = user.username if user else (username or "SYSTEM")
        resolved_user_id = user.id if user else None

        details_str = None
        if details is not None:
            if isinstance(details, (dict, list)):
                details_str = json.dumps(details)
            else:
                details_str = str(details)

        event = AuditEvent(
            user_id=resolved_user_id,
            username=resolved_username,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details_str,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
