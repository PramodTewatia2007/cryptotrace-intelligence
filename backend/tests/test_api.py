import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    res_info = client.get("/api/info")
    assert res_info.status_code == 200
    data = res_info.json()
    assert data["status"] == "OPERATIONAL"
    assert "BITCOIN" in data["supported_blockchains"]

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"

    res_root = client.get("/")
    assert res_root.status_code == 200

def test_auth_login():
    res = client.post("/api/v1/auth/login", json={
        "username": "officer_sharma",
        "password": "Officer@123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "investigation_officer"

def test_dashboard_stats():
    res = client.get("/api/v1/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert data["stats"]["total_cases"] >= 1

def test_cases_list():
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_wallet_validation_api():
    res = client.post("/api/v1/wallets/validate", json={
        "address": "TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert "TRON" in data["detected_networks"]

def test_traces_and_fund_flow_graph():
    # Fetch case 1 trace graph
    res = client.get("/api/v1/traces/by-case/1")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 2
    assert "shortest_path_to_vasp" in data["summary"]

def test_vasp_directory():
    res = client.get("/api/v1/vasp/entities")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    names = [v["name"] for v in data]
    assert "Binance" in names
    assert "WazirX" in names

def test_ncrp_sync_connector():
    res = client.post("/api/v1/integrations/ncrp/sync", json={
        "acknowledgement_number": "NCRP-2026-MH-49219"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["mode"] == "CERTIFIED_MOCK_CONNECTOR"
