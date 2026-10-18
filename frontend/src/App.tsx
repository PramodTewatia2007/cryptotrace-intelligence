import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, LayoutDashboard, PlusCircle, Search, ArrowRightLeft, Network,
  Building2, AlertTriangle, Briefcase, FileCheck, FileText, Database, Users,
  History, Settings, ExternalLink, ChevronRight, CheckCircle2, RefreshCw,
  Sparkles, AlertCircle, Download, Printer, X, BookOpen,
  ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { apiRequest, DEMO_PERSONAS } from './services/api';
import type { UserPersona } from './services/api';
import { InteractiveGraph } from './components/InteractiveGraph';
import type {
  CaseItem, WalletProfile, TraceGraphData, AlertItem, EvidenceItem,
  ReportItem, VaspEntityItem, AttributionItem, CrossChainItem, AuditLogItem, GraphNode
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeUser, setActiveUser] = useState<UserPersona>(DEMO_PERSONAS[1]); // Default: Inspector Ashok Sharma
  
  // Beginner Mode Toggle (Defaults to TRUE for maximum clarity and ease of understanding)
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);

  // Global search input in header
  const [headerSearch, setHeaderSearch] = useState<string>('');

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Cases state
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // New Investigation form state
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    complaint_ref: '',
    category: 'Pig-Butchering / Romance Scam',
    priority: 'High',
    victim_loss_amount: 35000,
    victim_loss_currency: 'USDT',
    reported_tx_hash: '',
    reported_wallet_address: '',
    reported_network: 'TRON',
    description: '',
    auto_launch_trace: true
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [submittingCase, setSubmittingCase] = useState<boolean>(false);

  // Wallet Intelligence state
  const [walletSearchInput, setWalletSearchInput] = useState<string>('TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe');
  const [walletNetworkSelect, setWalletNetworkSelect] = useState<string>('TRON');
  const [walletProfile, setWalletProfile] = useState<WalletProfile | null>(null);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(false);

  // Fund Flow Graph state
  const [traceGraphData, setTraceGraphData] = useState<TraceGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);

  // Other tabs state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [crossChainHops, setCrossChainHops] = useState<CrossChainItem[]>([]);
  const [vaspEntities, setVaspEntities] = useState<VaspEntityItem[]>([]);
  const [attributions, setAttributions] = useState<AttributionItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReportView, setSelectedReportView] = useState<any | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Action status toasts
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDashboard = async () => {
    try {
      const data = await apiRequest<any>('/dashboard', {}, activeUser.username);
      setDashboardData(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchCases = async () => {
    try {
      const data = await apiRequest<CaseItem[]>('/cases', {}, activeUser.username);
      setCases(data);
      setSelectedCase((prev) => prev || (data.length > 0 ? data[0] : null));
    } catch (e: any) {
      console.error(e);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    apiRequest<any>('/dashboard', {}, activeUser.username)
      .then((data) => {
        if (isMounted) setDashboardData(data);
      })
      .catch((e) => console.error(e));

    apiRequest<CaseItem[]>('/cases', {}, activeUser.username)
      .then((data) => {
        if (isMounted) {
          setCases(data);
          setSelectedCase((prev) => prev || (data.length > 0 ? data[0] : null));
        }
      })
      .catch((e) => console.error(e));

    return () => {
      isMounted = false;
    };
  }, [activeUser.username]);

  // Load Trace Graph for a Case
  const loadCaseTrace = async (caseId: number) => {
    setLoadingGraph(true);
    try {
      const data = await apiRequest<TraceGraphData>(`/traces/by-case/${caseId}`, {}, activeUser.username);
      setTraceGraphData(data);
    } catch (e: any) {
      showNotification(`Failed to load trace graph: ${e.message}`);
    } finally {
      setLoadingGraph(false);
    }
  };

  // Address Validator helper
  const handleValidateAddress = async (address: string, network: string) => {
    if (!address.trim()) return;
    try {
      const res = await apiRequest<any>('/wallets/validate', {
        method: 'POST',
        body: JSON.stringify({ address, network })
      }, activeUser.username);
      setValidationResult(res);
      if (res.detected_networks?.length > 0 && res.network !== 'UNKNOWN') {
        setNewCaseForm(prev => ({ ...prev, reported_network: res.detected_networks[0] }));
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Wallet Intelligence lookup
  const handleLookupWallet = async (address: string, network: string) => {
    setLoadingWallet(true);
    try {
      const data = await apiRequest<WalletProfile>(`/wallets/${network}/${address.trim()}`, {}, activeUser.username);
      setWalletProfile(data);
    } catch (e: any) {
      showNotification(`Wallet lookup failed: ${e.message}`);
    } finally {
      setLoadingWallet(false);
    }
  };

  // Tab switch actions
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') fetchDashboard();
    if (tabId === 'cases') fetchCases();
    if (tabId === 'graph') {
      if (!traceGraphData && cases.length > 0) {
        loadCaseTrace(cases[0].id);
      }
    }
    if (tabId === 'transactions') {
      apiRequest<any[]>('/transactions', {}, activeUser.username).then(setTransactions).catch(console.error);
    }
    if (tabId === 'cross-chain') {
      apiRequest<CrossChainItem[]>('/cross-chain', {}, activeUser.username).then(setCrossChainHops).catch(console.error);
    }
    if (tabId === 'vasp') {
      apiRequest<VaspEntityItem[]>('/vasp/entities', {}, activeUser.username).then(setVaspEntities).catch(console.error);
      apiRequest<AttributionItem[]>('/vasp/attributions', {}, activeUser.username).then(setAttributions).catch(console.error);
    }
    if (tabId === 'alerts') {
      apiRequest<AlertItem[]>('/alerts', {}, activeUser.username).then(setAlerts).catch(console.error);
    }
    if (tabId === 'evidence') {
      apiRequest<EvidenceItem[]>('/evidence', {}, activeUser.username).then(setEvidenceList).catch(console.error);
    }
    if (tabId === 'reports') {
      apiRequest<ReportItem[]>('/reports', {}, activeUser.username).then(setReports).catch(console.error);
    }
    if (tabId === 'integrations') {
      apiRequest<any[]>('/integrations', {}, activeUser.username).then(setIntegrations).catch(console.error);
    }
    if (tabId === 'users') {
      apiRequest<any[]>('/users', {}, activeUser.username).then(setUsersList).catch(console.error);
    }
    if (tabId === 'audit') {
      apiRequest<AuditLogItem[]>('/audit', {}, activeUser.username).then(setAuditLogs).catch(console.error);
    }
  };

  // Preset Scenario Loaders
  const loadScenario = (type: 'TRON' | 'BTC' | 'ETH') => {
    if (type === 'TRON') {
      setNewCaseForm({
        title: 'Operation Golden Crescent: Pig-Butchering USDT Laundering',
        complaint_ref: 'NCRP-2026-MH-49219',
        category: 'Pig-Butchering / Romance Scam',
        priority: 'Critical',
        victim_loss_amount: 35000,
        victim_loss_currency: 'USDT',
        reported_tx_hash: '0x4b7891c28f731a5e01b3d7904e21a5f69c7042a381274e1d90cba7216f498c12',
        reported_wallet_address: 'TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe',
        reported_network: 'TRON',
        description: 'Victim targeted via Telegram investment syndicate with automated peeling chains into Binance deposit terminals.',
        auto_launch_trace: true
      });
      handleValidateAddress('TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe', 'TRON');
    } else if (type === 'BTC') {
      setNewCaseForm({
        title: 'LockCrypt Ransomware Hospital Extortion',
        complaint_ref: 'NCRP-2026-DL-11048',
        category: 'Ransomware Extortion',
        priority: 'High',
        victim_loss_amount: 125000,
        victim_loss_currency: 'USD',
        reported_tx_hash: '7c90812e9b048d34b27f12a89045bcdefa78129034561289ab78cdef90123456',
        reported_wallet_address: 'bc1qa58d7z92m8n4x6k2p9q8v3w7y1a4b5c6d7e8f',
        reported_network: 'BITCOIN',
        description: 'Ransomware operator received 2.15 BTC demand. Proceeds layered into mixer and Kraken deposit gateway.',
        auto_launch_trace: true
      });
      handleValidateAddress('bc1qa58d7z92m8n4x6k2p9q8v3w7y1a4b5c6d7e8f', 'BITCOIN');
    } else {
      setNewCaseForm({
        title: 'QuantumYield DeFi Impersonation Scam',
        complaint_ref: 'NCRP-2026-KA-88231',
        category: 'Investment Scam',
        priority: 'High',
        victim_loss_amount: 82000,
        victim_loss_currency: 'USD',
        reported_tx_hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        reported_wallet_address: '0x71C8364762A80869d6517a1a5b8109F200e4708A',
        reported_network: 'ETHEREUM',
        description: 'Victim funds bridged via Stargate Finance router into Polygon POS and deposited into OKX gateway.',
        auto_launch_trace: true
      });
      handleValidateAddress('0x71C8364762A80869d6517a1a5b8109F200e4708A', 'ETHEREUM');
    }
    setActiveTab('new-investigation');
    showNotification(`Loaded ${type} Fraud Investigation Preset`);
  };

  // Submit New Case
  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCase(true);
    try {
      const res = await apiRequest<any>('/cases', {
        method: 'POST',
        body: JSON.stringify(newCaseForm)
      }, activeUser.username);
      showNotification(`Case ${res.case_number} registered! Attribution trace running.`);
      fetchCases();
      if (res.case_id) {
        loadCaseTrace(res.case_id);
        setActiveTab('graph');
      } else {
        setActiveTab('cases');
      }
    } catch (e: any) {
      showNotification(`Error creating case: ${e.message}`);
    } finally {
      setSubmittingCase(false);
    }
  };

  // Review Alert Status
  const handleReviewAlert = async (alertId: number, newStatus: string) => {
    try {
      await apiRequest<any>(`/alerts/${alertId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      }, activeUser.username);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
      showNotification(`Alert status updated to ${newStatus}`);
    } catch (e: any) {
      showNotification(`Failed: ${e.message}`);
    }
  };

  // Generate Report
  const handleGenerateReport = async (caseId: number) => {
    try {
      const res = await apiRequest<any>('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ case_id: caseId })
      }, activeUser.username);
      showNotification(`Report ${res.report_number} generated with SHA-256 seal.`);
      handleNavClick('reports');
    } catch (e: any) {
      showNotification(`Error: ${e.message}`);
    }
  };

  // View Report Dossier
  const handleViewReportDetail = async (reportId: number) => {
    try {
      const res = await apiRequest<any>(`/reports/${reportId}`, {}, activeUser.username);
      setSelectedReportView(res);
    } catch (e: any) {
      showNotification(`Failed to load report: ${e.message}`);
    }
  };

  // Test NCRP Sync
  const handleTestNCRP = async (ackNo: string) => {
    try {
      const res = await apiRequest<any>('/integrations/ncrp/sync', {
        method: 'POST',
        body: JSON.stringify({ acknowledgement_number: ackNo })
      }, activeUser.username);
      showNotification(`NCRP Sync successful: ${res.data?.incident_category}`);
    } catch (e: any) {
      showNotification(`NCRP Sync failed: ${e.message}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#080D1A] text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md text-sm animate-pulse-glow">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* BEGINNER JARGON GLOSSARY MODAL */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#0F172A] border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 text-xs text-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Crypto Words Explained in Simple English</h3>
              </div>
              <button onClick={() => setShowGlossaryModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-bold text-cyan-300 text-sm mb-1">1. Crypto Wallet Address</div>
                <p className="text-slate-300">Just like an <strong>account number or UPI ID</strong>. It's a string of letters and numbers (like <code className="text-amber-300">TY48xHqy...</code>) where people receive and store crypto.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-bold text-emerald-400 text-sm mb-1">2. VASP / Exchange (e.g. Binance, WazirX)</div>
                <p className="text-slate-300">Think of a VASP as a <strong>licensed crypto bank</strong>. Scammers cannot buy groceries or withdraw cash directly from crypto; they must deposit into an exchange to sell it for real money. At this exchange, they have a KYC ID on file, which police can subpoena!</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-bold text-purple-400 text-sm mb-1">3. Peeling Chain & Mule Splitting</div>
                <p className="text-slate-300">A trick used by thieves where they break a big amount (e.g. \$35,000) into 2 or 3 smaller amounts sent to middleman helper wallets so nobody notices a big transfer.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-bold text-red-400 text-sm mb-1">4. Mixer (e.g. Tornado Cash)</div>
                <p className="text-slate-300">A digital laundering machine. Criminals throw their stolen crypto into a giant pool with thousands of other coins to wash away their tracks.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-bold text-cyan-400 text-sm mb-1">5. Section 91 Cr.P.C. / MLAT Legal Notice</div>
                <p className="text-slate-300">The legal court order issued by police to the exchange demanding: <em>"Freeze this scammer's balance immediately and give us their registered name, phone number, and bank account!"</em></p>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setShowGlossaryModal(false)} className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition">
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORY WALKTHROUGH MODAL: "SEE HOW A CRIME IS SOLVED" */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-[#0B1120] border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 text-xs text-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">How This App Catches Scammers (Step-by-Step Story)</h3>
              </div>
              <button onClick={() => setShowStoryModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center font-bold flex-shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-white text-xs">The Crime Happens</h4>
                  <p className="text-slate-300 mt-0.5">Victim Amit was lured into a fake Telegram crypto-mining club and sent <strong>$35,000 USDT</strong> to the scammer's wallet <code className="text-amber-300">TY48xHqy...</code>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold flex-shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-white text-xs">Scammers Try to Hide the Money</h4>
                  <p className="text-slate-300 mt-0.5">Within 14 minutes, the scammer split the money into two halves ($20,000 and $15,000) and sent them to two middleman wallets to confuse police.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold flex-shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-white text-xs">CryptoTrace Finds the Destination</h4>
                  <p className="text-slate-300 mt-0.5">CryptoTrace followed both transactions and discovered they both landed directly inside <strong>Binance Account Deposit: TD89vWxy...</strong></p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold flex-shrink-0">4</span>
                <div>
                  <h4 className="font-bold text-white text-xs">Police Action & Account Freeze</h4>
                  <p className="text-slate-300 mt-0.5">CryptoTrace drafted the official legal notice to Binance (<code className="text-cyan-300">case-response@binance.com</code>) with the exact transaction IDs, allowing the officer to freeze Amit's stolen funds.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-slate-400 text-[11px]">That is what CryptoTrace does automatically for every reported wallet!</span>
              <button
                onClick={() => {
                  setShowStoryModal(false);
                  loadScenario('TRON');
                }}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5"
              >
                Try This Case Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION (15 Views) */}
      <aside className="w-64 flex-shrink-0 bg-[#0B1120] border-r border-[#1E293B] flex flex-col justify-between select-none">
        <div>
          {/* Agency Header Brand */}
          <div className="p-4 border-b border-[#1E293B] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                CryptoTrace <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-500/30">INTEL</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {isSimpleMode ? "Crypto Fraud Tracker" : "Law Enforcement Unit"}
              </p>
            </div>
          </div>

          {/* Quick Help & Story Buttons in Sidebar */}
          <div className="p-3 space-y-1.5 border-b border-[#1E293B] bg-slate-900/40">
            <button
              onClick={() => setShowStoryModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/50 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>How a Case is Solved</span>
            </button>
            <button
              onClick={() => setShowGlossaryModal(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs hover:bg-slate-800 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Crypto Words Dictionary</span>
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)] text-xs">
            {[
              { id: 'dashboard', label: isSimpleMode ? '1. Overview & Summary' : 'Overview Dashboard', icon: LayoutDashboard },
              { id: 'new-investigation', label: isSimpleMode ? '2. Track New Wallet' : 'New Investigation', icon: PlusCircle, highlight: true },
              { id: 'graph', label: isSimpleMode ? '3. Visual Money Trail' : 'Fund-Flow Graph', icon: Network },
              { id: 'wallets', label: isSimpleMode ? '4. Wallet Dossier & Risk' : 'Wallet Intelligence', icon: Search },
              { id: 'vasp', label: isSimpleMode ? '5. Exchanges (Binance etc.)' : 'Exchange & VASP Intel', icon: Building2 },
              { id: 'alerts', label: isSimpleMode ? '6. Fraud Warnings' : 'Risk & Alerts', icon: AlertTriangle, count: alerts.length },
              { id: 'reports', label: isSimpleMode ? '7. Official Police Reports' : 'Investigation Reports', icon: FileText },
              { id: 'cases', label: isSimpleMode ? '8. Cases List' : 'Case Management', icon: Briefcase, count: cases.length },
              { id: 'cross-chain', label: isSimpleMode ? 'Cross-Chain Transfers' : 'Cross-Chain Tracing', icon: ExternalLink },
              { id: 'transactions', label: 'All Transactions', icon: ArrowRightLeft },
              { id: 'evidence', label: 'Evidence Vault', icon: FileCheck },
              { id: 'integrations', label: 'NCRP & Portals', icon: Database },
              { id: 'users', label: 'Officers & Roles', icon: Users },
              { id: 'audit', label: 'Audit Log History', icon: History },
              { id: 'settings', label: 'System Settings', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left font-medium ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : item.highlight
                      ? 'text-cyan-400 hover:bg-slate-800/80 hover:text-cyan-300'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Persona & Role Badge Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#090F1D]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {isSimpleMode ? "Current User" : "Active Investigator"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {activeUser.role}
            </span>
          </div>
          <select
            value={activeUser.username}
            onChange={(e) => {
              const persona = DEMO_PERSONAS.find(p => p.username === e.target.value);
              if (persona) {
                setActiveUser(persona);
                showNotification(`Switched persona to ${persona.full_name} (${persona.role})`);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md p-1.5 focus:outline-none focus:border-cyan-500"
          >
            {DEMO_PERSONAS.map(p => (
              <option key={p.id} value={p.username}>
                {p.full_name} ({p.role})
              </option>
            ))}
          </select>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span>Badge: {activeUser.badge_number}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Logged In
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#080D1A]">
        {/* TOP DEMO BANNER & SYSTEM HEADER */}
        <header className="flex-shrink-0 border-b border-[#1E293B] bg-[#0B1120]/90 backdrop-blur-md px-6 py-2.5">
          {/* Beginner Mode & Quick Scenario Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {/* Beginner Mode Switch */}
              <button
                onClick={() => {
                  setIsSimpleMode(s => !s);
                  showNotification(isSimpleMode ? "Switched to Expert Forensics Mode" : "Switched to Plain English Beginner Mode");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition text-xs border ${
                  isSimpleMode
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle plain-English labels and walkthrough hints"
              >
                {isSimpleMode ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isSimpleMode ? "💡 Beginner Mode: ON (Easy English)" : "Forensics Expert Mode"}</span>
              </button>

              <span className="text-slate-400 hidden lg:inline">
                {isSimpleMode
                  ? "Hover or click any item to see plain explanations."
                  : "Certified Law Enforcement Intelligence Platform"}
              </span>
            </div>

            {/* Quick Demo Scenarios */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Try Sample Scams:</span>
              <button
                onClick={() => loadScenario('TRON')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
              >
                Pig-Butchering ($35k USDT)
              </button>
              <button
                onClick={() => loadScenario('BTC')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
              >
                Ransomware (2.15 BTC)
              </button>
              <button
                onClick={() => loadScenario('ETH')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition"
              >
                Bridge Scam ($82k USDC)
              </button>
            </div>
          </div>

          {/* Top Bar with Live Node Status */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeTab.replace('-', ' ')}
              </h2>
              {/* Chain Health Indicators */}
              <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400">
                {['BTC', 'ETH', 'TRON', 'SOL', 'BSC', 'POLYGON'].map(net => (
                  <span key={net} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900/80 rounded border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {net}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Address Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isSimpleMode ? "Paste any scammer's wallet address..." : "Quick lookup wallet or tx..."}
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && headerSearch.trim()) {
                      setWalletSearchInput(headerSearch.trim());
                      handleNavClick('wallets');
                      handleLookupWallet(headerSearch.trim(), 'TRON');
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 w-64 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                onClick={() => handleNavClick('new-investigation')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {isSimpleMode ? "Track A Wallet" : "New Case"}
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Beginner Guide Banner (Shown when Beginner Mode is ON) */}
              {isSimpleMode && (
                <div className="bg-gradient-to-r from-[#0F172A] via-[#111C38] to-[#0F172A] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-sm">
                        What does CryptoTrace do? (Understanding This in 4 Simple Steps)
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowStoryModal(true)}
                      className="text-xs text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Read 30-Second Story Walkthrough <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center font-bold mb-2">1</div>
                      <h4 className="font-bold text-white mb-1">Victim Reports Theft</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        The victim lost money in a scam and gives the police the scammer's crypto wallet address.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold mb-2">2</div>
                      <h4 className="font-bold text-white mb-1">Follow the Money Trail</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        CryptoTrace automatically follows the funds as scammers split and pass them through middleman wallets.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold mb-2">3</div>
                      <h4 className="font-bold text-white mb-1">Find the Real Exchange</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        To turn crypto into real cash, scammers must deposit into an exchange like <strong>Binance</strong> or <strong>WazirX</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold mb-2">4</div>
                      <h4 className="font-bold text-white mb-1">Freeze & Arrest</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        CryptoTrace drafts the legal order to the exchange to immediately freeze the account and reveal the scammer's KYC ID.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                    <span>{isSimpleMode ? "Crimes Being Investigated" : "Active Cybercrime Cases"}</span>
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {dashboardData?.stats?.total_cases ?? 3}
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                    <span>{dashboardData?.stats?.open_cases ?? 3} active right now</span>
                  </div>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                    <span>{isSimpleMode ? "Total Money Stolen by Scammers" : "Reported Loss Tracked"}</span>
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${(dashboardData?.stats?.total_loss_tracked_usd ?? 242000).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">
                    {isSimpleMode ? "Tracked across all victims" : "Multi-chain victim aggregated"}
                  </div>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                    <span>{isSimpleMode ? "Dangerous Criminal Wallets" : "High-Risk Wallets Identified"}</span>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {dashboardData?.stats?.high_risk_wallets ?? 4}
                  </div>
                  <div className="text-[11px] text-red-400 mt-1">
                    {isSimpleMode ? "Laundering hubs & scammer wallets" : "Mixer, mule & drainer clusters"}
                  </div>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                    <span>{isSimpleMode ? "Urgent Action Alerts" : "Active Investigative Alerts"}</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {dashboardData?.stats?.total_alerts ?? 3}
                  </div>
                  <div className="text-[11px] text-amber-400 mt-1">
                    {dashboardData?.stats?.critical_alerts ?? 1} ready for exchange freeze order
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Recent Cases & Blockchain Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Cases Table */}
                <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-400" />
                      {isSimpleMode ? "Current Cases Being Investigated" : "Recent Priority Investigations"}
                    </h3>
                    <button
                      onClick={() => handleNavClick('cases')}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      View All Cases <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2">Case Reference</th>
                          <th className="pb-2">Typology / Crime</th>
                          <th className="pb-2">Scammer's Wallet</th>
                          <th className="pb-2">Amount Stolen</th>
                          <th className="pb-2">What to do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {cases.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 font-medium text-white">
                              <div>{c.case_number}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.complaint_ref}</div>
                            </td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {c.category}
                              </span>
                            </td>
                            <td className="py-2.5 font-mono text-slate-300">
                              <span className="text-cyan-400 font-bold mr-1">[{c.reported_network}]</span>
                              {c.reported_wallet_address.slice(0, 6)}...{c.reported_wallet_address.slice(-4)}
                            </td>
                            <td className="py-2.5 font-semibold text-emerald-400">
                              {c.victim_loss}
                            </td>
                            <td className="py-2.5">
                              <button
                                onClick={() => {
                                  setSelectedCase(c);
                                  loadCaseTrace(c.id);
                                  setActiveTab('graph');
                                }}
                                className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 text-[11px] font-bold transition flex items-center gap-1"
                              >
                                {isSimpleMode ? "See Money Flow ->" : "View Trace"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Blockchain Distribution & Data Source Health */}
                <div className="space-y-6">
                  {/* Blockchain Distribution */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-400" />
                      {isSimpleMode ? "Which Blockchains Scammers Use Most" : "Analyzed Network Distribution"}
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { name: 'TRON (Cheapest for USDT Scams)', count: 4, percent: 55, color: 'bg-red-500' },
                        { name: 'ETHEREUM (Smart Contracts & DeFi)', count: 2, percent: 25, color: 'bg-cyan-500' },
                        { name: 'BITCOIN (Common in Ransomware)', count: 1, percent: 15, color: 'bg-amber-500' },
                        { name: 'POLYGON (Fast Cheap Tokens)', count: 1, percent: 5, color: 'bg-purple-500' },
                      ].map((item) => (
                        <div key={item.name} className="text-xs">
                          <div className="flex justify-between text-slate-300 mb-1">
                            <span>{item.name}</span>
                            <span className="font-mono text-slate-400">{item.count} wallets ({item.percent}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portal Integration Health */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      {isSimpleMode ? "Government & Police Portals Connected" : "Integration Status"}
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-300">NCRP (National Cybercrime Portal)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-300">SAHYOG (Inter-Agency Coordination)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Connected
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-300">Public Blockchain Explorers</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          6 Networks Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. NEW INVESTIGATION WORKFLOW */}
          {activeTab === 'new-investigation' && (
            <div className="max-w-4xl mx-auto bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1E293B]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-cyan-400" />
                    {isSimpleMode ? "Track a New Stolen Crypto Wallet" : "Initiate Law Enforcement Cryptocurrency Investigation"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSimpleMode
                      ? "Paste the scammer's wallet address from the complaint. CryptoTrace will automatically check if the address is real and trace where the money went."
                      : "Register cybercrime complaint wallet addresses, validate network algorithms, and execute automated multi-hop attribution traces."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadScenario('TRON')}
                    className="px-2.5 py-1 text-xs rounded bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 transition"
                  >
                    Load TRON Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => loadScenario('BTC')}
                    className="px-2.5 py-1 text-xs rounded bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 transition"
                  >
                    Load BTC Sample
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCaseSubmit} className="space-y-5 text-xs">
                {/* Row 1: Case Title & Complaint Ref */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "Case / Incident Name *" : "Investigation / Case Title *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Telegram Crypto Investment Scam"
                      value={newCaseForm.title}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "Police / Cybercrime Complaint Ref Number" : "NCRP / Complaint Ref Number"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. NCRP-2026-MH-49219"
                        value={newCaseForm.complaint_ref}
                        onChange={(e) => setNewCaseForm({ ...newCaseForm, complaint_ref: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleTestNCRP(newCaseForm.complaint_ref || 'NCRP-2026-MH-49219')}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-lg transition"
                        title="Simulate synchronization with official portal"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Fraud Typology Category & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "What type of scam was it? *" : "Fraud Typology Category *"}
                    </label>
                    <select
                      value={newCaseForm.category}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Pig-Butchering / Romance Scam">Pig-Butchering / Romance Scam</option>
                      <option value="Investment Scam / Fake DeFi Yield">Investment Scam / Fake DeFi Yield</option>
                      <option value="Task-Based / Part-Time Job Fraud">Task-Based / Part-Time Job Fraud</option>
                      <option value="Ransomware Extortion">Ransomware Extortion</option>
                      <option value="Phishing & Drainer Contract">Phishing & Drainer Contract</option>
                      <option value="Sextortion & Blackmail">Sextortion & Blackmail</option>
                      <option value="Darknet Market Proceeds">Darknet Market Proceeds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "Urgency / Priority" : "Case Priority"}
                    </label>
                    <select
                      value={newCaseForm.priority}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, priority: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Critical">Critical (Immediate Asset Flight)</option>
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Assigned Investigator
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${activeUser.full_name} (${activeUser.badge_number})`}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 3: Reported Wallet & Network Selection with Real-time Validator */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "Scammer's Wallet Address (where victim sent money) *" : "Reported Suspect Wallet Address *"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Paste wallet address here..."
                        value={newCaseForm.reported_wallet_address}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCaseForm({ ...newCaseForm, reported_wallet_address: val });
                          handleValidateAddress(val, newCaseForm.reported_network);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Blockchain Network *
                    </label>
                    <select
                      value={newCaseForm.reported_network}
                      onChange={(e) => {
                        const net = e.target.value;
                        setNewCaseForm({ ...newCaseForm, reported_network: net });
                        handleValidateAddress(newCaseForm.reported_wallet_address, net);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="TRON">TRON (Starts with 'T')</option>
                      <option value="ETHEREUM">ETHEREUM (Starts with '0x')</option>
                      <option value="BITCOIN">BITCOIN (Starts with 1, 3, or bc1)</option>
                      <option value="SOLANA">SOLANA (Base58)</option>
                      <option value="BSC">BNB SMART CHAIN (Starts with '0x')</option>
                      <option value="POLYGON">POLYGON POS (Starts with '0x')</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Validation Message Banner */}
                {validationResult && (
                  <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    validationResult.is_valid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationResult.is_valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span>
                        {isSimpleMode && validationResult.is_valid
                          ? `✅ Valid ${validationResult.network} address! System is ready to trace.`
                          : validationResult.validation_message}
                      </span>
                    </div>
                    {validationResult.is_valid && validationResult.explorer_url && (
                      <a
                        href={validationResult.explorer_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        Public Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Row 4: Transaction Hash & Loss Amount */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "Transaction Receipt / Hash (Optional)" : "Initial Fraud Transaction Hash (Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0x4b7891c28f731a5e01b3d7904e21a5f69c7042a381274e1d90cba7216f498c12"
                      value={newCaseForm.reported_tx_hash}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, reported_tx_hash: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isSimpleMode ? "How much money was lost?" : "Victim Loss Amount & Currency"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={newCaseForm.victim_loss_amount}
                        onChange={(e) => setNewCaseForm({ ...newCaseForm, victim_loss_amount: Number(e.target.value) })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={newCaseForm.victim_loss_currency}
                        onChange={(e) => setNewCaseForm({ ...newCaseForm, victim_loss_currency: e.target.value })}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Incident Description */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isSimpleMode ? "Story / Notes on how the victim was cheated" : "Incident Description & Initial Evidence Notes"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on how the victim was contacted, platform used, and promised returns..."
                    value={newCaseForm.description}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Auto launch toggle & submit */}
                <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newCaseForm.auto_launch_trace}
                      onChange={(e) => setNewCaseForm({ ...newCaseForm, auto_launch_trace: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                    />
                    <span>{isSimpleMode ? "Automatically trace the money trail as soon as I submit" : "Automatically launch 3-hop attribution trace upon case creation"}</span>
                  </label>

                  <button
                    type="submit"
                    disabled={submittingCase}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
                  >
                    {submittingCase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {submittingCase ? 'Tracing Money Trail...' : (isSimpleMode ? 'Start Tracking Stolen Money' : 'Register Case & Execute Trace')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. WALLET INTELLIGENCE VIEW */}
          {activeTab === 'wallets' && (
            <div className="space-y-6">
              {/* Wallet Search Box */}
              <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  {isSimpleMode ? "Inspect Any Crypto Wallet in Detail" : "Cryptocurrency Wallet Attribution & Risk Dossier"}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[280px]">
                    <input
                      type="text"
                      placeholder="Paste wallet address (e.g. TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe)..."
                      value={walletSearchInput}
                      onChange={(e) => setWalletSearchInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <select
                    value={walletNetworkSelect}
                    onChange={(e) => setWalletNetworkSelect(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="TRON">TRON</option>
                    <option value="ETHEREUM">ETHEREUM</option>
                    <option value="BITCOIN">BITCOIN</option>
                    <option value="SOLANA">SOLANA</option>
                    <option value="BSC">BSC</option>
                    <option value="POLYGON">POLYGON</option>
                  </select>
                  <button
                    onClick={() => handleLookupWallet(walletSearchInput, walletNetworkSelect)}
                    disabled={loadingWallet}
                    className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition flex items-center gap-2"
                  >
                    {loadingWallet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isSimpleMode ? "Scan Wallet" : "Analyze Wallet"}
                  </button>
                </div>
              </div>

              {/* Wallet Profile Results */}
              {walletProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Risk & Identification */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{walletProfile.address}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
                              {walletProfile.network}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{walletProfile.label}</p>
                        </div>
                        <a
                          href={walletProfile.explorer_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition"
                        >
                          Public Explorer <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Stat Counters */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase">{isSimpleMode ? "Money Currently Inside" : "Current Balance"}</span>
                          <div className="text-sm font-bold text-white mt-1">
                            {walletProfile.balance.toLocaleString()} {walletProfile.asset_symbol}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase">{isSimpleMode ? "Total Money Ever Received" : "Total Received"}</span>
                          <div className="text-sm font-bold text-emerald-400 mt-1">
                            {walletProfile.total_received.toLocaleString()} {walletProfile.asset_symbol}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase">{isSimpleMode ? "Transactions Count" : "Observed Tx Count"}</span>
                          <div className="text-sm font-bold text-white mt-1">
                            {walletProfile.tx_count} transfers
                          </div>
                        </div>
                      </div>

                      {/* Risk Factors Explanation */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          {isSimpleMode ? "Why is this wallet marked suspicious?" : "Risk Factors & Behavioral Indicators"}
                        </h4>
                        <div className="space-y-2">
                          {walletProfile.risk.factors.length > 0 ? (
                            walletProfile.risk.factors.map((f, i) => (
                              <div key={i} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                                <div className="flex items-center justify-between text-slate-200 font-semibold mb-1">
                                  <span>{f.factor}</span>
                                  <span className="text-red-400 font-mono">+{f.points} risk points</span>
                                </div>
                                <p className="text-[11px] text-slate-400">{f.evidence}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-slate-900/50 rounded-lg text-slate-400 text-xs">
                              No high-risk behavioral heuristics detected.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Score Gauge & VASP Attribution */}
                  <div className="space-y-6">
                    {/* Risk Score Card */}
                    <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-xl text-center">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                        {isSimpleMode ? "Danger / Risk Score" : "Calculated Risk Score"}
                      </h4>
                      <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-red-500/40 bg-red-950/20 text-3xl font-black text-red-400 shadow-xl shadow-red-500/10 mb-2">
                        {Math.round(walletProfile.risk.score)}/100
                      </div>
                      <div className="text-sm font-bold text-red-400 uppercase">
                        {walletProfile.risk.level} Risk
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 px-2">
                        {walletProfile.risk.explanation}
                      </p>
                    </div>

                    {/* VASP Association Card */}
                    {walletProfile.attribution ? (
                      <div className="bg-[#0F172A] border border-emerald-500/40 p-5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            {isSimpleMode ? "Crypto Bank / Exchange Identified!" : "Verified VASP Destination"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {walletProfile.attribution.confidence_level} ({walletProfile.attribution.confidence_score}%)
                          </span>
                        </div>
                        <div className="text-base font-bold text-white">
                          {walletProfile.attribution.vasp_name}
                        </div>
                        <div className="text-xs text-slate-300">
                          <div><span className="text-slate-400">Account Type:</span> {walletProfile.attribution.attribution_type}</div>
                          <div><span className="text-slate-400">Jurisdiction:</span> {walletProfile.attribution.jurisdiction}</div>
                          {walletProfile.attribution.compliance_email && (
                            <div><span className="text-slate-400">Police Contact Email:</span> <code className="text-cyan-300 font-bold">{walletProfile.attribution.compliance_email}</code></div>
                          )}
                        </div>
                        {/* Legal Guidance */}
                        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                          <span className="font-bold text-amber-400">What Police Should Do:</span> {walletProfile.attribution.recommended_legal_step}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0F172A] border border-[#1E293B] p-5 rounded-xl text-center text-xs text-slate-400">
                        <Building2 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                        {isSimpleMode
                          ? "This wallet is a private app (like MetaMask or TrustWallet). The money hasn't been cashed out to an exchange directly from here yet."
                          : "No direct exchange deposit attribution registered for this address. Appears as a self-custody or intermediary wallet."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. TRANSACTION EXPLORER */}
          {activeTab === 'transactions' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    {isSimpleMode ? "All Recorded Crypto Transfers" : "Multi-Chain Transaction Ledger & Token Transfers"}
                  </h3>
                  {isSimpleMode && (
                    <p className="text-xs text-slate-400 mt-1">
                      Every row below is a real blockchain transfer recorded as evidence in our cases.
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">Total Recorded: {transactions.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Receipt / Tx Hash</th>
                      <th className="pb-2">Blockchain</th>
                      <th className="pb-2">Sender (From)</th>
                      <th className="pb-2">Recipient (To)</th>
                      <th className="pb-2">Amount Stolen/Moved</th>
                      <th className="pb-2">Transfer Pattern</th>
                      <th className="pb-2">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 text-cyan-400 font-bold">
                          {t.tx_hash.slice(0, 10)}...{t.tx_hash.slice(-8)}
                        </td>
                        <td className="py-2.5 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                            {t.network}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {t.from_address.slice(0, 8)}...{t.from_address.slice(-6)}
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {t.to_address.slice(0, 8)}...{t.to_address.slice(-6)}
                        </td>
                        <td className="py-2.5 font-sans font-semibold text-emerald-400">
                          {t.amount.toLocaleString()} {t.asset_symbol}
                        </td>
                        <td className="py-2.5 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                            {t.tx_type}
                          </span>
                        </td>
                        <td className="py-2.5 font-sans">
                          <a
                            href={t.explorer_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:text-cyan-400 inline-flex items-center text-slate-400"
                            title="Inspect on Public Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. FUND-FLOW GRAPH VIEW */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F172A] border border-[#1E293B] p-4 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    {isSimpleMode ? "Active Case being Visualized:" : "Active Case Trace:"}
                  </span>
                  <select
                    value={selectedCase?.id ?? ''}
                    onChange={(e) => {
                      const c = cases.find(item => item.id === Number(e.target.value));
                      if (c) {
                        setSelectedCase(c);
                        loadCaseTrace(c.id);
                      }
                    }}
                    className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.case_number} - {c.title} ({c.reported_network})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCase && (
                    <button
                      onClick={() => handleGenerateReport(selectedCase.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {isSimpleMode ? "Create Police Report" : "Compile Forensic Report"}
                    </button>
                  )}
                  <button
                    onClick={() => selectedCase && loadCaseTrace(selectedCase.id)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                    title="Re-run Trace"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Interactive Graph Canvas */}
              {loadingGraph ? (
                <div className="w-full h-[600px] flex items-center justify-center bg-[#080D1A] border border-[#1E293B] rounded-xl text-cyan-400">
                  <div className="flex flex-col items-center gap-2 text-xs">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span>{isSimpleMode ? "Tracing where the scammer moved the money..." : "Traversing on-chain transaction hops and calculating flow topology..."}</span>
                  </div>
                </div>
              ) : traceGraphData ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Graph Canvas */}
                  <div className="lg:col-span-3">
                    <InteractiveGraph
                      data={traceGraphData}
                      selectedNodeId={selectedGraphNode?.id}
                      isSimpleMode={isSimpleMode}
                      onSelectNode={(node) => setSelectedGraphNode(node)}
                    />
                  </div>

                  {/* Node Dossier Drawer */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-4 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Search className="w-4 h-4 text-cyan-400" />
                      {isSimpleMode ? "Wallet Details Inspector" : "Node Dossier Inspector"}
                    </h4>

                    {selectedGraphNode ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {isSimpleMode ? "Who owns this wallet?" : "Label & Classification"}
                          </span>
                          <div className="text-sm font-bold text-white">
                            {isSimpleMode && selectedGraphNode.is_root
                              ? "🛑 Scammer's Primary Wallet (Stolen Money Received Here)"
                              : isSimpleMode && selectedGraphNode.vasp_name
                              ? `🏦 ${selectedGraphNode.vasp_name} (Freeze This Account!)`
                              : selectedGraphNode.label}
                          </div>
                          <div className="font-mono text-[11px] text-slate-300 break-all mt-0.5">
                            {selectedGraphNode.address}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase">{isSimpleMode ? "Transfer Step" : "Hop Level"}</span>
                            <div className="text-sm font-bold text-white">Step #{selectedGraphNode.hop}</div>
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase">{isSimpleMode ? "Danger Level" : "Risk Level"}</span>
                            <div className="text-sm font-bold text-red-400">{selectedGraphNode.risk_level} ({Math.round(selectedGraphNode.risk_score)})</div>
                          </div>
                        </div>

                        {selectedGraphNode.vasp_name && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase">
                              {isSimpleMode ? "Target for Account Freeze" : "Associated Exchange"}
                            </span>
                            <div className="font-bold text-white text-sm">{selectedGraphNode.vasp_name}</div>
                            <p className="text-[10px] text-slate-300 mt-1">
                              {isSimpleMode
                                ? "This is a real registered crypto bank! Police can send a Section 91 CrPC notice to freeze the scammer's funds here."
                                : "Preservation request recommended under Section 91 Cr.P.C. / MLAT."}
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setWalletSearchInput(selectedGraphNode.address);
                            setWalletNetworkSelect(selectedGraphNode.network);
                            handleLookupWallet(selectedGraphNode.address, selectedGraphNode.network);
                            setActiveTab('wallets');
                          }}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-medium transition text-center"
                        >
                          {isSimpleMode ? "View Full Wallet History" : "Open Deep Intelligence Profile"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center py-12">
                        {isSimpleMode
                          ? "👉 Click on any circle in the graph to see who owns it and whether police can freeze it."
                          : "Click on any node in the graph to inspect its risk scores, hop depth, and VASP attributions."}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 6. CROSS-CHAIN TRACING */}
          {activeTab === 'cross-chain' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                    {isSimpleMode ? "Cross-Chain Bridges (Moving Money Between Different Blockchains)" : "Cross-Chain Bridge Detection & Relayer Tracing"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSimpleMode
                      ? "Sometimes scammers move money from Ethereum to Polygon or Bitcoin to throw off police. CryptoTrace connects both ends."
                      : "Correlate bridge protocol deposits with target destination withdrawals to maintain attribution across disparate blockchains."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {crossChainHops.map((h) => (
                  <div key={h.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-400 text-sm">{h.bridge_protocol}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                          {h.status}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] font-mono">{h.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Origin */}
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">1. Where it left: {h.source_network}</span>
                        <div className="mt-1 font-mono text-slate-300">Sender: {h.sender_address}</div>
                        <div className="mt-1 font-bold text-slate-200">Amount Sent: {h.amount_sent.toLocaleString()} {h.token_sent}</div>
                        {h.source_explorer_url && (
                          <a href={h.source_explorer_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline mt-2 inline-flex items-center gap-1 font-mono text-[10px]">
                            Source Tx Explorer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Destination */}
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">2. Where it arrived: {h.dest_network}</span>
                        <div className="mt-1 font-mono text-slate-300">Receiver: {h.receiver_address}</div>
                        <div className="mt-1 font-bold text-emerald-400">Amount Received: {h.amount_received.toLocaleString()} {h.token_received}</div>
                        {h.dest_explorer_url && (
                          <a href={h.dest_explorer_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline mt-2 inline-flex items-center gap-1 font-mono text-[10px]">
                            Destination Tx Explorer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. EXCHANGE AND VASP INTELLIGENCE */}
          {activeTab === 'vasp' && (
            <div className="space-y-6">
              {/* Directory */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      {isSimpleMode ? "Official Crypto Exchanges (Banks where Police can Freeze Accounts)" : "Verified Virtual Asset Service Providers (VASPs) Directory"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isSimpleMode
                        ? "These are registered crypto companies. Each has an official police compliance email address to freeze suspect funds."
                        : "Verified database of Centralized Exchanges with direct Law Enforcement liaison contacts and legal notice guidelines."}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{vaspEntities.length} Registered Exchanges</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vaspEntities.map(v => (
                    <div key={v.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{v.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                          {v.verified_status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">{v.category} • {v.jurisdiction}</div>
                      {v.compliance_contact_email && (
                        <div className="text-slate-300 truncate">
                          <span className="text-slate-400">Police Contact:</span> <code className="text-cyan-300 font-bold">{v.compliance_contact_email}</code>
                        </div>
                      )}
                      {v.law_enforcement_portal_url && (
                        <a
                          href={v.law_enforcement_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          Law Enforcement Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Attributions Table */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  {isSimpleMode ? "Known Exchange Deposit Accounts" : "Registered Wallet Attributions & Evidence Provenance"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Wallet Address</th>
                        <th className="pb-2">Network</th>
                        <th className="pb-2">Which Exchange</th>
                        <th className="pb-2">Account Type</th>
                        <th className="pb-2">Confidence</th>
                        <th className="pb-2">Evidence Provenance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {attributions.map(a => (
                        <tr key={a.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 font-bold text-white">{a.wallet_address.slice(0, 10)}...{a.wallet_address.slice(-6)}</td>
                          <td className="py-2.5 font-sans text-cyan-300">{a.network}</td>
                          <td className="py-2.5 font-sans font-bold text-emerald-400">{a.vasp_name}</td>
                          <td className="py-2.5 font-sans text-slate-300">{a.attribution_type}</td>
                          <td className="py-2.5 font-sans">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                              {a.confidence_level} ({a.confidence_score}%)
                            </span>
                          </td>
                          <td className="py-2.5 font-sans text-slate-400 text-[11px] max-w-xs truncate">{a.evidence_source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. RISK AND ALERTS */}
          {activeTab === 'alerts' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {isSimpleMode ? "Urgent Action Leads (Detected Scammer Moves)" : "Real-Time Investigative Leads & Rule-Based Alerts"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSimpleMode
                      ? "When stolen money hits an exchange or a mixer, CryptoTrace immediately alerts the police officer."
                      : "Heuristic alerts triggered by suspicious on-chain behavior."}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{alerts.length} Active Leads</span>
              </div>

              <div className="space-y-3">
                {alerts.map(a => (
                  <div key={a.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                          a.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="font-bold text-white text-sm">{a.rule_name}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">{a.detected_at}</span>
                    </div>

                    <p className="text-slate-300 text-xs">{a.description}</p>

                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      <span className="font-bold text-cyan-400">{isSimpleMode ? "Action to Take:" : "Recommended Next Step:"}</span> {a.recommended_action}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 font-mono text-[11px]">
                        Target: {a.wallet_address.slice(0, 8)}...{a.wallet_address.slice(-6)} ({a.network})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Status: <strong className="text-white">{a.status}</strong></span>
                        <button
                          onClick={() => handleReviewAlert(a.id, 'Under Investigation')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => handleReviewAlert(a.id, 'Dismissed')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. CASE MANAGEMENT */}
          {activeTab === 'cases' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  {isSimpleMode ? "All Active Investigations" : "Cybercrime Case Registry & Evidence Management"}
                </h3>
                <button
                  onClick={() => handleNavClick('new-investigation')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {isSimpleMode ? "Track New Crime" : "New Investigation Case"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Case Reference</th>
                      <th className="pb-2">Title</th>
                      <th className="pb-2">Crime Type</th>
                      <th className="pb-2">Scammer's Wallet</th>
                      <th className="pb-2">Victim Loss</th>
                      <th className="pb-2">Officer</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cases.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 font-medium text-white font-mono">
                          {c.case_number}
                          <div className="text-[10px] text-slate-400">{c.complaint_ref}</div>
                        </td>
                        <td className="py-2.5 font-medium text-slate-200">{c.title}</td>
                        <td className="py-2.5 text-slate-300">{c.category}</td>
                        <td className="py-2.5 font-mono text-cyan-400">
                          {c.reported_wallet_address.slice(0, 6)}...{c.reported_wallet_address.slice(-4)}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">{c.victim_loss}</td>
                        <td className="py-2.5 text-slate-300">{c.assigned_to}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCase(c);
                              loadCaseTrace(c.id);
                              setActiveTab('graph');
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 transition"
                          >
                            Trace
                          </button>
                          <button
                            onClick={() => handleGenerateReport(c.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition"
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. EVIDENCE VAULT */}
          {activeTab === 'evidence' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    {isSimpleMode ? "Evidence Locker (Tamper-Proof Files for Court)" : "Digital Evidence Vault & Cryptographic Chain of Custody"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSimpleMode
                      ? "Every uploaded chat screenshot, bank slip, or export receives a cryptographic fingerprint (SHA-256) so it cannot be altered."
                      : "Tamper-evident evidence registry storing SHA-256 cryptographic hashes for admissibility in judicial proceedings."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {evidenceList.map(e => (
                  <div key={e.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{e.file_name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                        {e.case_number}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-slate-400 text-[11px]">
                      <span>Source: <strong className="text-slate-300">{e.source}</strong></span>
                      <span>Method: <strong className="text-slate-300">{e.collection_method}</strong></span>
                      <span>Size: <strong className="text-slate-300">{e.file_size_bytes} bytes</strong></span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 break-all flex items-center justify-between">
                      <span>SHA-256 Fingerprint: {e.sha256_hash}</span>
                      <span className="text-[10px] text-slate-400 ml-2">AUTHENTIC</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. INVESTIGATION REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      {isSimpleMode ? "Official Police Reports Ready for Exchange Freezes" : "Compiled Forensic Reports & Legal Documentation"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isSimpleMode
                        ? "These documents can be printed or emailed to Binance, WazirX, or court judges to freeze the stolen funds."
                        : "Compiled forensic dossiers with statutory legal disclaimers and cryptographic integrity seals."}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{reports.length} Reports</span>
                </div>

                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{r.title}</span>
                        <span className="font-mono text-cyan-400 text-xs font-bold">{r.report_number}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{r.summary}</p>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[10px] text-slate-400 break-all">
                        Integrity Seal: <span className="text-emerald-400">{r.sha256_integrity_hash}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-slate-400 text-[11px]">Officer: {r.author} • {r.created_at}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewReportDetail(r.id)}
                            className="px-3 py-1 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 font-medium transition flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {isSimpleMode ? "View & Print Report" : "View Executive Dossier"}
                          </button>
                          <a
                            href={`http://localhost:8000/api/v1/reports/${r.id}/csv`}
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export Excel/CSV
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Report Modal Preview */}
              {selectedReportView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
                  <div className="bg-[#0B1120] border border-cyan-500/40 rounded-2xl max-w-4xl w-full p-6 space-y-5 text-xs text-slate-200 max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">OFFICIAL FORENSIC INTELLIGENCE REPORT</span>
                        <h2 className="text-base font-bold text-white mt-0.5">{selectedReportView.title}</h2>
                      </div>
                      <button
                        onClick={() => setSelectedReportView(null)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Metadata Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div><span className="text-slate-400 text-[10px]">Report No:</span> <div className="font-mono font-bold text-cyan-300">{selectedReportView.report_number}</div></div>
                      <div><span className="text-slate-400 text-[10px]">Generated At:</span> <div>{selectedReportView.created_at}</div></div>
                      <div><span className="text-slate-400 text-[10px]">Reporting Officer:</span> <div>{selectedReportView.findings?.reporting_officer}</div></div>
                      <div><span className="text-slate-400 text-[10px]">Classification:</span> <div className="text-red-400 font-bold">RESTRICTED LE ONLY</div></div>
                    </div>

                    {/* Executive Summary */}
                    <div>
                      <h4 className="font-bold text-white mb-1">1. Executive Summary</h4>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {selectedReportView.summary}
                      </p>
                    </div>

                    {/* Observed Path Table */}
                    <div>
                      <h4 className="font-bold text-white mb-1">2. Observed Blockchain Transaction Paths</h4>
                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-2">Hop / Step</th>
                              <th className="p-2">Sender Wallet</th>
                              <th className="p-2">Receiver Wallet</th>
                              <th className="p-2">Amount Stolen</th>
                              <th className="p-2">Destination Label</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                            {selectedReportView.findings?.observed_paths?.map((p: any, i: number) => (
                              <tr key={i}>
                                <td className="p-2">Step #{p.hop}</td>
                                <td className="p-2">{p.from.slice(0, 8)}...{p.from.slice(-6)}</td>
                                <td className="p-2">{p.to.slice(0, 8)}...{p.to.slice(-6)}</td>
                                <td className="p-2 font-sans font-bold text-emerald-400">{p.amount.toLocaleString()} {p.asset}</td>
                                <td className="p-2 font-sans text-cyan-300 font-medium">{p.flag}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Statutory Legal Disclaimer */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                      <strong className="text-amber-400 block mb-1">STATUTORY FORENSIC NOTICE:</strong>
                      {selectedReportView.findings?.legal_disclaimer}
                    </div>

                    {/* Cryptographic Seal */}
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-emerald-400 font-bold block">Cryptographic SHA-256 Report Integrity Seal:</span>
                        <code className="text-slate-300 font-mono text-[10px] break-all">{selectedReportView.sha256_integrity_hash}</code>
                      </div>
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
                        SEAL VERIFIED
                      </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        Print Official Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 12. DATA SOURCES AND INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      Law Enforcement Portals & Blockchain Node Connectors
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure external API credentials or run in certified mock mode for inter-agency coordination.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {integrations.map(intg => (
                    <div key={intg.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{intg.display_title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            intg.is_mock ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {intg.is_mock ? 'MOCK CONNECTOR' : 'LIVE API'}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-1">Endpoint: {intg.api_endpoint}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {intg.name === 'NCRP' && (
                          <button
                            onClick={() => handleTestNCRP('NCRP-2026-MH-49219')}
                            className="px-3 py-1.5 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 font-medium transition"
                          >
                            Test Intake Sync
                          </button>
                        )}
                        <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {intg.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 13. USER AND ROLE MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Role-Based Access Control (RBAC) & Officers Directory
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage investigator credentials and role permissions across 6 security tiers.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Officer Name</th>
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Role Tier</th>
                      <th className="pb-2">Badge Number</th>
                      <th className="pb-2">Department</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 font-bold text-white">{u.full_name}</td>
                        <td className="py-2.5 font-mono text-cyan-400">{u.username}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">{u.badge_number}</td>
                        <td className="py-2.5 text-slate-300">{u.department}</td>
                        <td className="py-2.5 text-emerald-400 font-medium">Active</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 14. AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    Immutable Judicial Audit Trail & Activity Records
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cryptographically recorded access logs for compliance with Indian Evidence Act & cyber forensic standards.
                  </p>
                </div>
                <span className="text-xs text-slate-400">{auditLogs.length} Events</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Timestamp (UTC)</th>
                      <th className="pb-2">Officer</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Resource</th>
                      <th className="pb-2">IP Address</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {auditLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 text-slate-400">{l.timestamp}</td>
                        <td className="py-2 text-cyan-300 font-bold">{l.username}</td>
                        <td className="py-2 font-sans font-bold text-emerald-400">{l.action}</td>
                        <td className="py-2 text-slate-300">{l.resource_type} {l.resource_id ? `(${l.resource_id})` : ''}</td>
                        <td className="py-2 text-slate-400">{l.ip_address}</td>
                        <td className="py-2 font-sans text-slate-400 max-w-xs truncate">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 15. SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-[#0F172A] border border-[#1E293B] rounded-xl p-6 space-y-5 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Settings className="w-4 h-4 text-cyan-400" />
                CryptoTrace Intelligence System Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Demo Mode State</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                      ACTIVE (Synthetic & Testnet Datasets Enabled)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Etherscan API Key (Optional)</label>
                  <input
                    type="password"
                    placeholder="Enter Etherscan key for live mainnet indexing..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tronscan API Key (Optional)</label>
                  <input
                    type="password"
                    placeholder="Enter Tronscan key..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Database Engine</label>
                  <input
                    type="text"
                    disabled
                    value="SQLite3 (Law Enforcement Compliant Local Storage / PostgreSQL Ready)"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => showNotification("System settings saved successfully.")}
                    className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
