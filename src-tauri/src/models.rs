use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseModel {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub lead_investigator: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(default)]
    pub evidence_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceModel {
    pub id: String,
    pub case_id: String,
    pub file_name: String,
    pub file_size: u64,
    pub file_type: String,
    pub sha256_hash: String,
    pub stored_rel_path: String,
    pub description: String,
    pub category: String,
    pub acquisition_date: String,
    pub collector_identity: String,
    pub acquisition_notes: String,
    pub registration_status: String,
    pub on_chain_commitment: Option<String>,
    pub tx_hash: Option<String>,
    pub block_number: Option<i64>,
    pub network_id: Option<String>,
    pub contract_address: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustodyEventModel {
    pub id: String,
    pub evidence_id: String,
    pub actor_identity: String,
    pub event_type: String,
    pub timestamp: String,
    pub context: String,
    pub previous_custody_ref: Option<String>,
    pub tx_ref: Option<String>,
    pub anchored_on_chain: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationRecordModel {
    pub id: String,
    pub evidence_id: String,
    pub verifier_identity: String,
    pub expected_hash: String,
    pub calculated_hash: String,
    pub on_chain_commitment: Option<String>,
    pub result: String,
    pub details: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockchainQueueModel {
    pub id: String,
    pub evidence_id: String,
    pub operation_type: String,
    pub payload: String,
    pub status: String,
    pub tx_hash: Option<String>,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogModel {
    pub id: String,
    pub actor_identity: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub details: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStatsModel {
    pub total_evidence: i64,
    pub local_only: i64,
    pub registered_on_chain: i64,
    pub pending_registration: i64,
    pub failed_integrity_checks: i64,
    pub active_cases: i64,
    pub total_custody_events: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterEvidencePayload {
    pub source_file_path: String,
    pub evidence_id: String,
    pub case_id: String,
    pub description: String,
    pub category: String,
    pub acquisition_date: String,
    pub collector_identity: String,
    pub acquisition_notes: String,
    pub queue_blockchain: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyEvidenceResult {
    pub verification_id: String,
    pub evidence_id: String,
    pub status: String,
    pub expected_hash: String,
    pub calculated_hash: String,
    pub is_match: bool,
    pub on_chain_commitment: Option<String>,
    pub timestamp: String,
    pub details: String,
    pub discrepancy_reason: Option<String>,
}
