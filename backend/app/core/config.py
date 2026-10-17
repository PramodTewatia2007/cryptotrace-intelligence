import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "CryptoTrace Intelligence"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cryptotrace-super-secret-key-law-enforcement-jwt-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cryptotrace.db")
    
    # System Operational Mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # External API Keys (Optional - falls back to public rate-limited endpoints or rich synthetic data)
    ETHERSCAN_API_KEY: str = os.getenv("ETHERSCAN_API_KEY", "")
    TRONSCAN_API_KEY: str = os.getenv("TRONSCAN_API_KEY", "")
    BLOCKSTREAM_API_URL: str = os.getenv("BLOCKSTREAM_API_URL", "https://blockstream.info/api")
    SOLANA_RPC_URL: str = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
    
    # Law Enforcement Mock Integration Flags
    NCRP_INTEGRATION_ENABLED: bool = True
    NCRP_IS_MOCK: bool = True
    SAHYOG_INTEGRATION_ENABLED: bool = True
    SAHYOG_IS_MOCK: bool = True

settings = Settings()
