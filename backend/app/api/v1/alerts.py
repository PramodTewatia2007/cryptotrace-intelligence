from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Alert, User
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import AuditService

router = APIRouter(prefix="/alerts", tags=["Risk & Alerts"])

class AlertStatusUpdate(BaseModel):
    status: str # New, Under Investigation, Dismissed, Escalated

@router.get("")
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)
    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)
    if status and status != "All":
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.detected_at.desc()).all()
    return [
        {
            "id": a.id,
            "case_id": a.case_id,
            "case_number": a.case.case_number if a.case else "Global Lead",
            "wallet_address": a.wallet_address,
            "network": a.network,
            "rule_code": a.rule_code,
            "rule_name": a.rule_name,
            "severity": a.severity,
            "confidence": a.confidence,
            "description": a.description,
            "recommended_action": a.recommended_action,
            "status": a.status,
            "detected_at": a.detected_at.isoformat() if a.detected_at else None
        }
        for a in alerts
    ]

@router.post("/{alert_id}/review")
def review_alert(
    alert_id: int,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator", "intelligence_analyst"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = payload.status
    db.commit()

    AuditService.log_event(
        db=db,
        action="REVIEW_ALERT",
        resource_type="Alert",
        resource_id=str(alert.id),
        user=current_user,
        details=f"Updated alert status to {payload.status}"
    )

    return {"success": True, "alert_id": alert.id, "new_status": alert.status}
