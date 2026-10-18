export type UserRole =
  "Administrator" | "Investigator" | "Verifier" | "Auditor";

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
}

export type RegistrationStatus =
  | "Local Only"
  | "Pending Registration"
  | "Registration Submitted"
  | "Registered On-Chain"
  | "Registration Failed"
  | "Registration Requires Reconciliation";

export type VerificationResultState =
  | "Integrity Verified"
  | "Integrity Check Failed"
  | "Verification Pending"
  | "Reference Record Unavailable"
  | "Verification Error";

export interface Case {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Closed" | "Archived";
  lead_investigator: string;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
}

export interface Evidence {
  id: string;
  case_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  sha256_hash: string;
  stored_rel_path: string;
  description: string;
  category: string;
  acquisition_date: string;
  collector_identity: string;
  acquisition_notes: string;
  registration_status: RegistrationStatus;
  on_chain_commitment?: string | null;
  tx_hash?: string | null;
  block_number?: number | null;
  network_id?: string | null;
  contract_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustodyEvent {
  id: string;
  evidence_id: string;
  actor_identity: string;
  event_type: string;
  timestamp: string;
  context: string;
  previous_custody_ref?: string | null;
  tx_ref?: string | null;
  anchored_on_chain: boolean;
}

export interface VerificationRecord {
  id: string;
  evidence_id: string;
  verifier_identity: string;
  expected_hash: string;
  calculated_hash: string;
  on_chain_commitment?: string | null;
  result: VerificationResultState;
  details: string;
  timestamp: string;
}

export interface BlockchainQueueItem {
  id: string;
  evidence_id: string;
  operation_type: "REGISTER_EVIDENCE" | "ANCHOR_CUSTODY";
  payload: string;
  status: "Pending" | "Submitted" | "Confirmed" | "Failed";
  tx_hash?: string | null;
  attempts: number;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_identity: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  total_evidence: number;
  local_only: number;
  registered_on_chain: number;
  pending_registration: number;
  failed_integrity_checks: number;
  active_cases: number;
  total_custody_events: number;
}

export interface HashResult {
  sha256_hash: string;
  file_size: number;
  file_name: string;
  file_extension: string;
}

export interface RegisterEvidencePayload {
  source_file_path: string;
  evidence_id: string;
  case_id: string;
  description: string;
  category: string;
  acquisition_date: string;
  collector_identity: string;
  acquisition_notes: string;
  queue_blockchain: boolean;
}

export interface VerifyEvidenceResult {
  verification_id: string;
  evidence_id: string;
  status: VerificationResultState;
  expected_hash: string;
  calculated_hash: string;
  is_match: boolean;
  on_chain_commitment?: string | null;
  timestamp: string;
  details: string;
  discrepancy_reason?: string | null;
}
