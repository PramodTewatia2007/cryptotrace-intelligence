export interface CaseItem {
  id: number;
  case_number: string;
  title: string;
  complaint_ref?: string;
  category: string;
  priority: string;
  status: string;
  victim_loss: string;
  victim_loss_amount: number;
  victim_loss_currency: string;
  reported_wallet_address: string;
  reported_network: string;
  reported_tx_hash?: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  traces_count?: number;
  alerts_count?: number;
  evidence_count?: number;
}

export interface WalletProfile {
  address: string;
  network: string;
  label: string;
  entity_type: string;
  balance: number;
  total_received: number;
  total_sent: number;
  asset_symbol: string;
  tx_count: number;
  in_tx_count: number;
  out_tx_count: number;
  risk: {
    score: number;
    level: string;
    factors: Array<{ factor: string; points: number; severity: string; evidence: string }>;
    explanation: string;
  };
  attribution?: {
    vasp_name: string;
    vasp_category: string;
    jurisdiction: string;
    compliance_email?: string;
    le_portal?: string;
    attribution_type: string;
    confidence_score: number;
    confidence_level: string;
    evidence_source: string;
    recommended_legal_step: string;
  } | null;
  explorer_url: string;
  is_demo: boolean;
}

export interface GraphNode {
  id: string;
  address: string;
  network: string;
  label: string;
  entity_type: string;
  risk_score: number;
  risk_level: string;
  is_root: boolean;
  vasp_name?: string | null;
  vasp_category?: string | null;
  confidence_level?: string | null;
  hop: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  tx_hash: string;
  amount: number;
  asset: string;
  fee?: number;
  timestamp?: string;
  pattern_flag?: string;
  is_token?: boolean;
}

export interface TraceGraphData {
  job_id: number;
  status: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    root_address: string;
    network: string;
    nodes_count: number;
    edges_count: number;
    detected_vasps: string[];
    suspicious_patterns: string[];
    shortest_path_to_vasp: string[];
    completed_at?: string;
  };
}

export interface AlertItem {
  id: number;
  case_id?: number;
  case_number?: string;
  wallet_address: string;
  network: string;
  rule_code: string;
  rule_name: string;
  severity: string;
  confidence: number;
  description: string;
  recommended_action: string;
  status: string;
  detected_at: string;
}

export interface EvidenceItem {
  id: number;
  case_id: number;
  case_number: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  source: string;
  collection_method: string;
  uploaded_by: string;
  uploaded_at: string;
  chain_of_custody_log: Array<{ action: string; officer?: string; timestamp?: string; sha256_verified?: string }>;
}

export interface ReportItem {
  id: number;
  report_number: string;
  case_id: number;
  case_number: string;
  title: string;
  summary: string;
  findings?: any;
  sha256_integrity_hash: string;
  author: string;
  created_at: string;
}

export interface VaspEntityItem {
  id: number;
  name: string;
  category: string;
  jurisdiction: string;
  compliance_contact_email?: string;
  law_enforcement_portal_url?: string;
  verified_status: string;
  attribution_count: number;
}

export interface AttributionItem {
  id: number;
  wallet_address: string;
  network: string;
  vasp_id: number;
  vasp_name: string;
  vasp_category: string;
  jurisdiction: string;
  compliance_email?: string;
  le_portal?: string;
  attribution_type: string;
  confidence_score: number;
  confidence_level: string;
  evidence_source: string;
  verified_by_analyst?: string;
  notes?: string;
  legal_guidance: string;
  last_verified_at: string;
}

export interface CrossChainItem {
  id: number;
  source_network: string;
  dest_network: string;
  source_tx_hash: string;
  dest_tx_hash?: string;
  bridge_protocol: string;
  sender_address: string;
  receiver_address: string;
  amount_sent: number;
  amount_received: number;
  token_sent: string;
  token_received: string;
  status: string;
  timestamp: string;
  source_explorer_url?: string;
  dest_explorer_url?: string;
}

export interface AuditLogItem {
  id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address: string;
  user_agent: string;
  details?: string;
  timestamp: string;
}
