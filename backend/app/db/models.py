import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    badge_number = Column(String(64), nullable=True)
    department = Column(String(128), default="Cyber Crime Investigation Unit")
    role = Column(String(32), default="investigation_officer", nullable=False)
    # Roles: super_admin, investigation_officer, senior_investigator, intelligence_analyst, auditor, read_only
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    cases_created = relationship("Case", foreign_keys="Case.created_by_user_id", back_populates="creator")
    cases_assigned = relationship("Case", foreign_keys="Case.assigned_to_user_id", back_populates="assignee")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(64), unique=True, index=True, nullable=False) # e.g. CT-2026-08492
    title = Column(String(255), nullable=False)
    complaint_ref = Column(String(128), index=True, nullable=True) # e.g. NCRP-2026-IN-49219
    category = Column(String(64), nullable=False) # Investment Scam, Pig Butchering, Phishing, Ransomware, etc.
    priority = Column(String(32), default="Medium") # Low, Medium, High, Critical
    status = Column(String(32), default="Open") # Open, In Progress, Pending Review, Escalated, Closed
    victim_loss_amount = Column(Float, default=0.0)
    victim_loss_currency = Column(String(16), default="USD")
    reported_tx_hash = Column(String(128), nullable=True)
    reported_wallet_address = Column(String(128), index=True, nullable=False)
    reported_network = Column(String(32), default="ETHEREUM") # BITCOIN, ETHEREUM, TRON, BSC, POLYGON, SOLANA
    description = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    creator = relationship("User", foreign_keys=[created_by_user_id], back_populates="cases_created")
    assignee = relationship("User", foreign_keys=[assigned_to_user_id], back_populates="cases_assigned")
    traces = relationship("TraceJob", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("InvestigationNote", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("InvestigationReport", back_populates="case", cascade="all, delete-orphan")

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String(128), index=True, nullable=False)
    network = Column(String(32), index=True, nullable=False) # BITCOIN, ETHEREUM, TRON, BSC, POLYGON, SOLANA
    label = Column(String(128), nullable=True)
    entity_type = Column(String(64), default="Unknown") # Unknown, Suspect, Intermediary, VASP_Deposit, Mixer, Bridge, Contract
    risk_score = Column(Float, default=0.0) # 0.0 - 100.0
    risk_level = Column(String(16), default="Low") # Low, Medium, High, Critical
    risk_factors = Column(Text, nullable=True) # JSON array of explaining factors
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    total_received = Column(Float, default=0.0)
    total_sent = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    asset_symbol = Column(String(16), default="ETH")
    tags = Column(Text, nullable=True) # JSON list e.g. ["Scam Victim Drainer", "Layering Intermediary"]
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_wallet_address_network", "address", "network", unique=True),
    )

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(128), index=True, nullable=False)
    network = Column(String(32), index=True, nullable=False)
    from_address = Column(String(128), index=True, nullable=False)
    to_address = Column(String(128), index=True, nullable=False)
    amount = Column(Float, default=0.0)
    asset_symbol = Column(String(16), default="ETH")
    fee = Column(Float, default=0.0)
    block_number = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=utc_now)
    is_token_transfer = Column(Boolean, default=False)
    token_contract = Column(String(128), nullable=True)
    tx_type = Column(String(32), default="Direct") # Direct, Split, Consolidation, Bridge_Deposit, Mixer_Deposit, Exchange_Deposit
    is_demo = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_tx_hash_network", "tx_hash", "network"),
    )

class TraceJob(Base):
    __tablename__ = "trace_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String(64), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    root_address = Column(String(128), nullable=False)
    network = Column(String(32), nullable=False)
    max_depth = Column(Integer, default=3)
    status = Column(String(32), default="QUEUED") # QUEUED, RUNNING, COMPLETED, FAILED
    progress_percent = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    results_summary = Column(Text, nullable=True) # JSON summary (nodes count, edges, detected VASPs, risk)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="traces")
    paths = relationship("TracePath", back_populates="trace_job", cascade="all, delete-orphan")

class TracePath(Base):
    __tablename__ = "trace_paths"

    id = Column(Integer, primary_key=True, index=True)
    trace_job_id = Column(Integer, ForeignKey("trace_jobs.id"), nullable=False)
    hop_level = Column(Integer, default=1)
    from_address = Column(String(128), nullable=False)
    to_address = Column(String(128), nullable=False)
    tx_hash = Column(String(128), nullable=False)
    amount = Column(Float, default=0.0)
    asset = Column(String(16), default="ETH")
    transfer_type = Column(String(32), default="Direct")
    timestamp = Column(DateTime, default=utc_now)
    pattern_flag = Column(String(64), nullable=True) # "Peeling Chain", "Rapid Dispersion", "VASP Deposit"

    trace_job = relationship("TraceJob", back_populates="paths")

