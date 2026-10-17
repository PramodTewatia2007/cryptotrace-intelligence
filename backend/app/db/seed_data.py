import datetime
import hashlib
import json
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import (
    User, Case, Wallet, Transaction, TraceJob, TracePath,
    VaspEntity, WalletAttribution, CrossChainHop, Alert, Evidence,
    InvestigationNote, InvestigationReport, AuditEvent, IntegrationConfig
)
from app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        db.close()
        return

    print("Seeding database with realistic law enforcement cybercrime intelligence data...")

    # 1. Create Users across all 6 roles
    users = [
        User(
            username="admin",
            email="admin@cybercrime.gov.in",
            full_name="Rajesh Kumar (Dir. Systems)",
            badge_number="LE-ADM-001",
            department="Cyber Security Operations Directorate",
            role="super_admin",
            hashed_password=get_password_hash("Admin@123456"),
            is_active=True
        ),
        User(
            username="officer_sharma",
            email="ashok.sharma@cybercrime.gov.in",
            full_name="Inspector Ashok Sharma",
            badge_number="LE-INV-4092",
            department="Crypto Fraud Investigation Cell",
            role="investigation_officer",
            hashed_password=get_password_hash("Officer@123456"),
            is_active=True
        ),
        User(
            username="senior_rao",
            email="priya.rao@cybercrime.gov.in",
            full_name="ACP Priya Rao",
            badge_number="LE-SNR-1084",
            department="Financial Crimes & Blockchain Forensics",
            role="senior_investigator",
            hashed_password=get_password_hash("Senior@123456"),
            is_active=True
        ),
        User(
            username="analyst_verma",
            email="neha.verma@cybercrime.gov.in",
            full_name="Neha Verma",
            badge_number="LE-ANA-2041",
            department="Threat Intelligence & On-Chain Analytics",
            role="intelligence_analyst",
            hashed_password=get_password_hash("Analyst@123456"),
            is_active=True
        ),
        User(
            username="auditor_patel",
            email="kiran.patel@gov.in",
            full_name="Kiran Patel",
            badge_number="LE-AUD-9912",
            department="Independent Vigilance & Judicial Audit Wing",
            role="auditor",
            hashed_password=get_password_hash("Auditor@123456"),
            is_active=True
        ),
        User(
            username="readonly_singh",
            email="vikram.singh@police.gov.in",
            full_name="Sub-Inspector Vikram Singh",
            badge_number="LE-OBS-5510",
            department="District Cyber Desk",
            role="read_only",
            hashed_password=get_password_hash("ReadOnly@123456"),
            is_active=True
        ),
    ]
    for u in users:
        db.add(u)
    db.commit()

    admin_user = db.query(User).filter(User.username == "admin").first()
    officer_user = db.query(User).filter(User.username == "officer_sharma").first()
    senior_user = db.query(User).filter(User.username == "senior_rao").first()

    # 2. Seed VASP Directory
    vasps = [
        VaspEntity(
            name="Binance",
            category="Centralized Exchange",
            jurisdiction="Global / Cayman Islands",
            compliance_contact_email="case-response@binance.com",
            law_enforcement_portal_url="https://www.binance.com/en/law-enforcement",
            verified_status="Verified"
        ),
        VaspEntity(
            name="OKX",
            category="Centralized Exchange",
            jurisdiction="Seychelles / Bahamas",
            compliance_contact_email="compliance@okx.com",
            law_enforcement_portal_url="https://www.okx.com/law-enforcement",
            verified_status="Verified"
        ),
        VaspEntity(
            name="Kraken",
            category="Centralized Exchange",
            jurisdiction="United States (Payward Inc.)",
            compliance_contact_email="compliance-le@kraken.com",
            law_enforcement_portal_url="https://www.kraken.com/legal/compliance",
            verified_status="Verified"
        ),
        VaspEntity(
            name="WazirX",
            category="Centralized Exchange",
            jurisdiction="India (Zanmai Labs / FIU-IND Registered)",
            compliance_contact_email="nodal@wazirx.com",
            law_enforcement_portal_url="https://wazirx.com/law-enforcement",
            verified_status="Verified"
        ),
        VaspEntity(
            name="CoinDCX",
            category="Centralized Exchange",
            jurisdiction="India (Neblio Technologies / FIU-IND Registered)",
            compliance_contact_email="legal@coindcx.com",
            law_enforcement_portal_url="https://coindcx.com/compliance",
            verified_status="Verified"
        ),
        VaspEntity(
            name="Bybit",
            category="Centralized Exchange",
            jurisdiction="Dubai, UAE",
            compliance_contact_email="lawenforcement@bybit.com",
            law_enforcement_portal_url="https://www.bybit.com/en/law-enforcement",
            verified_status="Verified"
        ),
        VaspEntity(
            name="Tornado Cash",
            category="Decentralized Mixer",
            jurisdiction="Decentralized / Smart Contract (OFAC Sanctioned)",
            compliance_contact_email="NONE (Autonomous Contract)",
            law_enforcement_portal_url=None,
            verified_status="Sanctioned"
        ),
        VaspEntity(
            name="Stargate Finance",
            category="Cross-Chain Bridge",
            jurisdiction="Decentralized / LayerZero Labs",
            compliance_contact_email="support@layerzero.network",
            law_enforcement_portal_url=None,
            verified_status="Bridge Protocol"
        ),
    ]
    for v in vasps:
        db.add(v)
    db.commit()

    binance_v = db.query(VaspEntity).filter(VaspEntity.name == "Binance").first()
    okx_v = db.query(VaspEntity).filter(VaspEntity.name == "OKX").first()
    kraken_v = db.query(VaspEntity).filter(VaspEntity.name == "Kraken").first()
    wazirx_v = db.query(VaspEntity).filter(VaspEntity.name == "WazirX").first()
    tornado_v = db.query(VaspEntity).filter(VaspEntity.name == "Tornado Cash").first()
    stargate_v = db.query(VaspEntity).filter(VaspEntity.name == "Stargate Finance").first()

    # 3. Seed Known Attributions
    attributions = [
        WalletAttribution(
            wallet_address="TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe",
            network="TRON",
            vasp_entity_id=binance_v.id,
            attribution_type="Verified Deposit Address",
            confidence_score=98.5,
            confidence_level="Verified",
            evidence_source="Binance Hot Wallet Sweep Cluster Analysis & Deposit Tag",
            supporting_tx_hashes=json.dumps(["0x81c2f948a123b5d7e901a23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e"]),
            verified_by_analyst="LE-ANA-2041",
            notes="Active TRC-20 deposit terminal. Swept to Binance Hot Wallet 1 within 4 hours.",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        ),
        WalletAttribution(
            wallet_address="0x28C6c06298d514Db089934071355E5743bf21d60",
            network="ETHEREUM",
            vasp_entity_id=binance_v.id,
            attribution_type="Binance: Hot Wallet 14",
            confidence_score=99.9,
            confidence_level="Verified",
            evidence_source="Public Exchange Proof-of-Reserves Disclosure",
            supporting_tx_hashes=json.dumps(["0x498a123b5d7e901a23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e81c2f"]),
            verified_by_analyst="LE-ANA-2041",
            notes="Official Binance Hot Wallet. Handles high volume ETH and ERC-20 consolidation.",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        ),
        WalletAttribution(
            wallet_address="0x28C6c06298d514Db089934071355E5743bf21d60",
            network="POLYGON",
            vasp_entity_id=okx_v.id,
            attribution_type="OKX: Polygon Deposit Gateway",
            confidence_score=95.0,
            confidence_level="Verified",
            evidence_source="OKX Official Gateway Contract Disclosures",
            supporting_tx_hashes=json.dumps(["0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000"]),
            verified_by_analyst="LE-ANA-2041",
            notes="EVM deposit gateway on Polygon POS.",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        ),
        WalletAttribution(
            wallet_address="3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
            network="BITCOIN",
            vasp_entity_id=kraken_v.id,
            attribution_type="Kraken Custodial Deposit Address",
            confidence_score=96.0,
            confidence_level="Verified",
            evidence_source="Kraken Multi-Sig P2SH Cluster Analysis",
            supporting_tx_hashes=json.dumps(["4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"]),
            verified_by_analyst="LE-ANA-2041",
            notes="Identified Kraken client deposit address.",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        ),
        WalletAttribution(
            wallet_address="0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
            network="ETHEREUM",
            vasp_entity_id=tornado_v.id,
            attribution_type="Tornado.Cash: 100 ETH Pool",
            confidence_score=100.0,
            confidence_level="Verified",
            evidence_source="OFAC SDN List Designation & Smart Contract ABI",
            supporting_tx_hashes=json.dumps(["0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"]),
            verified_by_analyst="LE-ANA-2041",
            notes="Sanctioned smart contract privacy pool.",
            last_verified_at=datetime.datetime.now(datetime.timezone.utc)
        ),
    ]
    for a in attributions:
        db.add(a)
    db.commit()

    # 4. Seed Seed-Cases and Realistic Fund Flows
    # Case 1: Pig-Butchering on TRON (USDT)
    c1 = Case(
        case_number="CT-2026-08492",
        title="Operation Golden Crescent: Pig-Butchering USDT Laundering",
        complaint_ref="NCRP-2026-MH-49219",
        category="Pig-Butchering / Romance Scam",
        priority="Critical",
        status="In Progress",
        victim_loss_amount=35000.0,
        victim_loss_currency="USDT",
        reported_tx_hash="0x4b7891c28f731a5e01b3d7904e21a5f69c7042a381274e1d90cba7216f498c12",
        reported_wallet_address="TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe",
        reported_network="TRON",
        description="Victim duped into fraudulent 'Staking VIP Club' telegram scheme. Sent 35,000 USDT in two tranches. Funds dispersed rapidly into split intermediaries.",
        created_by_user_id=officer_user.id,
        assigned_to_user_id=officer_user.id
    )
    db.add(c1)

    # Case 2: Ransomware on Bitcoin
    c2 = Case(
        case_number="CT-2026-07115",
        title="LockCrypt Ransomware: Healthcare Critical Infrastructure Extortion",
        complaint_ref="NCRP-2026-DL-11048",
        category="Ransomware Extortion",
        priority="High",
        status="Open",
        victim_loss_amount=125000.0,
        victim_loss_currency="USD",
        reported_tx_hash="7c90812e9b048d34b27f12a89045bcdefa78129034561289ab78cdef90123456",
        reported_wallet_address="bc1qa58d7z92m8n4x6k2p9q8v3w7y1a4b5c6d7e8f",
        reported_network="BITCOIN",
        description="Regional Hospital network locked. Management paid 2.15 BTC demand. Extortion address exhibiting classic peeling chain mechanics.",
        created_by_user_id=officer_user.id,
        assigned_to_user_id=senior_user.id
    )
    db.add(c2)

    # Case 3: High Yield Investment Ponzi on Ethereum with Cross-Chain Bridge
    c3 = Case(
        case_number="CT-2026-09201",
        title="QuantumYield DeFi Impersonation Scam",
        complaint_ref="NCRP-2026-KA-88231",
        category="Investment Scam",
        priority="Medium",
        status="Pending Review",
        victim_loss_amount=82000.0,
        victim_loss_currency="USD",
        reported_tx_hash="0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        reported_wallet_address="0x71C8364762A80869d6517a1a5b8109F200e4708A",
        reported_network="ETHEREUM",
        description="Fake trading platform promising 18% monthly yield. Funds bridged across Stargate router to Polygon to evade EVM trace.",
        created_by_user_id=officer_user.id,
        assigned_to_user_id=officer_user.id
    )
    db.add(c3)
    db.commit()

    # 5. Wallets and Transactions for Case 1 (TRON Pig-Butchering)
    w_root = Wallet(
        address="TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe",
        network="TRON",
        label="Suspect Deposit: Fake VIP Mining",
        entity_type="Suspect",
        risk_score=92.5,
        risk_level="Critical",
        risk_factors=json.dumps(["Reported Fraud Target", "Rapid Fund Dispersion", "Peeling Chain", "Downstream VASP Deposit"]),
        total_received=35000.0,
        total_sent=34990.0,
        current_balance=10.0,
        asset_symbol="USDT",
        tags=json.dumps(["Primary Beneficiary", "Scam Collector"]),
        is_demo=True
    )
    w_inter1 = Wallet(
        address="TL59xGptKm3Pn8vR2wZ7b4QyU1aC9dEfGh",
        network="TRON",
        label="Intermediary Layer 1 (Split)",
        entity_type="Intermediary",
        risk_score=78.0,
        risk_level="High",
        risk_factors=json.dumps(["Layering Node", "Rapid Dispersion"]),
        total_received=20000.0,
        total_sent=19995.0,
        current_balance=5.0,
        asset_symbol="USDT",
        tags=json.dumps(["Mule Account", "Splitter"]),
        is_demo=True
    )
    w_inter2 = Wallet(
        address="TQ72vMnbRt5Wp1xS8oA4c9LmP2bD3eFhJk",
        network="TRON",
        label="Intermediary Layer 2 (Layering)",
        entity_type="Intermediary",
        risk_score=75.0,
        risk_level="High",
        risk_factors=json.dumps(["Peeling Chain", "Layering Node"]),
        total_received=15000.0,
        total_sent=14995.0,
        current_balance=5.0,
        asset_symbol="USDT",
        tags=json.dumps(["Mule Account"]),
        is_demo=True
    )
    w_dest = Wallet(
        address="TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe",
        network="TRON",
        label="Binance CEX Deposit Gateway",
        entity_type="VASP_Deposit",
        risk_score=85.0,
        risk_level="Critical",
        risk_factors=json.dumps(["Downstream VASP Deposit Exit Point", "Direct Connection to Fraud Wallets"]),
        total_received=34950.0,
        total_sent=34900.0,
        current_balance=50.0,
        asset_symbol="USDT",
        tags=json.dumps(["Exchange Deposit", "Subpoena Target"]),
        is_demo=True
    )

    for w in (w_root, w_inter1, w_inter2, w_dest):
        db.add(w)
    db.commit()

    # Transactions for Case 1
    t1 = Transaction(
        tx_hash="0x4b7891c28f731a5e01b3d7904e21a5f69c7042a381274e1d90cba7216f498c12",
        network="TRON",
        from_address="TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe",
        to_address="TL59xGptKm3Pn8vR2wZ7b4QyU1aC9dEfGh",
        amount=20000.0,
        asset_symbol="USDT",
        fee=1.5,
        block_number=54910283,
        timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=28),
        is_token_transfer=True,
        token_contract="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tx_type="Split",
        is_demo=True
    )
    t2 = Transaction(
        tx_hash="0x5c8902d39a842b6f12c4e8015f32b6a70d8153b492385f2e01dcb8327a509d23",
        network="TRON",
        from_address="TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe",
        to_address="TQ72vMnbRt5Wp1xS8oA4c9LmP2bD3eFhJk",
        amount=14990.0,
        asset_symbol="USDT",
        fee=1.5,
        block_number=54910290,
        timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=27, minutes=50),
        is_token_transfer=True,
        token_contract="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tx_type="Split",
        is_demo=True
    )
    t3 = Transaction(
        tx_hash="0x6d9013e40b953c7a23d5f9126a43c7b81e9264c503496a3f12eda9438b610e34",
        network="TRON",
        from_address="TL59xGptKm3Pn8vR2wZ7b4QyU1aC9dEfGh",
        to_address="TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe",
        amount=19990.0,
        asset_symbol="USDT",
        fee=2.0,
        block_number=54910350,
        timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=26),
        is_token_transfer=True,
        token_contract="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tx_type="Exchange_Deposit",
        is_demo=True
    )
    t4 = Transaction(
        tx_hash="0x7ea124f51ca64d8b34e6a0237b54d8c92fa375d614507b4a23feb0549c721f45",
        network="TRON",
        from_address="TQ72vMnbRt5Wp1xS8oA4c9LmP2bD3eFhJk",
        to_address="TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe",
        amount=14980.0,
        asset_symbol="USDT",
        fee=2.0,
        block_number=54910365,
        timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=25, minutes=45),
        is_token_transfer=True,
        token_contract="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tx_type="Exchange_Deposit",
        is_demo=True
    )

    for t in (t1, t2, t3, t4):
        db.add(t)
    db.commit()

    # 6. Trace Job for Case 1
    job1 = TraceJob(
        job_number="TRC-2026-00109",
        case_id=c1.id,
        root_address=w_root.address,
        network="TRON",
        max_depth=3,
        status="COMPLETED",
        progress_percent=100,
        started_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24),
        completed_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=23, minutes=58),
        results_summary=json.dumps({
            "root_address": w_root.address,
            "network": "TRON",
            "max_hops_configured": 3,
            "nodes_count": 4,
            "edges_count": 4,
            "detected_vasps": ["Binance"],
            "suspicious_patterns": ["Fan-out Dispersion", "Rapid Layering", "CEX Consolidation"],
            "shortest_path_to_vasp": [w_root.address, w_inter1.address, w_dest.address]
        })
    )
    db.add(job1)
    db.commit()

    # Paths for job1
    paths = [
        TracePath(trace_job_id=job1.id, hop_level=1, from_address=w_root.address, to_address=w_inter1.address, tx_hash=t1.tx_hash, amount=20000.0, asset="USDT", transfer_type="Split", timestamp=t1.timestamp, pattern_flag="Rapid Dispersion"),
        TracePath(trace_job_id=job1.id, hop_level=1, from_address=w_root.address, to_address=w_inter2.address, tx_hash=t2.tx_hash, amount=14990.0, asset="USDT", transfer_type="Split", timestamp=t2.timestamp, pattern_flag="Rapid Dispersion"),
        TracePath(trace_job_id=job1.id, hop_level=2, from_address=w_inter1.address, to_address=w_dest.address, tx_hash=t3.tx_hash, amount=19990.0, asset="USDT", transfer_type="Exchange_Deposit", timestamp=t3.timestamp, pattern_flag="Binance Deposit"),
        TracePath(trace_job_id=job1.id, hop_level=2, from_address=w_inter2.address, to_address=w_dest.address, tx_hash=t4.tx_hash, amount=14980.0, asset="USDT", transfer_type="Exchange_Deposit", timestamp=t4.timestamp, pattern_flag="Binance Deposit")
    ]
    for p in paths:
        db.add(p)
    db.commit()

    # 7. Cross-Chain Hop (Case 3)
    cch = CrossChainHop(
        source_network="ETHEREUM",
        dest_network="POLYGON",
        source_tx_hash="0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        dest_tx_hash="0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffff0000",
        bridge_protocol="Stargate Finance",
        sender_address="0x71C8364762A80869d6517a1a5b8109F200e4708A",
        receiver_address="0x28C6c06298d514Db089934071355E5743bf21d60",
        amount_sent=42000.0,
        amount_received=41940.0,
        token_sent="USDC",
        token_received="USDC",
        status="Verified",
        timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
    )
    db.add(cch)

    # 8. Alerts
    a1 = Alert(
        case_id=c1.id,
        wallet_address="TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe",
        network="TRON",
        rule_code="VASP_DEPOSIT_DETECTED",
        rule_name="Downstream VASP Exchange Deposit Identified",
        severity="Critical",
        confidence=98.5,
        description="34,970 USDT from victim scam fund flows reached Binance deposit address TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe within 2 hops.",
        recommended_action="Draft immediate formal preservation letter to Binance Law Enforcement Portal (le-support@binance.com) referencing UID and deposit TX.",
        status="Under Investigation",
        detected_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=22)
    )
    a2 = Alert(
        case_id=c1.id,
        wallet_address="TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe",
        network="TRON",
        rule_code="RAPID_DISPERSION",
        rule_name="Rapid Fund Dispersion Post Receipt (< 30 min)",
        severity="High",
        confidence=94.0,
        description="Scam proceeds were split and forwarded to secondary addresses within 14 minutes of deposit confirmation.",
        recommended_action="Tag wallet cluster as automated money-mule distribution hub.",
        status="New",
        detected_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=23)
    )
    a3 = Alert(
        case_id=c3.id,
        wallet_address="0x71C8364762A80869d6517a1a5b8109F200e4708A",
        network="ETHEREUM",
        rule_code="CROSS_CHAIN_BRIDGE",
        rule_name="Cross-Chain Liquidity Bridge Evasion Detected",
        severity="High",
        confidence=91.0,
        description="Detected 42,000 USDC transfer via Stargate Finance contract moving assets from Ethereum mainnet to Polygon POS.",
        recommended_action="Correlate LayerZero relayer sequence number with Polygon receiver address.",
        status="New",
        detected_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    )
    db.add(a1)
    db.add(a2)
    db.add(a3)

    # 9. Evidence with real computed SHA-256 hashes
    evidence_text = "VICTIM_TRANSACTION_RECEIPT_NCRP_49219_USDT_35000_CONFIRMED"
    ev_hash = hashlib.sha256(evidence_text.encode('utf-8')).hexdigest()
    ev1 = Evidence(
        case_id=c1.id,
        file_name="Telegram_Chat_Victim_Export_01.pdf",
        file_type="application/pdf",
        file_size_bytes=418920,
        sha256_hash=ev_hash,
        source="Complainant Device Seizure / Voluntary Submission",
        collection_method="Cryptographic Hash Verification via MD5/SHA256",
        uploaded_by_user_id=officer_user.id,
        storage_path="/evidence/cases/CT-2026-08492/Telegram_Chat_Victim_Export_01.pdf",
        chain_of_custody_log=json.dumps([
            {"action": "COLLECTED", "officer": "Ashok Sharma", "time": "2026-10-16T14:30:00Z"},
            {"action": "HASH_VERIFIED", "hash": ev_hash, "time": "2026-10-16T14:32:00Z"}
        ]),
        uploaded_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=20)
    )
    db.add(ev1)

    # 10. Notes
    n1 = InvestigationNote(
        case_id=c1.id,
        author_id=officer_user.id,
        content="Primary trace completed. 34,970 USDT converged on Binance deposit address. Urgent legal notice to Binance nodal officer drafted.",
        is_lead=True,
        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=18)
    )
    db.add(n1)

    # 11. Initial Report for Case 1
    report_findings = {
        "case_metadata": {
            "case_number": c1.case_number,
            "title": c1.title,
            "complaint_ref": c1.complaint_ref,
            "category": c1.category,
            "priority": c1.priority,
            "status": c1.status,
            "reported_wallet": c1.reported_wallet_address,
            "reported_network": c1.reported_network,
            "victim_loss": "35,000.00 USDT",
            "assigned_officer": officer_user.full_name
        },
        "investigation_summary": "Digital cryptocurrency forensics conducted on wallet TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe. Funds reached Binance deposit terminal TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe.",
        "observed_paths": [
            {"hop": 1, "from": w_root.address, "to": w_inter1.address, "amount": 20000.0, "asset": "USDT", "flag": "Split"},
            {"hop": 1, "from": w_root.address, "to": w_inter2.address, "amount": 14990.0, "asset": "USDT", "flag": "Split"},
            {"hop": 2, "from": w_inter1.address, "to": w_dest.address, "amount": 19990.0, "asset": "USDT", "flag": "Binance Deposit"},
            {"hop": 2, "from": w_inter2.address, "to": w_dest.address, "amount": 14980.0, "asset": "USDT", "flag": "Binance Deposit"}
        ],
        "detected_alerts": [
            {"rule": a1.rule_name, "severity": a1.severity, "confidence": a1.confidence, "recommended_action": a1.recommended_action}
        ],
        "legal_disclaimer": "STATUTORY FORENSIC NOTICE: The associations and fund movements documented in this report are based on public and indexed blockchain ledgers and verified VASP telemetry.",
        "reporting_officer": officer_user.full_name
    }
    r_str = json.dumps(report_findings, sort_keys=True)
    r_seal = hashlib.sha256(r_str.encode('utf-8')).hexdigest()

    rep1 = InvestigationReport(
        report_number="RPT-20261016-0001",
        case_id=c1.id,
        generated_by_user_id=officer_user.id,
        title=f"Forensic Investigation Report: {c1.case_number}",
        summary=report_findings["investigation_summary"],
        findings_json=r_str,
        sha256_integrity_hash=r_seal,
        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=16)
    )
    db.add(rep1)

    # 12. Integration Configs
    integrations = [
        IntegrationConfig(name="NCRP", display_title="NCRP (National Cybercrime Reporting Portal - India)", is_enabled=True, is_mock=True, api_endpoint="https://cybercrime.gov.in/api/v2/complaints", status="Operational"),
        IntegrationConfig(name="SAHYOG", display_title="SAHYOG (Inter-Agency Coordination Portal - I4C)", is_enabled=True, is_mock=True, api_endpoint="https://sahyog.mha.gov.in/api/v1/leads", status="Operational"),
        IntegrationConfig(name="ETHERSCAN", display_title="Etherscan EVM Blockchain Indexer", is_enabled=True, is_mock=False, api_endpoint="https://api.etherscan.io/api", status="Operational"),
        IntegrationConfig(name="TRONSCAN", display_title="Tronscan Network Indexer API", is_enabled=True, is_mock=False, api_endpoint="https://apilist.tronscanapi.com/api", status="Operational"),
        IntegrationConfig(name="BLOCKSTREAM", display_title="Blockstream Bitcoin Explorer", is_enabled=True, is_mock=False, api_endpoint="https://blockstream.info/api", status="Operational"),
        IntegrationConfig(name="SOLSCAN", display_title="Solscan Solana Analytics API", is_enabled=True, is_mock=False, api_endpoint="https://public-api.solscan.io", status="Operational"),
    ]
    for ic in integrations:
        db.add(ic)

    # 13. Audit Events
    audit_logs = [
        AuditEvent(user_id=admin_user.id, username="admin", action="SYSTEM_INIT", resource_type="System", resource_id="CORE", ip_address="127.0.0.1", details="CryptoTrace Intelligence system initialized with secure parameters."),
        AuditEvent(user_id=officer_user.id, username="officer_sharma", action="LOGIN", resource_type="Session", resource_id=None, ip_address="192.168.1.104", details="Successful MFA authenticated login."),
        AuditEvent(user_id=officer_user.id, username="officer_sharma", action="CREATE_CASE", resource_type="Case", resource_id="CT-2026-08492", ip_address="192.168.1.104", details="Created case from NCRP-2026-MH-49219."),
        AuditEvent(user_id=officer_user.id, username="officer_sharma", action="RUN_TRACE", resource_type="Trace", resource_id="TRC-2026-00109", ip_address="192.168.1.104", details="Executed 3-hop trace on TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe (TRON)."),
        AuditEvent(user_id=officer_user.id, username="officer_sharma", action="EXPORT_REPORT", resource_type="Report", resource_id="RPT-20261016-0001", ip_address="192.168.1.104", details="Generated cryptographic forensic report.")
    ]
    for al in audit_logs:
        db.add(al)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
