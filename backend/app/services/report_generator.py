import hashlib
import json
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import Case, InvestigationReport, User, Wallet, Transaction, TraceJob, TracePath, Alert, Evidence

class ReportGenerator:
    """Generates structured digital forensic investigation reports with SHA-256 cryptographic integrity hashes."""

    @staticmethod
    def generate_case_report(db: Session, case_id: int, user: User) -> InvestigationReport:
        case = db.query(Case).filter(Case.id == case_id).first()
        if not case:
            raise ValueError(f"Case with ID {case_id} not found")

        # Collect case data
        traces = db.query(TraceJob).filter(TraceJob.case_id == case_id).all()
        alerts = db.query(Alert).filter(Alert.case_id == case_id).all()
        evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()

        paths_data = []
        for t in traces:
            paths = db.query(TracePath).filter(TracePath.trace_job_id == t.id).all()
            for p in paths:
                paths_data.append({
                    "hop": p.hop_level,
                    "from": p.from_address,
                    "to": p.to_address,
                    "amount": p.amount,
                    "asset": p.asset,
                    "tx_hash": p.tx_hash,
                    "flag": p.pattern_flag,
                    "timestamp": p.timestamp.isoformat() if p.timestamp else None
                })

        report_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        report_number = f"RPT-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{case.id:04d}"

        findings = {
            "case_metadata": {
                "case_number": case.case_number,
                "title": case.title,
                "complaint_ref": case.complaint_ref,
                "category": case.category,
                "priority": case.priority,
                "status": case.status,
                "reported_wallet": case.reported_wallet_address,
                "reported_network": case.reported_network,
                "victim_loss": f"{case.victim_loss_amount:,.2f} {case.victim_loss_currency}",
                "assigned_officer": case.assignee.full_name if case.assignee else "Unassigned",
                "officer_badge": case.assignee.badge_number if case.assignee else "N/A"
            },
            "investigation_summary": (
                f"Digital cryptocurrency forensics conducted on wallet {case.reported_wallet_address} ({case.reported_network}). "
                f"Victim reported an initial fraudulent loss of {case.victim_loss_amount:,.2f} {case.victim_loss_currency} under typology: {case.category}. "
                f"Analysis tracked fund dispersion across {len(paths_data)} observed transactions, identifying key intermediary layering nodes and downstream VASP touchpoints."
            ),
            "observed_paths": paths_data,
            "detected_alerts": [
                {
                    "rule": a.rule_name,
                    "severity": a.severity,
                    "confidence": a.confidence,
                    "description": a.description,
                    "recommended_action": a.recommended_action
                }
                for a in alerts
            ],
            "evidence_inventory": [
                {
                    "file_name": e.file_name,
                    "source": e.source,
                    "sha256": e.sha256_hash,
                    "size_bytes": e.file_size_bytes,
                    "uploaded_at": e.uploaded_at.isoformat() if e.uploaded_at else None
                }
                for e in evidence_list
            ],
            "legal_disclaimer": (
                "STATUTORY FORENSIC NOTICE: The associations and fund movements documented in this report are based on public and "
                "indexed blockchain transaction ledgers and verified VASP telemetry. They establish observed cryptographic relationships "
                "and investigative leads. Conclusive attribution to a natural person requires formal legal process (e.g., Section 91 Cr.P.C. / "
                "MLAT requisitions) served on the identified custodial Virtual Asset Service Providers."
            ),
            "generated_at": report_timestamp,
            "reporting_officer": user.full_name,
            "reporting_agency": user.department or "Cyber Crime Investigation Unit"
        }

        # Calculate SHA-256 seal of the report findings
        findings_str = json.dumps(findings, sort_keys=True)
        sha256_seal = hashlib.sha256(findings_str.encode('utf-8')).hexdigest()

        report = InvestigationReport(
            report_number=report_number,
            case_id=case_id,
            generated_by_user_id=user.id,
            title=f"Forensic Investigation Report: {case.case_number}",
            summary=findings["investigation_summary"],
            findings_json=findings_str,
            sha256_integrity_hash=sha256_seal
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return report
