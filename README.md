# CryptoTrace Intelligence
### Real-Time Cryptocurrency Fraud Attribution & Investigation System for Law Enforcement Agencies

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/PramodTewatia2007/cryptotrace-intelligence)

CryptoTrace Intelligence is an end-to-end, production-oriented digital forensics and cybercrime investigation platform designed specifically for authorized law enforcement units, cybercrime police stations, intelligence analysts, and judicial vigilance auditors.

The system empowers investigators to analyze suspicious cryptocurrency wallet addresses reported in cybercrime complaints, trace multi-hop fund movements across blockchains, identify downstream Virtual Asset Service Providers (VASPs) / Exchanges, detect complex money-laundering typologies (peeling chains, rapid dispersion, mixers, bridge evasion), secure digital evidence with SHA-256 chain-of-custody seals, and generate court-admissible forensic investigation reports.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   INVESTIGATION CONSOLE (REACT 18 + TS)                 │
│  - Cyber-Forensics Dark Theme (Navy/Charcoal with Cyan & Amber accents)│
│  - 15 Comprehensive Investigative Modules                              │
│  - Interactive Fund-Flow Graph (Hierarchical, Zoom/Pan, Path Highlighting)│
│  - Instant Investigator Persona & Role Switcher                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API + WebSockets / CORS
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI INTELLIGENCE ENGINE                         │
│  - Multi-Chain Validator (BTC Bech32/Legacy, EVM, TRON, SOL Base58)   │
│  - Multi-Hop Tracing Engine & Flow Clustering (Peeling Chains, Mules) │
│  - VASP Intelligence Directory & Legal Guidance (Sec 91 CrPC / MLAT)  │
│  - Explainable Heuristics Risk Scoring Engine (0-100 Score Breakdown) │
│  - Cross-Chain Bridge Event Correlator (Stargate, Wormhole, Hop)      │
│  - Tamper-Evident SHA-256 Evidence Vault & Report Generator           │
│  - Certified Law Enforcement Portals Connectors (NCRP & SAHYOG)       │
│  - Immutable Judicial Audit Logging Engine                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       PERSISTENCE & STORAGE                            │
│  - SQLite 3 (Default Local Compliance) / PostgreSQL Production Ready  │
│  - Encrypted Object Store / Local Evidence Vault                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Modules & 15 Dedicated Views

1. **Overview Dashboard**: High-level telemetry displaying open/closed cases, total loss tracked ($USD), high-risk wallets, active alerts, network breakdown, and integration health.
2. **New Investigation**: Guided intake workflow with NCRP complaint synchronization, address validation with instant regex/checksum feedback, typology selection (Pig-Butchering, Ransomware, Phishing, Investment Scam), and automatic 3-hop trace execution.
3. **Wallet Intelligence**: Comprehensive address dossiers with real-time risk scores, behavioral factors explanation, transaction counts, balances, VASP associations, and public explorer links.
4. **Transaction Explorer**: Detailed transaction search with network filters, asset types, gas/fee metrics, input/output inspection, and explorer deep-links.
5. **Fund-Flow Graph**: Interactive SVG/Canvas visualization featuring:
   - Root suspect nodes with glow halos
   - Split & intermediary mule nodes
   - Verified VASP exchange deposit terminals
   - Zoom (+/-), Pan, Node Dossier Inspector
   - One-click **"Shortest Path to VASP"** highlight
   - Filter by minimum transfer value
   - Graph snapshot export in JSON
6. **Cross-Chain Tracing**: Protocol bridge analysis (Stargate, Wormhole, Across) correlating source chain deposits with destination chain withdrawals across disparate networks.
7. **Exchange & VASP Intelligence**: Verified directory of major exchanges (Binance, OKX, Kraken, WazirX, CoinDCX, Bybit), compliance officer contacts, law enforcement submission portals, and specific legal guidance (e.g. Section 91 Cr.P.C. / MLAT notices).
8. **Risk & Alerts**: Configurable heuristics engine detecting rapid fund dispersion (< 30 min), peeling chains, high-frequency splitting, and mixer interactions with triage buttons.
9. **Case Management**: Full case lifecycle management (Open, In Progress, Pending Review, Escalated, Closed) with investigator assignments and notes.
10. **Evidence Vault**: Digital evidence repository storing files with SHA-256 cryptographic hashes and chain-of-custody logs.
11. **Investigation Reports**: Automated generation of formal forensic investigation dossiers with cryptographic SHA-256 integrity seals, statutory legal notices, and CSV ledger export.
12. **Data Sources & Integrations**: Integration connectors for NCRP (National Cybercrime Reporting Portal - India) and SAHYOG (I4C Portal) with certified mock toggle and live RPC configs.
13. **User & Role Management**: Six-tier Role-Based Access Control (RBAC).
14. **Audit Logs**: Immutable log recording user actions, timestamps, IP addresses, and affected resources.
15. **System Settings**: Demo mode toggle, API key configurations (Etherscan, Tronscan, Blockstream, Solscan), and database parameters.

---

## 3. Supported Blockchain Networks

