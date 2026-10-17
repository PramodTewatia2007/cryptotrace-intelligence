from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Case, Wallet, TraceJob, Alert, Transaction, IntegrationConfig, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Overview Dashboard"])

@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_cases = db.query(Case).count()
    open_cases = db.query(Case).filter(Case.status.in_(["Open", "In Progress", "Pending Review"])).count()
    closed_cases = db.query(Case).filter(Case.status == "Closed").count()

    total_wallets = db.query(Wallet).count()
    high_risk_wallets = db.query(Wallet).filter(Wallet.risk_level.in_(["High", "Critical"])).count()

    traces_in_progress = db.query(TraceJob).filter(TraceJob.status.in_(["QUEUED", "RUNNING"])).count()
    traces_completed = db.query(TraceJob).filter(TraceJob.status == "COMPLETED").count()

    total_alerts = db.query(Alert).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "Critical").count()

    total_loss_tracked = db.query(func.sum(Case.victim_loss_amount)).scalar() or 0.0

    recent_cases = db.query(Case).order_by(Case.created_at.desc()).limit(5).all()
    recent_alerts = db.query(Alert).order_by(Alert.detected_at.desc()).limit(6).all()
    integrations = db.query(IntegrationConfig).all()

    # Network distribution
    networks = db.query(Wallet.network, func.count(Wallet.id)).group_by(Wallet.network).all()
    network_distribution = [{"network": n[0], "count": n[1]} for n in networks]

    return {
        "stats": {
            "total_cases": total_cases,
            "open_cases": open_cases,
            "closed_cases": closed_cases,
            "wallets_analyzed": total_wallets,
            "high_risk_wallets": high_risk_wallets,
            "traces_in_progress": traces_in_progress,
            "traces_completed": traces_completed,
            "total_alerts": total_alerts,
            "critical_alerts": critical_alerts,
            "total_loss_tracked_usd": total_loss_tracked,
            "active_investigators": db.query(User).filter(User.is_active == True).count()
        },
        "recent_cases": [
            {
                "id": c.id,
                "case_number": c.case_number,
                "title": c.title,
                "complaint_ref": c.complaint_ref,
                "category": c.category,
                "priority": c.priority,
                "status": c.status,
                "reported_wallet": c.reported_wallet_address,
                "reported_network": c.reported_network,
                "victim_loss": f"{c.victim_loss_amount:,.2f} {c.victim_loss_currency}",
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in recent_cases
        ],
        "recent_alerts": [
            {
                "id": a.id,
                "case_id": a.case_id,
                "wallet_address": a.wallet_address,
                "network": a.network,
                "rule_name": a.rule_name,
                "severity": a.severity,
                "confidence": a.confidence,
                "description": a.description,
                "detected_at": a.detected_at.isoformat() if a.detected_at else None,
                "status": a.status
            }
            for a in recent_alerts
        ],
        "data_sources_health": [
            {
                "name": i.display_title,
                "status": i.status,
                "is_mock": i.is_mock,
                "last_ping_at": i.last_ping_at.isoformat() if i.last_ping_at else None
            }
            for i in integrations
        ],
        "network_distribution": network_distribution
    }
