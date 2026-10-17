from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Wallet, Transaction, User
from app.api.deps import get_current_user
from app.adapters.validator import BlockchainValidator
from app.services.vasp_intelligence import VaspIntelligenceService
from app.services.risk_scoring import RiskScoringEngine
from app.services.audit_service import AuditService

router = APIRouter(prefix="/wallets", tags=["Wallet Intelligence"])

class ValidateAddressRequest(BaseModel):
    address: str
    network: Optional[str] = None

@router.post("/validate")
def validate_address(payload: ValidateAddressRequest):
    addr = payload.address.strip()
    detected_networks = BlockchainValidator.detect_network(addr)
    
    is_valid = False
    validation_message = ""
    target_network = payload.network.upper() if payload.network else (detected_networks[0] if detected_networks else "UNKNOWN")

    if target_network != "UNKNOWN":
        is_valid, validation_message = BlockchainValidator.validate_for_network(addr, target_network)
    else:
        validation_message = "Address format does not match any supported blockchain (BTC, ETH, TRX, SOL, BSC, POLYGON)."

    explorer_link = BlockchainValidator.get_explorer_url(target_network, "address", addr) if is_valid else None

    return {
        "address": addr,
        "is_valid": is_valid,
        "network": target_network,
        "detected_networks": detected_networks,
        "validation_message": validation_message,
        "explorer_url": explorer_link
    }

@router.get("/{network}/{address}")
def get_wallet_profile(
    network: str,
    address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    norm_net = network.upper()
    norm_addr = address.strip()

    valid, msg = BlockchainValidator.validate_for_network(norm_addr, norm_net)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid address for network {norm_net}: {msg}")

    wallet = db.query(Wallet).filter(
        Wallet.address.ilike(norm_addr),
        Wallet.network == norm_net
    ).first()

    # VASP Attribution lookup
    attribution = VaspIntelligenceService.identify_address(db, norm_addr, norm_net)

    # Compute risk score
    is_cex_deposit = bool(attribution and "Deposit" in attribution["attribution_type"])
    risk = RiskScoringEngine.calculate_wallet_risk(
        wallet_address=norm_addr,
        network=norm_net,
        entity_type=wallet.entity_type if wallet else "Unknown",
        tags=[],
        has_mixer_interaction=bool(wallet and wallet.risk_score >= 80),
        has_rapid_dispersion=True if wallet and "Rapid" in (wallet.risk_factors or "") else False,
        has_peeling_chain=True if wallet and "Peeling" in (wallet.risk_factors or "") else False,
        is_direct_scam_recipient=True if wallet and wallet.entity_type == "Suspect" else False,
        is_exchange_deposit=is_cex_deposit,
        total_volume=wallet.total_received if wallet else 0.0
    )

    # Incoming & Outgoing transaction counts
    in_txs = db.query(Transaction).filter(Transaction.to_address.ilike(norm_addr), Transaction.network == norm_net).count()
    out_txs = db.query(Transaction).filter(Transaction.from_address.ilike(norm_addr), Transaction.network == norm_net).count()

    AuditService.log_event(
        db=db,
        action="SEARCH_WALLET",
        resource_type="Wallet",
        resource_id=norm_addr,
        user=current_user,
        details=f"Inspected wallet profile on {norm_net}"
    )

    return {
        "address": norm_addr,
        "network": norm_net,
        "label": wallet.label if wallet else "Unlabeled Address",
        "entity_type": wallet.entity_type if wallet else ("VASP_Deposit" if is_cex_deposit else "Unclassified"),
        "balance": wallet.current_balance if wallet else 0.0,
        "total_received": wallet.total_received if wallet else 0.0,
        "total_sent": wallet.total_sent if wallet else 0.0,
        "asset_symbol": wallet.asset_symbol if wallet else ("ETH" if norm_net in ("ETHEREUM", "POLYGON", "BSC") else ("USDT" if norm_net == "TRON" else "BTC")),
        "tx_count": in_txs + out_txs,
        "in_tx_count": in_txs,
        "out_tx_count": out_txs,
        "risk": risk,
        "attribution": attribution,
        "explorer_url": BlockchainValidator.get_explorer_url(norm_net, "address", norm_addr),
        "is_demo": wallet.is_demo if wallet else True
    }