| Network | Address Formats Verified | Explorer Link Integration |
|---|---|---|
| **TRON** | Base58Check (`T...`, 34 chars) | Tronscan |
| **ETHEREUM** | EVM Hex (`0x...`, 40 hex chars) | Etherscan |
| **BITCOIN** | Legacy P2PKH (`1...`), P2SH (`3...`), Bech32 (`bc1q...`, `bc1p...`) | Mempool.space / Blockstream |
| **SOLANA** | Base58 Public Key (32–44 chars) | Solscan |
| **BNB SMART CHAIN** | EVM Standard (`0x...`) | BscScan |
| **POLYGON POS** | EVM Standard (`0x...`) | PolygonScan |

---

## 4. Role-Based Access Control (RBAC) Matrix

| Role Tier | Persona Example | Capabilities |
|---|---|---|
| **Super Administrator** | `admin` | Full system control, role assignment, integration credentials, audit logs |
| **Investigation Officer** | `officer_sharma` | Case creation, wallet lookups, trace execution, evidence uploads, reports |
| **Senior Investigator** | `senior_rao` | Case review and escalation, SAHYOG coordination, report approvals |
| **Intelligence Analyst** | `analyst_verma` | Deep graph analysis, VASP attribution tagging, risk rule validation |
| **Auditor** | `auditor_patel` | Independent access to immutable audit trails, evidence verification |
| **Read-Only Officer** | `readonly_singh` | Inspection of assigned cases, graphs, and completed reports without edit rights |

*Note: For testing and demonstration, switch personas dynamically using the active investigator selector in the bottom left sidebar.*

---

## 5. Quick Start Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.15)
- Node.js 18+ (Tested on Node.js v24.20)
- npm or yarn

### Option A: Running from Local Environment

#### 1. Start the Backend API
```powershell
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1
# Set python path
$env:PYTHONPATH = (Get-Location).Path
# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The database automatically seeds realistic multi-chain fraud scenarios on first boot.*

#### 2. Start the Frontend Development Console
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

*(Alternatively, the compiled frontend is also served directly by FastAPI at **`http://localhost:8000`**!)*

---

### Option B: Running with Docker Compose

```bash
docker compose up --build
```
Open **`http://localhost:8000`** in your browser.

---

### Option C: Deploying to Render (Cloud Production)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/PramodTewatia2007/cryptotrace-intelligence)

#### Method 1: Automatic Blueprint (Recommended)
1. Fork or push this repository to your GitHub account.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Connect this repository: `https://github.com/PramodTewatia2007/cryptotrace-intelligence`.
5. Render reads `render.yaml` automatically, builds the multi-stage Docker container (React frontend + FastAPI backend), configures health checks (`/health`), and deploys your live service.

#### Method 2: Manual Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository: `cryptotrace-intelligence`.
3. Choose **Docker** as the runtime.
4. Settings:
   - **Environment**: Docker
   - **Branch**: `main`
   - **Health Check Path**: `/health`
   - **Plan**: Free
5. Environment Variables:
   - `DEMO_MODE`: `true`
   - `PYTHONUNBUFFERED`: `1`
   - `PORT`: (Render sets this dynamically, and the Dockerfile binds automatically)
6. Click **Create Web Service**. Your service will be online at `https://<your-service-name>.onrender.com`!

---

## 6. Automated Testing Suite

Run the complete backend test suite:
```powershell
cd backend
.\venv\Scripts\pytest.exe tests -v
```
All 15 automated test suites verify address validation, risk scoring algorithms, VASP identification, multi-hop graph generation, NCRP mock synchronization, and authenticated API endpoints.

---

## 7. Interactive Demo Scenarios

The system includes pre-seeded, realistic cybercrime investigation scenarios accessible via the top **"Quick Scenarios"** toolbar:

1. **Pig-Butchering Scam on TRON (USDT)**:
   - Reported Wallet: `TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe`
   - Flow: 35,000 USDT stolen -> Split into 2 intermediary mule wallets within 14 minutes -> Peeling chain consolidation into Binance Deposit Address `TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe`.
   - Triggers: Critical VASP deposit alert, rapid dispersion alert, and legal notice generation to Binance compliance.

2. **LockCrypt Ransomware on Bitcoin**:
   - Reported Wallet: `bc1qa58d7z92m8n4x6k2p9q8v3w7y1a4b5c6d7e8f`
   - Flow: 2.15 BTC extortion payout -> Peeling chain -> Split to mixer output and Kraken deposit gateway `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy`.

3. **QuantumYield Cross-Chain DeFi Scam**:
   - Reported Wallet: `0x71C8364762A80869d6517a1a5b8109F200e4708A` (Ethereum)
   - Flow: $82,000 USDC -> Bridged via Stargate Finance router to Polygon POS -> Deposited into OKX Gateway `0x28C6c06298d514Db089934071355E5743bf21d60`.

---

## 8. Forensic Disclaimers & Statutory Compliance

- **Statutory Notice**: Observed fund movements and VASP associations identify cryptographic transaction paths and investigative leads. Conclusive attribution to a natural person requires formal legal requisitions (Section 91 Cr.P.C. / Section 94 BNSS or MLAT) served upon the custodial VASP.
- **Evidence Integrity**: All evidence items and compiled reports are cryptographically sealed with SHA-256 hashes to ensure compliance with digital evidence preservation standards.
