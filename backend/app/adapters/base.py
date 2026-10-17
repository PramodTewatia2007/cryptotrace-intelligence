from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class BaseBlockchainAdapter(ABC):
    def __init__(self, network: str):
        self.network = network.upper()

    @abstractmethod
    async def get_wallet_overview(self, address: str) -> Dict[str, Any]:
        """Fetch balance, tx count, first/last seen timestamps."""
        pass

    @abstractmethod
    async def get_wallet_transactions(self, address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch incoming and outgoing transfers."""
        pass

    @abstractmethod
    async def get_transaction(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Fetch transaction details."""
        pass
