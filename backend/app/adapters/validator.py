import re
from typing import Dict, List, Optional, Tuple

BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

class BlockchainValidator:
    """Validates addresses and transaction hashes across 6 major blockchains."""

    @staticmethod
    def is_valid_bitcoin(address: str) -> bool:
        address = address.strip()
        # Legacy P2PKH (starts with 1, 26-35 chars base58)
        if re.match(r"^1[1-9A-HJ-NP-Za-km-z]{25,34}$", address):
            return True
        # P2SH (starts with 3, 26-35 chars base58)
        if re.match(r"^3[1-9A-HJ-NP-Za-km-z]{25,34}$", address):
            return True
        # Bech32 Segwit v0 / Taproot v1 (bc1q... or bc1p..., 42 or 62 chars)
        if re.match(r"^bc1[a-z0-9]{39,59}$", address.lower()):
            return True
        return False

    @staticmethod
    def is_valid_evm(address: str) -> bool:
        address = address.strip()
        # 0x + 40 hex chars
        return bool(re.match(r"^0x[a-fA-F0-9]{40}$", address))

    @staticmethod
    def is_valid_tron(address: str) -> bool:
        address = address.strip()
        # Starts with 'T', 34 chars, base58
        if len(address) == 34 and address.startswith("T"):
            return all(c in BASE58_ALPHABET for c in address)
        return False

    @staticmethod
    def is_valid_solana(address: str) -> bool:
        address = address.strip()
        # Base58, 32 to 44 chars
        if 32 <= len(address) <= 44:
            return all(c in BASE58_ALPHABET for c in address)
        return False

    @classmethod
    def validate_for_network(cls, address: str, network: str) -> Tuple[bool, str]:
        net = network.upper()
        if net == "BITCOIN":
            valid = cls.is_valid_bitcoin(address)
            msg = "Valid Bitcoin (P2PKH, P2SH, or Bech32) address" if valid else "Invalid Bitcoin address format"
            return valid, msg
        elif net in ("ETHEREUM", "BSC", "POLYGON"):
            valid = cls.is_valid_evm(address)
            msg = f"Valid {net} (EVM standard 0x) address" if valid else f"Invalid {net} address (must be 0x followed by 40 hex characters)"
            return valid, msg
        elif net == "TRON":
            valid = cls.is_valid_tron(address)
            msg = "Valid Tron (Base58, 'T' prefix) address" if valid else "Invalid Tron address (must start with 'T' and be 34 characters)"
            return valid, msg
        elif net == "SOLANA":
            valid = cls.is_valid_solana(address)
            msg = "Valid Solana (Base58) public key" if valid else "Invalid Solana public key format (32-44 base58 characters)"
            return valid, msg
        else:
            return False, f"Unsupported network: {network}"

    @classmethod
    def detect_network(cls, address: str) -> List[str]:
        """Detect candidate networks for an address."""
        candidates = []
        if cls.is_valid_bitcoin(address):
            candidates.append("BITCOIN")
        if cls.is_valid_tron(address):
            candidates.append("TRON")
        if cls.is_valid_evm(address):
            candidates.extend(["ETHEREUM", "BSC", "POLYGON"])
        if cls.is_valid_solana(address):
            candidates.append("SOLANA")
        return candidates

    @staticmethod
    def get_explorer_url(network: str, item_type: str, item_value: str) -> str:
        """Returns verified public block explorer URLs for evidence gathering."""
        net = network.upper()
        if net == "BITCOIN":
            base = "https://mempool.space"
            return f"{base}/address/{item_value}" if item_type == "address" else f"{base}/tx/{item_value}"
        elif net == "ETHEREUM":
            base = "https://etherscan.io"
            return f"{base}/address/{item_value}" if item_type == "address" else f"{base}/tx/{item_value}"
        elif net == "TRON":
            base = "https://tronscan.org/#"
            return f"{base}/address/{item_value}" if item_type == "address" else f"{base}/transaction/{item_value}"
        elif net == "BSC":
            base = "https://bscscan.com"
            return f"{base}/address/{item_value}" if item_type == "address" else f"{base}/tx/{item_value}"
        elif net == "POLYGON":
            base = "https://polygonscan.com"
            return f"{base}/address/{item_value}" if item_type == "address" else f"{base}/tx/{item_value}"
        elif net == "SOLANA":
            base = "https://solscan.io"
            return f"{base}/account/{item_value}" if item_type == "address" else f"{base}/tx/{item_value}"
        return f"https://blockchair.com/search?q={item_value}"
