from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import Optional, List
import json
import csv
import io
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import InvestigationReport, Case, User
from app.api.deps import get_current_user, require_roles
from app.services.report_generator import ReportGenerator
from app.services.audit_service import AuditService

router = APIRouter(prefix="/reports", tags=["Investigation Reports"])

class GenerateReportRequest(BaseModel):
    case_id: int

@router.get("")
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reports = db.query(InvestigationReport).order_by(InvestigationReport.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "report_number": r.report_number,
            "case_id": r.case_id,
            "case_number": r.case.case_number if r.case else "N/A",
            "title": r.title,
            "summary": r.summary,
            "sha256_integrity_hash": r.sha256_integrity_hash,
            "author": r.author.full_name if r.author else "System",
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reports
    ]

@router.post("/generate")
def generate_report(
    payload: GenerateReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["super_admin", "investigation_officer", "senior_investigator"]))
):
    try:
        report = ReportGenerator.generate_case_report(db, payload.case_id, current_user)
        
        AuditService.log_event(
            db=db,
            action="GENERATE_REPORT",
            resource_type="Report",
            resource_id=report.report_number,
            user=current_user,
            details=f"Generated forensic report for case ID {payload.case_id}"
        )

        return {
            "success": True,
            "report_id": report.id,
            "report_number": report.report_number,
            "sha256_integrity_hash": report.sha256_integrity_hash,
            "message": "Investigation report successfully compiled and cryptographically sealed."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(InvestigationReport).filter(InvestigationReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    findings = json.loads(r.findings_json)
    return {
        "id": r.id,
        "report_number": r.report_number,
        "case_id": r.case_id,
        "title": r.title,
        "summary": r.summary,
        "findings": findings,
        "sha256_integrity_hash": r.sha256_integrity_hash,
        "created_at": r.created_at.isoformat() if r.created_at else None
    }

@router.get("/{report_id}/csv")
def download_report_csv(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(InvestigationReport).filter(InvestigationReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")

    findings = json.loads(r.findings_json)
    paths = findings.get("observed_paths", [])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Hop", "From Address", "To Address", "Amount", "Asset", "Transaction Hash", "Attribution / Pattern Flag", "Timestamp"])

    for p in paths:
        writer.writerow([
            p.get("hop"),
            p.get("from"),
            p.get("to"),
            p.get("amount"),
            p.get("asset"),
            p.get("tx_hash"),
            p.get("flag"),
            p.get("timestamp")
        ])

    AuditService.log_event(
        db=db,
        action="EXPORT_CSV",
        resource_type="Report",
        resource_id=r.report_number,
        user=current_user,
        details="Exported transaction path CSV ledger"
    )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={r.report_number}_transaction_paths.csv"}
    )
