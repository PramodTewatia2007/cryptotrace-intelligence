from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import CrossChainHop, User
from app.api.deps import get_current_user
from app.adapters.validator import BlockchainValidator

router = APIRouter(prefix="/cross-chain", tags=["Cross-Chain Tracing"])

@router.get("")
def list_cross_chain_hops(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hops = db.query(CrossChainHop).order_by(CrossChainHop.timestamp.desc()).all()
    return [
        {
            "id": h.id,
            "source_network": h.source_network,
            "dest_network": h.dest_network,
            "source_tx_hash": h.source_tx_hash,
            "dest_tx_hash": h.dest_tx_hash,
            "bridge_protocol": h.bridge_protocol,
            "sender_address": h.sender_address,
            "receiver_address": h.receiver_address,
            "amount_sent": h.amount_sent,
            "amount_received": h.amount_received,
            "token_sent": h.token_sent,
            "token_received": h.token_received,
            "status": h.status,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None,
            "source_explorer_url": BlockchainValidator.get_explorer_url(h.source_network, "tx", h.source_tx_hash),
            "dest_explorer_url": BlockchainValidator.get_explorer_url(h.dest_network, "tx", h.dest_tx_hash) if h.dest_tx_hash else None
        }
        for h in hops
    ]
