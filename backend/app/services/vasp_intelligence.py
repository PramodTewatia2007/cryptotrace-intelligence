from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from app.db.models import VaspEntity, WalletAttribution

class VaspIntelligenceService:
    """Manages verified Exchange and VASP attribution data with evidence provenance."""

    @staticmethod
    def get_known_vasp_directory(db: Session) -> List[Dict[str, Any]]:
        vasps = db.query(VaspEntity).all()
        result = []
        for v in vasps:
            result.append({
                "id": v.id,
                "name": v.name,
                "category": v.category,
                "jurisdiction": v.jurisdiction,
                "compliance_contact_email": v.compliance_contact_email,
                "law_enforcement_portal_url": v.law_enforcement_portal_url,
                "verified_status": v.verified_status,
                "attribution_count": len(v.attributions)
            })
        return result

    @staticmethod
    def identify_address(db: Session, address: str, network: str) -> Optional[Dict[str, Any]]:
        """Look up known attribution for a specific wallet address and network."""
        norm_address = address.strip()
        attribution = db.query(WalletAttribution).filter(
            WalletAttribution.wallet_address.ilike(norm_address),
            WalletAttribution.network == network.upper()
        ).first()

        if not attribution:
            return None

        vasp = attribution.vasp_entity
        return {
            "id": attribution.id,
            "wallet_address": attribution.wallet_address,
            "network": attribution.network,
            "vasp_id": vasp.id,
            "vasp_name": vasp.name,
            "vasp_category": vasp.category,
            "jurisdiction": vasp.jurisdiction,
            "compliance_email": vasp.compliance_contact_email,
            "le_portal": vasp.law_enforcement_portal_url,
            "attribution_type": attribution.attribution_type, # e.g. Deposit Address, Hot Wallet
            "confidence_score": attribution.confidence_score,
            "confidence_level": attribution.confidence_level, # Verified, Probable, Inferred, Disputed
            "evidence_source": attribution.evidence_source,
            "supporting_tx_hashes": attribution.supporting_tx_hashes,
            "verified_by_analyst": attribution.verified_by_analyst,
            "notes": attribution.notes,
            "last_verified_at": attribution.last_verified_at.isoformat() if attribution.last_verified_at else None,
            "recommended_legal_step": VaspIntelligenceService.get_legal_guidance(vasp.name, vasp.jurisdiction)
        }

    @staticmethod
    def get_legal_guidance(vasp_name: str, jurisdiction: str) -> str:
        if "India" in jurisdiction or vasp_name in ("WazirX", "CoinDCX", "ZebPay"):
            return "Entity is FIU-IND registered. Serve formal requisition under Section 91 Cr.P.C. / Section 94 BNSS to the Compliance Officer with Case FIR/Complaint Number."
        elif vasp_name in ("Binance", "OKX", "Bybit"):
            return "Centralized international VASP. Submit preservation and disclosure request via official Law Enforcement Online Request Portal with court order or MLAT notice."
        elif "Tornado" in vasp_name or "Mixer" in vasp_name:
            return "Decentralized / Smart Contract mixer protocol. No custodial operator or KYC records available. Tracing must proceed through relayer or unmixed exit outputs."
        elif "Bridge" in vasp_name:
            return "Cross-chain liquidity bridge. Inspect source and destination contracts for bridge relayer transactions and corresponding deposit IDs."
        return "Submit formal inquiry to compliance liaison with verified case reference and transaction hashes."
