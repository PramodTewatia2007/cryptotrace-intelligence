from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import datetime
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Case, Wallet, TraceJob, Alert, Evidence, InvestigationNote, User
from app.api.deps import get_current_user, require_roles
from app.adapters.validator import BlockchainValidator
from app.services.audit_service import AuditService
from app.services.tracing_engine import TracingEngine

router = APIRouter(prefix="/cases", tags=["Case Management"])

class CaseCreateRequest(BaseModel):
    title: str
    complaint_ref: Optional[str] = None
    category: str
    priority: str = "Medium"
    victim_loss_amount: float = 0.0
    victim_loss_currency: str = "USD"
    reported_tx_hash: Optional[str] = None
    reported_wallet_address: str
    reported_network: str
    description: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    auto_launch_trace: bool = True

class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    description: Optional[str] = None

class NoteCreateRequest(BaseModel):
    content: str
    is_lead: bool = False

@router.get("")
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    network: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Case)
    if status and status != "All":
        query = query.filter(Case.status == status)
    if priority and priority != "All":
        query = query.filter(Case.priority == priority)
    if network and network != "All":
        query = query.filter(Case.reported_network == network.upper())
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Case.case_number.ilike(s)) |
            (Case.title.ilike(s)) |
            (Case.complaint_ref.ilike(s)) |
            (Case.reported_wallet_address.ilike(s))
        )

    cases = query.order_by(Case.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "case_number": c.case_number,
            "title": c.title,
            "complaint_ref": c.complaint_ref,
            "category": c.category,
            "priority": c.priority,
            "status": c.status,
            "victim_loss": f"{c.victim_loss_amount:,.2f} {c.victim_loss_currency}",
            "victim_loss_amount": c.victim_loss_amount,
            "victim_loss_currency": c.victim_loss_currency,
            "reported_wallet_address": c.reported_wallet_address,
            "reported_network": c.reported_network,
            "reported_tx_hash": c.reported_tx_hash,
            "assigned_to": c.assignee.full_name if c.assignee else "Unassigned",
            "created_by": c.creator.full_name if c.creator else "System",
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "traces_count": len(c.traces),
            "alerts_count": len(c.alerts),
            "evidence_count": len(c.evidence_items)
        }
        for c in cases
    ]

