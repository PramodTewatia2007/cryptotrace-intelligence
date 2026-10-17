from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import datetime
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import VaspEntity, WalletAttribution, User
from app.api.deps import get_current_user, require_roles
from app.services.vasp_intelligence import VaspIntelligenceService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/vasp", tags=["Exchange and VASP Intelligence"])

class AttributionCreateRequest(BaseModel):
    wallet_address: str
    network: str
    vasp_id: int
    attribution_type: str = "Deposit Address"
    confidence_score: float = 90.0
    confidence_level: str = "Verified"
    evidence_source: str
    notes: Optional[str] = None

@router.get("/entities")
def list_vasp_entities(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return VaspIntelligenceService.get_known_vasp_directory(db)

@router.get("/attributions")
def list_attributions(network: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(WalletAttribution)
    if network and network != "All":
        query = query.filter(WalletAttribution.network == network.upper())
    
    attrs = query.all()
    return [
        {
            "id": a.id,
            "wallet_address": a.wallet_address,
            "network": a.network,
            "vasp_id": a.vasp_entity.id,
            "vasp_name": a.vasp_entity.name,
            "vasp_category": a.vasp_entity.category,
            "jurisdiction": a.vasp_entity.jurisdiction,
            "compliance_email": a.vasp_entity.compliance_contact_email,
            "le_portal": a.vasp_entity.law_enforcement_portal_url,
            "attribution_type": a.attribution_type,
            "confidence_score": a.confidence_score,
            "confidence_level": a.confidence_level,
            "evidence_source": a.evidence_source,
            "verified_by_analyst": a.verified_by_analyst,
            "notes": a.notes,
            "legal_guidance": VaspIntelligenceService.get_legal_guidance(a.vasp_entity.name, a.vasp_entity.jurisdiction),
            "last_verified_at": a.last_verified_at.isoformat() if a.last_verified_at else None
        }
        for a in attrs
    ]

@router.post("/attributions")
def create_attribution(
    payload: AttributionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "senior_investigator", "intelligence_analyst"]))
):
    vasp = db.query(VaspEntity).filter(VaspEntity.id == payload.vasp_id).first()
    if not vasp:
        raise HTTPException(status_code=404, detail="VASP Entity not found")

    attr = WalletAttribution(
        wallet_address=payload.wallet_address.strip(),
        network=payload.network.upper(),
        vasp_entity_id=vasp.id,
        attribution_type=payload.attribution_type,
        confidence_score=payload.confidence_score,
        confidence_level=payload.confidence_level,
        evidence_source=payload.evidence_source,
        verified_by_analyst=current_user.badge_number or current_user.username,
        notes=payload.notes,
        last_verified_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(attr)
    db.commit()
    db.refresh(attr)

    AuditService.log_event(
        db=db,
        action="ADD_ATTRIBUTION",
        resource_type="Attribution",
        resource_id=f"{payload.wallet_address} -> {vasp.name}",
        user=current_user,
        details=f"Associated wallet with {vasp.name} as {payload.attribution_type}"
    )

    return {"success": True, "attribution_id": attr.id, "message": "Attribution logged with evidence provenance."}
