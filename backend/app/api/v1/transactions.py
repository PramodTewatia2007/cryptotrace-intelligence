from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Transaction, User
from app.api.deps import get_current_user
from app.adapters.validator import BlockchainValidator

router = APIRouter(prefix="/transactions", tags=["Transaction Explorer"])

@router.get("")
def list_transactions(
    network: Optional[str] = None,
    address: Optional[str] = None,
    tx_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction)
    if network and network != "All":
        query = query.filter(Transaction.network == network.upper())
    if address:
        addr = address.strip()
        query = query.filter((Transaction.from_address.ilike(addr)) | (Transaction.to_address.ilike(addr)))
    if tx_type and tx_type != "All":
        query = query.filter(Transaction.tx_type == tx_type)

    txs = query.order_by(Transaction.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": t.id,
            "tx_hash": t.tx_hash,
            "network": t.network,
            "from_address": t.from_address,
            "to_address": t.to_address,
            "amount": t.amount,
            "asset_symbol": t.asset_symbol,
            "fee": t.fee,
            "block_number": t.block_number,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "is_token_transfer": t.is_token_transfer,
            "token_contract": t.token_contract,
            "tx_type": t.tx_type,
            "explorer_url": BlockchainValidator.get_explorer_url(t.network, "tx", t.tx_hash),
            "is_demo": t.is_demo
        }
        for t in txs
    ]

@router.get("/{network}/{tx_hash}")
def get_transaction_detail(
    network: str,
    tx_hash: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    net = network.upper()
    norm_hash = tx_hash.strip()

    tx = db.query(Transaction).filter(
        Transaction.tx_hash.ilike(norm_hash),
        Transaction.network == net
    ).first()

    if not tx:
        # Create a preview representation with valid explorer link
        return {
            "tx_hash": norm_hash,
            "network": net,
            "from_address": "0x0000000000000000000000000000000000000000",
            "to_address": "0x0000000000000000000000000000000000000000",
            "amount": 0.0,
            "asset_symbol": "ETH" if net == "ETHEREUM" else ("USDT" if net == "TRON" else "BTC"),
            "fee": 0.0,
            "block_number": None,
            "timestamp": None,
            "is_token_transfer": False,
            "tx_type": "Direct",
            "explorer_url": BlockchainValidator.get_explorer_url(net, "tx", norm_hash),
            "status": "Queried on Block Explorer",
            "is_demo": False
        }

    return {
        "id": tx.id,
        "tx_hash": tx.tx_hash,
        "network": tx.network,
        "from_address": tx.from_address,
        "to_address": tx.to_address,
        "amount": tx.amount,
        "asset_symbol": tx.asset_symbol,
        "fee": tx.fee,
        "block_number": tx.block_number,
        "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
        "is_token_transfer": tx.is_token_transfer,
        "token_contract": tx.token_contract,
        "tx_type": tx.tx_type,
        "explorer_url": BlockchainValidator.get_explorer_url(tx.network, "tx", tx.tx_hash),
        "is_demo": tx.is_demo
    }
