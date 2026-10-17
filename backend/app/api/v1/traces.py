from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import datetime
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import TraceJob, TracePath, Case, User
from app.api.deps import get_current_user, require_roles
from app.services.tracing_engine import TracingEngine
from app.adapters.validator import BlockchainValidator
from app.services.audit_service import AuditService

router = APIRouter(prefix="/traces", tags=["Fund-Flow Tracing & Graph"])

class CreateTraceRequest(BaseModel):
    case_id: Optional[int] = None
    root_address: str
    network: str
    max_depth: int = 3

@router.get("")
def list_traces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    traces = db.query(TraceJob).order_by(TraceJob.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "job_number": t.job_number,
            "case_id": t.case_id,
            "case_number": t.case.case_number if t.case else "Direct Trace",
            "root_address": t.root_address,
            "network": t.network,
            "max_depth": t.max_depth,
            "status": t.status,
            "progress_percent": t.progress_percent,
            "started_at": t.started_at.isoformat() if t.started_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "paths_count": len(t.paths)
        }
        for t in traces
    ]

@router.post("")
def create_trace(
    payload: CreateTraceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator", "intelligence_analyst"]))
):
    addr = payload.root_address.strip()
    net = payload.network.strip().upper()

    valid, msg = BlockchainValidator.validate_for_network(addr, net)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Address validation failed: {msg}")

    job_number = f"TRC-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{db.query(TraceJob).count()+1:04d}"
    job = TraceJob(
        job_number=job_number,
        case_id=payload.case_id,
        root_address=addr,
        network=net,
        max_depth=payload.max_depth,
        status="QUEUED",
        progress_percent=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Execute trace
    result = TracingEngine.execute_trace(db, job)

    AuditService.log_event(
        db=db,
        action="RUN_TRACE",
        resource_type="TraceJob",
        resource_id=job.job_number,
        user=current_user,
        details=f"Ran {payload.max_depth}-hop trace for {addr} on {net}"
    )

    return result

@router.get("/{trace_id}")
def get_trace_graph(trace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(TraceJob).filter(TraceJob.id == trace_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Trace job not found")

    result = TracingEngine.execute_trace(db, job)
    return result

@router.get("/by-case/{case_id}")
def get_case_trace(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(TraceJob).filter(TraceJob.case_id == case_id).order_by(TraceJob.created_at.desc()).first()
    if not job:
        # Create a trace on demand for the reported wallet
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        job_number = f"TRC-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{db.query(TraceJob).count()+1:04d}"
        job = TraceJob(
            job_number=job_number,
            case_id=case.id,
            root_address=case.reported_wallet_address,
            network=case.reported_network,
            max_depth=3,
            status="QUEUED"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    result = TracingEngine.execute_trace(db, job)
    return result
