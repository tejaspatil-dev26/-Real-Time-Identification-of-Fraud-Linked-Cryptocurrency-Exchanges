export type UserRole = "INVESTIGATOR" | "ANALYST" | "ADMIN";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  agency_or_firm: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface SuspectWallet {
  id: string;
  case_id: string;
  address: string;
  network: "BITCOIN" | "ETHEREUM" | "POLYGON" | "TRON";
  reported_victim_loss_usd: number;
  added_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PENDING_ANALYSIS" | "CLOSED" | "ARCHIVED";
  primary_investigator_id: string;
  created_at: string;
  updated_at: string;
  suspect_wallets: SuspectWallet[];
}

export interface InvestigationDispatchResponse {
  task_id: string;
  status: string;
  event_stream: string;
}

export interface VASPEntity {
  id: string;
  vasp_name: string;
  legal_entity_name: string | null;
  jurisdiction_code: string | null;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BENIGN";
  compliance_email: string | null;
  travel_rule_compliant: boolean;
  created_at: string;
}

export interface EvidenceReport {
  id: string;
  case_id: string;
  case_number: string;
  generated_by: string;
  sha256_hash: string;
  s3_storage_uri: string;
  standard_compliance: string;
  report_metadata: Record<string, any>;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  case_id: string | null;
  user_id: string | null;
  action: string;
  payload_snapshot: Record<string, any> | null;
  ip_address: string | null;
  timestamp: string;
}
