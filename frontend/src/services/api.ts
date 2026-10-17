const isLocalVite = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000');
const API_BASE = (import.meta as any).env?.VITE_API_BASE || (isLocalVite ? "http://localhost:8000/api/v1" : "/api/v1");

export interface UserPersona {
  id: number;
  username: string;
  full_name: string;
  role: string;
  badge_number: string;
  department: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  { id: 1, username: "admin", full_name: "Rajesh Kumar (Dir. Systems)", role: "super_admin", badge_number: "LE-ADM-001", department: "Cyber Security Operations Directorate" },
  { id: 2, username: "officer_sharma", full_name: "Inspector Ashok Sharma", role: "investigation_officer", badge_number: "LE-INV-4092", department: "Crypto Fraud Investigation Cell" },
  { id: 3, username: "senior_rao", full_name: "ACP Priya Rao", role: "senior_investigator", badge_number: "LE-SNR-1084", department: "Financial Crimes & Blockchain Forensics" },
  { id: 4, username: "analyst_verma", full_name: "Neha Verma", role: "intelligence_analyst", badge_number: "LE-ANA-2041", department: "Threat Intelligence & On-Chain Analytics" },
  { id: 5, username: "auditor_patel", full_name: "Kiran Patel", role: "auditor", badge_number: "LE-AUD-9912", department: "Independent Vigilance & Judicial Audit Wing" },
  { id: 6, username: "readonly_singh", full_name: "Sub-Inspector Vikram Singh", role: "read_only", badge_number: "LE-OBS-5510", department: "District Cyber Desk" },
];

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, activeUsername = "officer_sharma"): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Demo-User", activeUsername);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errDetail = errJson.detail;
    } catch {}
    throw new Error(errDetail);
  }

  return res.json() as Promise<T>;
}
