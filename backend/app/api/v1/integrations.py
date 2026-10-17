from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import IntegrationConfig, User
from app.api.deps import get_current_user, require_roles
from app.services.le_integrations import LawEnforcementIntegrations
from app.services.audit_service import AuditService

router = APIRouter(prefix="/integrations", tags=["Data Sources & Integrations"])

class NCRPSyncRequest(BaseModel):
    acknowledgement_number: str

class SAHYOGPushRequest(BaseModel):
    case_number: str
    wallet_address: str
    network: str

class ToggleIntegrationRequest(BaseModel):
    is_enabled: bool
    is_mock: bool

@router.get("")
def list_integrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return LawEnforcementIntegrations.get_all_integrations(db)

@router.post("/ncrp/sync")
def sync_ncrp_complaint(
    payload: NCRPSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator"]))
):
    res = LawEnforcementIntegrations.test_ncrp_sync(db, payload.acknowledgement_number)

    AuditService.log_event(
        db=db,
        action="SYNC_NCRP",
        resource_type="Integration",
        resource_id=payload.acknowledgement_number,
        user=current_user,
        details="Fetched complaint metadata from NCRP connector."
    )

    return res

@router.post("/sahyog/push")
def push_sahyog_lead(
    payload: SAHYOGPushRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "senior_investigator"]))
):
    res = LawEnforcementIntegrations.test_sahyog_push(db, payload.case_number, payload.wallet_address, payload.network)

    AuditService.log_event(
        db=db,
        action="PUSH_SAHYOG",
        resource_type="Integration",
        resource_id=payload.case_number,
        user=current_user,
        details=f"Pushed wallet lead {payload.wallet_address} to SAHYOG platform."
    )

    return res

@router.put("/{integration_id}")
def update_integration(
    integration_id: int,
    payload: ToggleIntegrationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin"]))
):
    cfg = db.query(IntegrationConfig).filter(IntegrationConfig.id == integration_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Integration not found")

    cfg.is_enabled = payload.is_enabled
    cfg.is_mock = payload.is_mock
    db.commit()

    return {"success": True, "message": f"Updated integration {cfg.name} configuration."}
