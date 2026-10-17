from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user, require_roles
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["System Settings"])

class SystemSettingsUpdate(BaseModel):
    demo_mode: Optional[bool] = None
    etherscan_api_key: Optional[str] = None
    tronscan_api_key: Optional[str] = None
    blockstream_api_url: Optional[str] = None
    solana_rpc_url: Optional[str] = None

@router.get("")
def get_system_settings(current_user: User = Depends(get_current_user)):
    return {
        "project_name": settings.PROJECT_NAME,
        "demo_mode": settings.DEMO_MODE,
        "api_v1_str": settings.API_V1_STR,
        "database_type": "SQLite (Local Compliant)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL",
        "has_etherscan_key": bool(settings.ETHERSCAN_API_KEY),
        "has_tronscan_key": bool(settings.TRONSCAN_API_KEY),
        "blockstream_api_url": settings.BLOCKSTREAM_API_URL,
        "solana_rpc_url": settings.SOLANA_RPC_URL,
        "ncrp_enabled": settings.NCRP_INTEGRATION_ENABLED,
        "sahyog_enabled": settings.SAHYOG_INTEGRATION_ENABLED
    }

@router.put("")
def update_system_settings(
    payload: SystemSettingsUpdate,
    current_user: User = Depends(require_roles(["super_admin"]))
):
    if payload.demo_mode is not None:
        settings.DEMO_MODE = payload.demo_mode
    if payload.etherscan_api_key is not None:
        settings.ETHERSCAN_API_KEY = payload.etherscan_api_key
    if payload.tronscan_api_key is not None:
        settings.TRONSCAN_API_KEY = payload.tronscan_api_key
    if payload.blockstream_api_url is not None:
        settings.BLOCKSTREAM_API_URL = payload.blockstream_api_url
    if payload.solana_rpc_url is not None:
        settings.SOLANA_RPC_URL = payload.solana_rpc_url

    return {"success": True, "message": "System settings updated successfully."}