class VaspEntity(Base):
    __tablename__ = "vasp_entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, index=True, nullable=False) # e.g. Binance, OKX, Kraken, WazirX, CoinDCX
    category = Column(String(64), default="Centralized Exchange") # Centralized Exchange, P2P Broker, Payment Processor, Custodian
    jurisdiction = Column(String(64), default="Global")
    compliance_contact_email = Column(String(128), nullable=True)
    law_enforcement_portal_url = Column(String(255), nullable=True)
    verified_status = Column(String(32), default="Verified") # Verified, Partner, Known
    created_at = Column(DateTime, default=utc_now)

    attributions = relationship("WalletAttribution", back_populates="vasp_entity")

class WalletAttribution(Base):
    __tablename__ = "wallet_attributions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(128), index=True, nullable=False)
    network = Column(String(32), index=True, nullable=False)
    vasp_entity_id = Column(Integer, ForeignKey("vasp_entities.id"), nullable=False)
    attribution_type = Column(String(64), default="Deposit Address") # Deposit Address, Hot Wallet, Cold Storage, Staking Pool
    confidence_score = Column(Float, default=95.0) # 0 - 100
    confidence_level = Column(String(32), default="Verified") # Verified, Probable, Inferred, Disputed, Unknown
    evidence_source = Column(String(255), nullable=False) # e.g. "Public Exchange Disclosure", "Verified Deposit Cluster", "Law Enforcement Subpoena Return"
    supporting_tx_hashes = Column(Text, nullable=True) # JSON list
    verified_by_analyst = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    last_verified_at = Column(DateTime, default=utc_now)

    vasp_entity = relationship("VaspEntity", back_populates="attributions")

class CrossChainHop(Base):
    __tablename__ = "cross_chain_hops"

    id = Column(Integer, primary_key=True, index=True)
    source_network = Column(String(32), nullable=False)
    dest_network = Column(String(32), nullable=False)
    source_tx_hash = Column(String(128), index=True, nullable=False)
    dest_tx_hash = Column(String(128), index=True, nullable=True)
    bridge_protocol = Column(String(64), nullable=False) # Stargate, Wormhole, Hop, Synapse, Thorchain
    sender_address = Column(String(128), nullable=False)
    receiver_address = Column(String(128), nullable=False)
    amount_sent = Column(Float, default=0.0)
    amount_received = Column(Float, default=0.0)
    token_sent = Column(String(16), default="USDT")
    token_received = Column(String(16), default="USDT")
    status = Column(String(32), default="Verified") # Verified, Inferred, Pending
    timestamp = Column(DateTime, default=utc_now)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    wallet_address = Column(String(128), index=True, nullable=False)
    network = Column(String(32), nullable=False)
    rule_code = Column(String(64), nullable=False) # RAPID_DISPERSION, PEELING_CHAIN, MIXER_INTERACTION, VASP_DEPOSIT_DETECTED, HIGH_VALUE_CONSOLIDATION, CROSS_CHAIN_BRIDGE
    rule_name = Column(String(128), nullable=False)
    severity = Column(String(16), default="High") # Low, Medium, High, Critical
    confidence = Column(Float, default=85.0)
    description = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    status = Column(String(32), default="New") # New, Under Investigation, Dismissed, Escalated
    detected_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="alerts")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False) # Tamper-evident hash
    source = Column(String(128), nullable=False) # Victim Upload, Police Seizure, On-Chain Capture, Exchange MLAT Return
    collection_method = Column(String(128), default="Cryptographic Capture")
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    storage_path = Column(String(512), nullable=True)
    chain_of_custody_log = Column(Text, nullable=True) # JSON list of custody transfer records
    uploaded_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="evidence_items")
    uploader = relationship("User")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_lead = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="notes")
    author = relationship("User")

class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(64), unique=True, index=True, nullable=False) # e.g. RPT-2026-9481
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    findings_json = Column(Text, nullable=False) # Full structured data dump
    sha256_integrity_hash = Column(String(64), nullable=False) # Cryptographic signature of report content
    created_at = Column(DateTime, default=utc_now)

    case = relationship("Case", back_populates="reports")
    author = relationship("User")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False) # LOGIN, SEARCH_WALLET, RUN_TRACE, CREATE_CASE, EXPORT_REPORT, UPLOAD_EVIDENCE, UPDATE_ROLE
    resource_type = Column(String(64), nullable=False) # Wallet, Case, Trace, Evidence, Report, User
    resource_id = Column(String(128), nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    user_agent = Column(String(255), default="System")
    details = Column(Text, nullable=True) # JSON or descriptive string
    timestamp = Column(DateTime, default=utc_now)

class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True, nullable=False) # NCRP, SAHYOG, ETHERSCAN, TRONSCAN, BLOCKSTREAM, SOLSCAN
    display_title = Column(String(128), nullable=False)
    is_enabled = Column(Boolean, default=True)
    is_mock = Column(Boolean, default=True)
    api_endpoint = Column(String(255), nullable=True)
    status = Column(String(32), default="Operational") # Operational, Degraded, Inactive
    last_ping_at = Column(DateTime, default=utc_now)
    config_data = Column(Text, nullable=True) # JSON config
