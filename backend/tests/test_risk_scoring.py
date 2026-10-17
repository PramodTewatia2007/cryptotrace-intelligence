import pytest
from app.services.risk_scoring import RiskScoringEngine

def test_risk_scoring_critical_mixer():
    res = RiskScoringEngine.calculate_wallet_risk(
        wallet_address="0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
        network="ETHEREUM",
        entity_type="Mixer",
        tags=["Sanctioned"],
        has_mixer_interaction=True,
        has_peeling_chain=True,
        is_direct_scam_recipient=True
    )
    assert res["score"] >= 75.0
    assert res["level"] == "Critical"
    assert len(res["factors"]) >= 3
    assert "Direct Mixer" in res["factors"][1]["factor"]

def test_risk_scoring_clean_wallet():
    res = RiskScoringEngine.calculate_wallet_risk(
        wallet_address="0x71C8364762A80869d6517a1a5b8109F200e4708A",
        network="ETHEREUM",
        entity_type="Unknown",
        tags=[],
        has_mixer_interaction=False,
        has_rapid_dispersion=False,
        has_peeling_chain=False,
        is_direct_scam_recipient=False
    )
    assert res["score"] == 0.0
    assert res["level"] == "Low"
    assert len(res["factors"]) == 0
