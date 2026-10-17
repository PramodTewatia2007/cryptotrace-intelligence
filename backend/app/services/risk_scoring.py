from typing import Dict, List, Any
import json

class RiskScoringEngine:
    """Calculates explainable risk scores and investigative indicators for wallets."""

    @staticmethod
    def calculate_wallet_risk(
        wallet_address: str,
        network: str,
        entity_type: str,
        tags: List[str],
        has_mixer_interaction: bool = False,
        has_rapid_dispersion: bool = False,
        has_peeling_chain: bool = False,
        has_bridge_hop: bool = False,
        is_direct_scam_recipient: bool = False,
        is_exchange_deposit: bool = False,
        total_volume: float = 0.0
    ) -> Dict[str, Any]:
        score = 0.0
        factors = []

        if is_direct_scam_recipient:
            points = 35.0
            score += points
            factors.append({
                "factor": "Reported Fraud Target / Beneficiary",
                "points": points,
                "severity": "CRITICAL",
                "evidence": f"Address was directly reported in victim cybercrime complaint as primary beneficiary on {network}."
            })

        if has_mixer_interaction:
            points = 45.0
            score += points
            factors.append({
                "factor": "Direct Mixer / Obfuscation Protocol Interaction",
                "points": points,
                "severity": "CRITICAL",
                "evidence": "Observed direct deposit or withdrawal interaction with privacy-enhancing mixer (e.g. Tornado Cash)."
            })

        if has_peeling_chain:
            points = 25.0
            score += points
            factors.append({
                "factor": "Peeling Chain / Layering Movement",
                "points": points,
                "severity": "HIGH",
                "evidence": "Repeated pattern of asymmetric value splits where smaller amounts peel off while remainder continues to successive hops."
            })

        if has_rapid_dispersion:
            points = 20.0
            score += points
            factors.append({
                "factor": "Rapid Fund Dispersion (<30 min post-receipt)",
                "points": points,
                "severity": "HIGH",
                "evidence": "Funds were swiftly transferred out within minutes of receipt, typical of automated drainer or money-mule operations."
            })

        if has_bridge_hop:
            points = 15.0
            score += points
            factors.append({
                "factor": "Cross-Chain Protocol Transition",
                "points": points,
                "severity": "MEDIUM",
                "evidence": f"Transferred funds through cross-chain bridge contracts to obscure on-chain lineage across networks."
            })

        if is_exchange_deposit:
            points = 10.0
            score += points
            factors.append({
                "factor": "Downstream VASP / CEX Deposit Exit Point",
                "points": points,
                "severity": "MEDIUM",
                "evidence": "Fund path terminates at an attributed exchange deposit address, presenting an immediate subpoena/freeze opportunity."
            })

        if total_volume > 100000:
            points = 10.0
            score += points
            factors.append({
                "factor": "Substantial Transaction Volume (> $100K)",
                "points": points,
                "severity": "LOW",
                "evidence": f"High aggregate value moving through wallet indicates organized laundering network."
            })

        # Cap score at 100
        final_score = min(100.0, score)

        if final_score >= 75:
            level = "Critical"
        elif final_score >= 50:
            level = "High"
        elif final_score >= 25:
            level = "Medium"
        else:
            level = "Low"

        explanation = (
            f"Wallet evaluated at {final_score:.1f}/100 ({level} Risk) based on {len(factors)} active behavioral rules. "
            + ("Immediate VASP preservation recommended." if is_exchange_deposit else "Continued downstream tracing required.")
        )

        return {
            "score": round(final_score, 1),
            "level": level,
            "factors": factors,
            "explanation": explanation
        }