@router.post("")
def create_case(
    payload: CaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator", "intelligence_analyst"]))
):
    norm_address = payload.reported_wallet_address.strip()
    norm_network = payload.reported_network.strip().upper()

    # Validate wallet address format
    valid, msg = BlockchainValidator.validate_for_network(norm_address, norm_network)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Address Validation Error: {msg}")

    # Generate sequential unique Case Number
    today_str = datetime.datetime.utcnow().strftime("%Y")
    count_cases = db.query(Case).count() + 1
    case_number = f"CT-{today_str}-{count_cases:05d}"

    new_case = Case(
        case_number=case_number,
        title=payload.title,
        complaint_ref=payload.complaint_ref,
        category=payload.category,
        priority=payload.priority,
        status="Open",
        victim_loss_amount=payload.victim_loss_amount,
        victim_loss_currency=payload.victim_loss_currency,
        reported_tx_hash=payload.reported_tx_hash,
        reported_wallet_address=norm_address,
        reported_network=norm_network,
        description=payload.description,
        created_by_user_id=current_user.id,
        assigned_to_user_id=payload.assigned_to_user_id or current_user.id
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Ensure suspect wallet record exists
    wallet = db.query(Wallet).filter(
        Wallet.address.ilike(norm_address),
        Wallet.network == norm_network
    ).first()
    if not wallet:
        wallet = Wallet(
            address=norm_address,
            network=norm_network,
            label=f"Reported Suspect ({payload.category})",
            entity_type="Suspect",
            risk_score=85.0,
            risk_level="Critical",
            total_received=payload.victim_loss_amount,
            asset_symbol="ETH" if norm_network == "ETHEREUM" else ("USDT" if norm_network == "TRON" else "BTC"),
            tags='["Primary Beneficiary", "Reported Fraud"]'
        )
        db.add(wallet)
        db.commit()

    AuditService.log_event(
        db=db,
        action="CREATE_CASE",
        resource_type="Case",
        resource_id=case_number,
        user=current_user,
        details=f"Created case {case_number} ({payload.category}) for reported wallet {norm_address} ({norm_network})"
    )

    # Automatically launch initial trace job if requested
    trace_job_id = None
    if payload.auto_launch_trace:
        job_number = f"TRC-{datetime.datetime.utcnow().strftime('%Y')}-{new_case.id:04d}"
        job = TraceJob(
            job_number=job_number,
            case_id=new_case.id,
            root_address=norm_address,
            network=norm_network,
            max_depth=3,
            status="QUEUED"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Run trace execution
        TracingEngine.execute_trace(db, job)
        trace_job_id = job.id

    return {
        "success": True,
        "case_id": new_case.id,
        "case_number": new_case.case_number,
        "trace_job_id": trace_job_id,
        "message": f"Case {case_number} successfully registered and attribution trace initiated."
    }

@router.get("/{case_id}")
def get_case_details(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    notes = db.query(InvestigationNote).filter(InvestigationNote.case_id == case_id).order_by(InvestigationNote.created_at.desc()).all()
    evidence_items = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    traces = db.query(TraceJob).filter(TraceJob.case_id == case_id).order_by(TraceJob.created_at.desc()).all()
    alerts = db.query(Alert).filter(Alert.case_id == case_id).order_by(Alert.detected_at.desc()).all()

    return {
        "id": c.id,
        "case_number": c.case_number,
        "title": c.title,
        "complaint_ref": c.complaint_ref,
        "category": c.category,
        "priority": c.priority,
        "status": c.status,
        "victim_loss_amount": c.victim_loss_amount,
        "victim_loss_currency": c.victim_loss_currency,
        "reported_tx_hash": c.reported_tx_hash,
        "reported_wallet_address": c.reported_wallet_address,
        "reported_network": c.reported_network,
        "description": c.description,
        "assigned_to": {
            "id": c.assignee.id if c.assignee else None,
            "name": c.assignee.full_name if c.assignee else "Unassigned",
            "badge": c.assignee.badge_number if c.assignee else None
        },
        "created_by": c.creator.full_name if c.creator else "System",
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "notes": [
            {
                "id": n.id,
                "author": n.author.full_name,
                "content": n.content,
                "is_lead": n.is_lead,
                "created_at": n.created_at.isoformat()
            }
            for n in notes
        ],
        "evidence": [
            {
                "id": e.id,
                "file_name": e.file_name,
                "file_type": e.file_type,
                "file_size_bytes": e.file_size_bytes,
                "sha256_hash": e.sha256_hash,
                "source": e.source,
                "uploaded_at": e.uploaded_at.isoformat()
            }
            for e in evidence_items
        ],
        "traces": [
            {
                "id": t.id,
                "job_number": t.job_number,
                "status": t.status,
                "progress_percent": t.progress_percent,
                "root_address": t.root_address,
                "network": t.network,
                "created_at": t.created_at.isoformat()
            }
            for t in traces
        ],
        "alerts": [
            {
                "id": a.id,
                "rule_name": a.rule_name,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "status": a.status,
                "detected_at": a.detected_at.isoformat()
            }
            for a in alerts
        ]
    }

@router.put("/{case_id}")
def update_case(
    case_id: int,
    payload: CaseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator"]))
):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    if payload.title is not None:
        c.title = payload.title
    if payload.priority is not None:
        c.priority = payload.priority
    if payload.status is not None:
        c.status = payload.status
    if payload.assigned_to_user_id is not None:
        c.assigned_to_user_id = payload.assigned_to_user_id
    if payload.description is not None:
        c.description = payload.description

    c.updated_at = datetime.datetime.utcnow()
    db.commit()

    AuditService.log_event(
        db=db,
        action="UPDATE_CASE",
        resource_type="Case",
        resource_id=c.case_number,
        user=current_user,
        details=f"Updated case details. Status: {c.status}, Priority: {c.priority}"
    )

    return {"success": True, "message": "Case details updated successfully."}

@router.post("/{case_id}/notes")
def add_case_note(
    case_id: int,
    payload: NoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator", "intelligence_analyst"]))
):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    note = InvestigationNote(
        case_id=case_id,
        author_id=current_user.id,
        content=payload.content,
        is_lead=payload.is_lead,
        created_at=datetime.datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    AuditService.log_event(
        db=db,
        action="ADD_NOTE",
        resource_type="Case",
        resource_id=c.case_number,
        user=current_user,
        details="Added investigation note"
    )

    return {"success": True, "note_id": note.id, "message": "Note recorded."}
