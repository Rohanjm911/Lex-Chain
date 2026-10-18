use rusqlite::params;
use std::sync::Arc;
use tauri::State;

use crate::auth::{AuthUser, SessionManager, UserRole};
use crate::db::Database;
use crate::hashing::{calculate_stream_sha256, compute_evidence_commitment, HashResult};
use crate::models::*;
use crate::vault::VaultManager;

pub struct AppState {
    pub db: Arc<Database>,
    pub vault: Arc<VaultManager>,
    pub session: Arc<SessionManager>,
}





#[tauri::command]
pub fn calculate_file_hash(path: String) -> Result<HashResult, String> {
    calculate_stream_sha256(&path)
}

#[tauri::command]
pub fn get_vault_path(state: State<'_, AppState>) -> String {
    state.vault.base_path.to_string_lossy().to_string()
}


#[tauri::command]
pub fn register_evidence(
    state: State<'_, AppState>,
    payload: RegisterEvidencePayload,
) -> Result<EvidenceModel, String> {
    
    let role = state.session.get_role()?;
    if !role.can_register_evidence() {
        return Err("Access Denied: Current user role lacks permission to register evidence.".to_string());
    }

    let current_user = state.session.get_current_user().unwrap();
    let conn = state.db.conn.lock().unwrap();

    
    let case_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM cases WHERE id = ?1",
            params![payload.case_id],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if !case_exists {
        return Err(format!("Case with ID '{}' does not exist.", payload.case_id));
    }

    
    let ev_exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM evidence WHERE id = ?1",
            params![payload.evidence_id],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if ev_exists {
        return Err(format!(
            "Evidence record with ID '{}' already exists in the system. Duplicate IDs are prohibited.",
            payload.evidence_id
        ));
    }

    
    let hash_res = calculate_stream_sha256(&payload.source_file_path)?;

    
    let stored_rel_path = state.vault.preserve_evidence(
        &payload.source_file_path,
        &payload.evidence_id,
        &hash_res.sha256_hash,
    )?;

    
    let commitment = compute_evidence_commitment(
        &payload.evidence_id,
        &hash_res.sha256_hash,
        &payload.case_id,
    );

    let now = chrono::Utc::now().to_rfc3339();
    let initial_status = if payload.queue_blockchain {
        "Pending Registration"
    } else {
        "Local Only"
    };

    
    conn.execute(
        "INSERT INTO evidence (
            id, case_id, file_name, file_size, file_type, sha256_hash,
            stored_rel_path, description, category, acquisition_date,
            collector_identity, acquisition_notes, registration_status,
            on_chain_commitment, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            payload.evidence_id,
            payload.case_id,
            hash_res.file_name,
            hash_res.file_size as i64,
            hash_res.file_extension,
            hash_res.sha256_hash,
            stored_rel_path,
            payload.description,
            payload.category,
            payload.acquisition_date,
            payload.collector_identity,
            payload.acquisition_notes,
            initial_status,
            commitment,
            now,
            now
        ],
    )
    .map_err(|e| format!("Database insert error: {}", e))?;

    
    let cust_id_1 = format!("CUST-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    conn.execute(
        "INSERT INTO custody_events (
            id, evidence_id, actor_identity, event_type, timestamp, context, previous_custody_ref
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            cust_id_1,
            payload.evidence_id,
            current_user.display_name,
            "Evidence Registered",
            now,
            format!("Acquired evidence file preserved with authoritative SHA-256: {}", hash_res.sha256_hash),
            None::<String>
        ],
    ).map_err(|e| format!("Failed to record custody event: {}", e))?;

    
    if payload.queue_blockchain {
        let queue_id = format!("QUE-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
        let queue_payload = serde_json::json!({
            "evidence_id": payload.evidence_id,
            "commitment": commitment,
            "file_hash": hash_res.sha256_hash,
            "case_id": payload.case_id
        }).to_string();

        conn.execute(
            "INSERT INTO blockchain_queue (
                id, evidence_id, operation_type, payload, status, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                queue_id,
                payload.evidence_id,
                "REGISTER_EVIDENCE",
                queue_payload,
                "Pending",
                now,
                now
            ],
        ).map_err(|e| format!("Failed to enqueue blockchain operation: {}", e))?;
    }

    
    let audit_id = format!("AUD-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    conn.execute(
        "INSERT INTO audit_logs (id, actor_identity, action, entity_type, entity_id, details, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            audit_id,
            current_user.display_name,
            "REGISTER_EVIDENCE",
            "Evidence",
            payload.evidence_id,
            format!("Evidence '{}' preserved in vault. Hash: {}.", hash_res.file_name, hash_res.sha256_hash),
            now
        ],
    ).map_err(|e| format!("Failed to record audit log: {}", e))?;

    Ok(EvidenceModel {
        id: payload.evidence_id,
        case_id: payload.case_id,
        file_name: hash_res.file_name,
        file_size: hash_res.file_size,
        file_type: hash_res.file_extension,
        sha256_hash: hash_res.sha256_hash,
        stored_rel_path,
        description: payload.description,
        category: payload.category,
        acquisition_date: payload.acquisition_date,
        collector_identity: payload.collector_identity,
        acquisition_notes: payload.acquisition_notes,
        registration_status: initial_status.to_string(),
        on_chain_commitment: Some(commitment),
        tx_hash: None,
        block_number: None,
        network_id: None,
        contract_address: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn get_evidence_list(state: State<'_, AppState>) -> Result<Vec<EvidenceModel>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, case_id, file_name, file_size, file_type, sha256_hash,
                    stored_rel_path, description, category, acquisition_date,
                    collector_identity, acquisition_notes, registration_status,
                    on_chain_commitment, tx_hash, block_number, network_id,
                    contract_address, created_at, updated_at
             FROM evidence ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(EvidenceModel {
                id: r.get(0)?,
                case_id: r.get(1)?,
                file_name: r.get(2)?,
                file_size: r.get::<_, i64>(3)? as u64,
                file_type: r.get(4)?,
                sha256_hash: r.get(5)?,
                stored_rel_path: r.get(6)?,
                description: r.get(7)?,
                category: r.get(8)?,
                acquisition_date: r.get(9)?,
                collector_identity: r.get(10)?,
                acquisition_notes: r.get(11)?,
                registration_status: r.get(12)?,
                on_chain_commitment: r.get(13)?,
                tx_hash: r.get(14)?,
                block_number: r.get(15)?,
                network_id: r.get(16)?,
                contract_address: r.get(17)?,
                created_at: r.get(18)?,
                updated_at: r.get(19)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn get_evidence_details(
    state: State<'_, AppState>,
    evidence_id: String,
) -> Result<EvidenceModel, String> {
    let conn = state.db.conn.lock().unwrap();
    conn.query_row(
        "SELECT id, case_id, file_name, file_size, file_type, sha256_hash,
                stored_rel_path, description, category, acquisition_date,
                collector_identity, acquisition_notes, registration_status,
                on_chain_commitment, tx_hash, block_number, network_id,
                contract_address, created_at, updated_at
         FROM evidence WHERE id = ?1",
        params![evidence_id],
        |r| {
            Ok(EvidenceModel {
                id: r.get(0)?,
                case_id: r.get(1)?,
                file_name: r.get(2)?,
                file_size: r.get::<_, i64>(3)? as u64,
                file_type: r.get(4)?,
                sha256_hash: r.get(5)?,
                stored_rel_path: r.get(6)?,
                description: r.get(7)?,
                category: r.get(8)?,
                acquisition_date: r.get(9)?,
                collector_identity: r.get(10)?,
                acquisition_notes: r.get(11)?,
                registration_status: r.get(12)?,
                on_chain_commitment: r.get(13)?,
                tx_hash: r.get(14)?,
                block_number: r.get(15)?,
                network_id: r.get(16)?,
                contract_address: r.get(17)?,
                created_at: r.get(18)?,
                updated_at: r.get(19)?,
            })
        },
    )
    .map_err(|e| format!("Evidence not found: {}", e))
}





#[tauri::command]
pub fn verify_evidence(
    state: State<'_, AppState>,
    evidence_id: String,
) -> Result<VerifyEvidenceResult, String> {
    let role = state.session.get_role()?;
    if !role.can_verify_evidence() {
        return Err("Access Denied: Current user role lacks permission to verify evidence integrity.".to_string());
    }

    let current_user = state.session.get_current_user().unwrap();
    let conn = state.db.conn.lock().unwrap();

    let (stored_rel_path, expected_hash, on_chain_commitment): (String, String, Option<String>) = conn
        .query_row(
            "SELECT stored_rel_path, sha256_hash, on_chain_commitment FROM evidence WHERE id = ?1",
            params![evidence_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| format!("Evidence record '{}' not found in database: {}", evidence_id, e))?;

    let vault_file_path = state.vault.resolve_path(&stored_rel_path)?;

    let now = chrono::Utc::now().to_rfc3339();
    let verif_id = format!("VER-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());

    let (calculated_hash, is_match, status, details, discrepancy_reason) =
        match calculate_stream_sha256(&vault_file_path) {
            Ok(hash_res) => {
                let matches = hash_res.sha256_hash.to_lowercase() == expected_hash.to_lowercase();
                if matches {
                    (
                        hash_res.sha256_hash,
                        true,
                        "Integrity Verified".to_string(),
                        "The cryptographic SHA-256 hash of the preserved vault file matches the trusted reference hash exactly. File has not undergone bit-level alteration.".to_string(),
                        None
                    )
                } else {
                    (
                        hash_res.sha256_hash.clone(),
                        false,
                        "Integrity Check Failed".to_string(),
                        format!(
                            "CRITICAL INTEGRITY FAILURE: Stored file hash '{}' does NOT match registered reference hash '{}'. Possible file corruption or unauthorized tampering detected.",
                            hash_res.sha256_hash, expected_hash
                        ),
                        Some("Bitstream disparity between reference and physical storage.".to_string())
                    )
                }
            }
            Err(e) => (
                "".to_string(),
                false,
                "Verification Error".to_string(),
                format!("Failed to read and hash evidence file from vault: {}", e),
                Some(e),
            ),
        };

    conn.execute(
        "INSERT INTO verification_records (
            id, evidence_id, verifier_identity, expected_hash, calculated_hash,
            on_chain_commitment, result, details, timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            verif_id,
            evidence_id,
            current_user.display_name,
            expected_hash,
            calculated_hash,
            on_chain_commitment,
            status,
            details,
            now
        ],
    ).map_err(|e| format!("Failed to record verification result: {}", e))?;

    let cust_event_type = if is_match {
        "Evidence Verified"
    } else {
        "Integrity Check Failed"
    };

    let cust_id = format!("CUST-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    conn.execute(
        "INSERT INTO custody_events (
            id, evidence_id, actor_identity, event_type, timestamp, context
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            cust_id,
            evidence_id,
            current_user.display_name,
            cust_event_type,
            now,
            details
        ],
    ).map_err(|e| format!("Failed to append custody event: {}", e))?;

    let audit_id = format!("AUD-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    conn.execute(
        "INSERT INTO audit_logs (id, actor_identity, action, entity_type, entity_id, details, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            audit_id,
            current_user.display_name,
            "VERIFY_EVIDENCE",
            "Evidence",
            evidence_id,
            format!("Verification outcome: {}. Calculated: {}", status, calculated_hash),
            now
        ],
    ).map_err(|e| format!("Failed to record audit log: {}", e))?;

    Ok(VerifyEvidenceResult {
        verification_id: verif_id,
        evidence_id,
        status,
        expected_hash,
        calculated_hash,
        is_match,
        on_chain_commitment,
        timestamp: now,
        details,
        discrepancy_reason,
    })
}

#[tauri::command]
pub fn simulate_tamper_for_testing(
    state: State<'_, AppState>,
    evidence_id: String,
) -> Result<String, String> {
    let conn = state.db.conn.lock().unwrap();
    let stored_rel_path: String = conn
        .query_row(
            "SELECT stored_rel_path FROM evidence WHERE id = ?1",
            params![evidence_id],
            |r| r.get(0),
        )
        .map_err(|e| format!("Evidence not found: {}", e))?;

    let file_path = state.vault.resolve_path(&stored_rel_path)?;

    
    if let Ok(metadata) = std::fs::metadata(&file_path) {
        let mut permissions = metadata.permissions();
        #[allow(clippy::permissions_set_readonly_modify)]
        permissions.set_readonly(false);
        let _ = std::fs::set_permissions(&file_path, permissions);
    }

    use std::io::{Seek, SeekFrom, Write};
    let mut file = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .open(&file_path)
        .map_err(|e| format!("Failed to open file: {}", e))?;

    
    file.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
    file.write_all(b"[TAMPERED]").map_err(|e| e.to_string())?;

    
    if let Ok(metadata) = std::fs::metadata(&file_path) {
        let mut permissions = metadata.permissions();
        #[allow(clippy::permissions_set_readonly_modify)]
        permissions.set_readonly(true);
        let _ = std::fs::set_permissions(&file_path, permissions);
    }

    Ok("Demonstration tamper injected: bytes at start of file were modified. Run verification now to observe immediate failure detection.".to_string())
}





#[tauri::command]
pub fn get_cases(state: State<'_, AppState>) -> Result<Vec<CaseModel>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.title, c.description, c.status, c.lead_investigator,
                    c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) as evidence_count
             FROM cases c ORDER BY c.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(CaseModel {
                id: r.get(0)?,
                title: r.get(1)?,
                description: r.get(2)?,
                status: r.get(3)?,
                lead_investigator: r.get(4)?,
                created_at: r.get(5)?,
                updated_at: r.get(6)?,
                evidence_count: r.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn create_case(
    state: State<'_, AppState>,
    id: String,
    title: String,
    description: String,
    lead_investigator: String,
) -> Result<CaseModel, String> {
    let role = state.session.get_role()?;
    if !role.can_manage_cases() {
        return Err("Access Denied: Current user role cannot create cases.".to_string());
    }

    let conn = state.db.conn.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO cases (id, title, description, status, lead_investigator, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'Active', ?4, ?5, ?6)",
        params![id, title, description, lead_investigator, now, now],
    )
    .map_err(|e| format!("Failed to create case: {}", e))?;

    let current_user = state.session.get_current_user().unwrap();
    let audit_id = format!("AUD-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    let _ = conn.execute(
        "INSERT INTO audit_logs (id, actor_identity, action, entity_type, entity_id, details, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            audit_id,
            current_user.display_name,
            "CREATE_CASE",
            "Case",
            id,
            format!("Case '{}' created by {}.", title, lead_investigator),
            now
        ],
    );

    Ok(CaseModel {
        id,
        title,
        description,
        status: "Active".to_string(),
        lead_investigator,
        created_at: now.clone(),
        updated_at: now,
        evidence_count: 0,
    })
}





#[tauri::command]
pub fn get_custody_events(
    state: State<'_, AppState>,
    evidence_id: Option<String>,
) -> Result<Vec<CustodyEventModel>, String> {
    let conn = state.db.conn.lock().unwrap();
    let query = if let Some(ref _id) = evidence_id {
        "SELECT id, evidence_id, actor_identity, event_type, timestamp, context, previous_custody_ref, tx_ref, anchored_on_chain
         FROM custody_events WHERE evidence_id = ?1 ORDER BY timestamp ASC"
    } else {
        "SELECT id, evidence_id, actor_identity, event_type, timestamp, context, previous_custody_ref, tx_ref, anchored_on_chain
         FROM custody_events ORDER BY timestamp DESC"
    };

    let mut list = Vec::new();
    if let Some(id) = evidence_id {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![id], |r| {
            Ok(CustodyEventModel {
                id: r.get(0)?,
                evidence_id: r.get(1)?,
                actor_identity: r.get(2)?,
                event_type: r.get(3)?,
                timestamp: r.get(4)?,
                context: r.get(5)?,
                previous_custody_ref: r.get(6)?,
                tx_ref: r.get(7)?,
                anchored_on_chain: r.get::<_, i64>(8)? != 0,
            })
        }).map_err(|e| e.to_string())?;

        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |r| {
            Ok(CustodyEventModel {
                id: r.get(0)?,
                evidence_id: r.get(1)?,
                actor_identity: r.get(2)?,
                event_type: r.get(3)?,
                timestamp: r.get(4)?,
                context: r.get(5)?,
                previous_custody_ref: r.get(6)?,
                tx_ref: r.get(7)?,
                anchored_on_chain: r.get::<_, i64>(8)? != 0,
            })
        }).map_err(|e| e.to_string())?;

        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn add_custody_event(
    state: State<'_, AppState>,
    evidence_id: String,
    event_type: String,
    context: String,
    previous_custody_ref: Option<String>,
) -> Result<CustodyEventModel, String> {
    let current_user = state.session.get_current_user().unwrap();
    let conn = state.db.conn.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let event_id = format!("CUST-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());

    conn.execute(
        "INSERT INTO custody_events (
            id, evidence_id, actor_identity, event_type, timestamp, context, previous_custody_ref
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            event_id,
            evidence_id,
            current_user.display_name,
            event_type,
            now,
            context,
            previous_custody_ref
        ],
    ).map_err(|e| format!("Failed to record custody event: {}", e))?;

    Ok(CustodyEventModel {
        id: event_id,
        evidence_id,
        actor_identity: current_user.display_name,
        event_type,
        timestamp: now,
        context,
        previous_custody_ref,
        tx_ref: None,
        anchored_on_chain: false,
    })
}





#[tauri::command]
pub fn get_verification_records(
    state: State<'_, AppState>,
    evidence_id: Option<String>,
) -> Result<Vec<VerificationRecordModel>, String> {
    let conn = state.db.conn.lock().unwrap();
    let query = if evidence_id.is_some() {
        "SELECT id, evidence_id, verifier_identity, expected_hash, calculated_hash, on_chain_commitment, result, details, timestamp
         FROM verification_records WHERE evidence_id = ?1 ORDER BY timestamp DESC"
    } else {
        "SELECT id, evidence_id, verifier_identity, expected_hash, calculated_hash, on_chain_commitment, result, details, timestamp
         FROM verification_records ORDER BY timestamp DESC"
    };

    let mut list = Vec::new();
    if let Some(id) = evidence_id {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt.query_map(params![id], |r| {
            Ok(VerificationRecordModel {
                id: r.get(0)?,
                evidence_id: r.get(1)?,
                verifier_identity: r.get(2)?,
                expected_hash: r.get(3)?,
                calculated_hash: r.get(4)?,
                on_chain_commitment: r.get(5)?,
                result: r.get(6)?,
                details: r.get(7)?,
                timestamp: r.get(8)?,
            })
        }).map_err(|e| e.to_string())?;

        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
    } else {
        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |r| {
            Ok(VerificationRecordModel {
                id: r.get(0)?,
                evidence_id: r.get(1)?,
                verifier_identity: r.get(2)?,
                expected_hash: r.get(3)?,
                calculated_hash: r.get(4)?,
                on_chain_commitment: r.get(5)?,
                result: r.get(6)?,
                details: r.get(7)?,
                timestamp: r.get(8)?,
            })
        }).map_err(|e| e.to_string())?;

        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
    }
    Ok(list)
}


#[tauri::command]
pub fn get_blockchain_queue(state: State<'_, AppState>) -> Result<Vec<BlockchainQueueModel>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, evidence_id, operation_type, payload, status, tx_hash, attempts, last_error, created_at, updated_at
             FROM blockchain_queue ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(BlockchainQueueModel {
                id: r.get(0)?,
                evidence_id: r.get(1)?,
                operation_type: r.get(2)?,
                payload: r.get(3)?,
                status: r.get(4)?,
                tx_hash: r.get(5)?,
                attempts: r.get(6)?,
                last_error: r.get(7)?,
                created_at: r.get(8)?,
                updated_at: r.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn update_blockchain_registration_result(
    state: State<'_, AppState>,
    queue_id: String,
    evidence_id: String,
    status: String,
    tx_hash: Option<String>,
    block_number: Option<i64>,
    network_id: Option<String>,
    contract_address: Option<String>,
    error_message: Option<String>,
) -> Result<(), String> {
    let conn = state.db.conn.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE blockchain_queue
         SET status = ?1, tx_hash = ?2, last_error = ?3, attempts = attempts + 1, updated_at = ?4
         WHERE id = ?5 OR (evidence_id = ?6 AND status = 'Pending')",
        params![status, tx_hash, error_message, now, queue_id, evidence_id],
    )
    .map_err(|e| format!("Failed to update queue record: {}", e))?;

    let ev_status = match status.as_str() {
        "Confirmed" => "Registered On-Chain",
        "Submitted" => "Registration Submitted",
        "Failed" => "Registration Failed",
        _ => "Pending Registration",
    };

    conn.execute(
        "UPDATE evidence
         SET registration_status = ?1, tx_hash = ?2, block_number = ?3, network_id = ?4, contract_address = ?5, updated_at = ?6
         WHERE id = ?7",
        params![ev_status, tx_hash, block_number, network_id, contract_address, now, evidence_id],
    )
    .map_err(|e| format!("Failed to update evidence record: {}", e))?;

    let current_user = state.session.get_current_user().unwrap();
    let (event_type, context) = if status == "Confirmed" {
        (
            "Blockchain Registration Confirmed",
            format!("Anchored on EVM network. TxHash: {:?}, Block: {:?}", tx_hash, block_number),
        )
    } else if status == "Failed" {
        (
            "Blockchain Registration Failed",
            format!("Transaction submission or confirmation failed: {:?}", error_message),
        )
    } else {
        (
            "Blockchain Registration Submitted",
            format!("Transaction submitted to network. Awaiting receipt verification: {:?}", tx_hash),
        )
    };

    let cust_id = format!("CUST-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    let _ = conn.execute(
        "INSERT INTO custody_events (
            id, evidence_id, actor_identity, event_type, timestamp, context, tx_ref, anchored_on_chain
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            cust_id,
            evidence_id,
            current_user.display_name,
            event_type,
            now,
            context,
            tx_hash,
            if status == "Confirmed" { 1 } else { 0 }
        ],
    );

    Ok(())
}


#[tauri::command]
pub fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStatsModel, String> {
    let conn = state.db.conn.lock().unwrap();

    let total_evidence: i64 = conn
        .query_row("SELECT COUNT(*) FROM evidence", [], |r| r.get(0))
        .unwrap_or(0);

    let local_only: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM evidence WHERE registration_status = 'Local Only'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let registered_on_chain: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM evidence WHERE registration_status = 'Registered On-Chain'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let pending_registration: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM evidence WHERE registration_status IN ('Pending Registration', 'Registration Submitted')",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let failed_integrity_checks: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM verification_records WHERE result = 'Integrity Check Failed'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let active_cases: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM cases WHERE status = 'Active'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let total_custody_events: i64 = conn
        .query_row("SELECT COUNT(*) FROM custody_events", [], |r| r.get(0))
        .unwrap_or(0);

    Ok(DashboardStatsModel {
        total_evidence,
        local_only,
        registered_on_chain,
        pending_registration,
        failed_integrity_checks,
        active_cases,
        total_custody_events,
    })
}

#[tauri::command]
pub fn get_audit_logs(state: State<'_, AppState>) -> Result<Vec<AuditLogModel>, String> {
    let role = state.session.get_role()?;
    if !role.can_view_audit_logs() {
        return Err("Access Denied: Current user role cannot view audit trail.".to_string());
    }

    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, actor_identity, action, entity_type, entity_id, details, timestamp
             FROM audit_logs ORDER BY timestamp DESC LIMIT 200",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(AuditLogModel {
                id: r.get(0)?,
                actor_identity: r.get(1)?,
                action: r.get(2)?,
                entity_type: r.get(3)?,
                entity_id: r.get(4)?,
                details: r.get(5)?,
                timestamp: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}


#[tauri::command]
pub fn get_app_settings(state: State<'_, AppState>) -> Result<std::collections::HashMap<String, String>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT key, value FROM app_settings")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;

    let mut map = std::collections::HashMap::new();
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

#[tauri::command]
pub fn update_app_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let role = state.session.get_role()?;
    if !role.can_modify_settings() {
        return Err("Access Denied: Administrator role required to update application settings.".to_string());
    }

    let conn = state.db.conn.lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| format!("Failed to update setting: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_current_user(state: State<'_, AppState>) -> Option<AuthUser> {
    state.session.get_current_user()
}

#[tauri::command]
pub fn switch_active_role(state: State<'_, AppState>, role_name: String) -> Result<AuthUser, String> {
    let valid_role = UserRole::from_str(&role_name).ok_or_else(|| "Invalid role name".to_string())?;
    let (id, username, display_name) = match valid_role {
        UserRole::Administrator => ("USR-001", "admin", "System Administrator"),
        UserRole::Investigator => ("USR-002", "investigator", "Senior Investigator Chen"),
        UserRole::Verifier => ("USR-003", "verifier", "Forensic Verifier Vance"),
        UserRole::Auditor => ("USR-004", "auditor", "Compliance Auditor Adams"),
    };

    let user = AuthUser {
        id: id.to_string(),
        username: username.to_string(),
        display_name: display_name.to_string(),
        role: role_name,
    };
    state.session.set_current_user(user.clone());
    Ok(user)
}
