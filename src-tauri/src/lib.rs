pub mod auth;
pub mod commands;
pub mod db;
pub mod hashing;
pub mod models;
pub mod vault;

use std::path::PathBuf;
use std::sync::Arc;

use auth::SessionManager;
use commands::*;
use db::Database;
use vault::VaultManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    
    let db_path = if let Some(local_dir) = dirs::data_local_dir() {
        local_dir.join("LexChain").join("lexchain.db")
    } else {
        PathBuf::from("lexchain.db")
    };

    let database = Database::new(db_path).expect("Failed to initialize local SQLite database");
    let vault = VaultManager::init_default().expect("Failed to initialize evidence vault directory");
    let session = SessionManager::new();

    let app_state = AppState {
        db: Arc::new(database),
        vault: Arc::new(vault),
        session: Arc::new(session),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            calculate_file_hash,
            get_vault_path,
            register_evidence,
            get_evidence_list,
            get_evidence_details,
            verify_evidence,
            simulate_tamper_for_testing,
            get_cases,
            create_case,
            get_custody_events,
            add_custody_event,
            get_verification_records,
            get_blockchain_queue,
            update_blockchain_registration_result,
            get_dashboard_stats,
            get_audit_logs,
            get_app_settings,
            update_app_setting,
            get_current_user,
            switch_active_role
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use auth::UserRole;
    use hashing::{calculate_stream_sha256, compute_evidence_commitment};
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn test_sha256_streaming_known_vector() {
        let temp_dir = std::env::temp_dir().join(format!("lexchain_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp_dir).unwrap();
        let file_path = temp_dir.join("sample.txt");

        
        {
            let mut f = File::create(&file_path).unwrap();
            f.write_all(b"The quick brown fox jumps over the lazy dog").unwrap();
        }

        let res = calculate_stream_sha256(&file_path).expect("Hashing should succeed");
        assert_eq!(
            res.sha256_hash.to_lowercase(),
            "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
        );
        assert_eq!(res.file_size, 43);
        assert_eq!(res.file_name, "sample.txt");
        assert_eq!(res.file_extension, "txt");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_domain_separated_commitment() {
        let c1 = compute_evidence_commitment("EVD-001", "abc123hash", "CASE-001");
        let c2 = compute_evidence_commitment("EVD-001", "abc123hash", "CASE-001");
        let c3 = compute_evidence_commitment("EVD-002", "abc123hash", "CASE-001");

        assert_eq!(c1, c2);
        assert_ne!(c1, c3);
        assert_eq!(c1.len(), 64);
    }

    #[test]
    fn test_vault_path_sanitization() {
        assert_eq!(
            VaultManager::sanitize_filename("../../etc/passwd"),
            "______etc_passwd"
        );
        assert_eq!(
            VaultManager::sanitize_filename("valid_image.png"),
            "valid_image.png"
        );
        assert_eq!(
            VaultManager::sanitize_filename("CON.txt"),
            "CON.txt_evidence.bin"
        );
    }

    #[test]
    fn test_database_foreign_key_and_integrity() {
        let db = Database::new_in_memory().expect("In-memory DB should initialize");
        let conn = db.conn.lock().unwrap();

        let user_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |r| r.get(0))
            .unwrap();
        assert_eq!(user_count, 4);

        let res = conn.execute(
            "INSERT INTO evidence (
                id, case_id, file_name, file_size, file_type, sha256_hash,
                stored_rel_path, description, category, acquisition_date,
                collector_identity, acquisition_notes, registration_status,
                on_chain_commitment, created_at, updated_at
            ) VALUES ('EVD-FAIL', 'NON_EXISTENT_CASE', 'test.bin', 10, 'bin', 'hash', 'path', 'desc', 'Other', 'now', 'col', 'notes', 'Local Only', 'comm', 'now', 'now')",
            [],
        );
        assert!(res.is_err());
    }

    #[test]
    fn test_tamper_detection_in_vault() {
        let temp_vault_dir = std::env::temp_dir().join(format!("lexchain_vault_test_{}", uuid::Uuid::new_v4()));
        let vault = VaultManager::with_path(&temp_vault_dir).unwrap();

        let source_dir = std::env::temp_dir().join(format!("lexchain_src_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&source_dir).unwrap();
        let src_file = source_dir.join("original.dat");
        {
            let mut f = File::create(&src_file).unwrap();
            f.write_all(b"Original untampered evidence data stream 2026").unwrap();
        }

        let orig_hash = calculate_stream_sha256(&src_file).unwrap().sha256_hash;

        let rel_path = vault
            .preserve_evidence(&src_file, "EVD-TEST-01", &orig_hash)
            .expect("Preservation must succeed");

        let full_stored_path = vault.resolve_path(&rel_path).unwrap();

        let check1 = calculate_stream_sha256(&full_stored_path).unwrap();
        assert_eq!(check1.sha256_hash, orig_hash);

        let mut perm = std::fs::metadata(&full_stored_path).unwrap().permissions();
        #[allow(clippy::permissions_set_readonly_modify)]
        perm.set_readonly(false);
        std::fs::set_permissions(&full_stored_path, perm).unwrap();

        {
            let mut f = std::fs::OpenOptions::new().write(true).open(&full_stored_path).unwrap();
            f.write_all(b"CORRUPTED").unwrap();
        }

        let check2 = calculate_stream_sha256(&full_stored_path).unwrap();
        assert_ne!(check2.sha256_hash, orig_hash);

        let _ = std::fs::remove_dir_all(&source_dir);
        let _ = std::fs::remove_dir_all(&temp_vault_dir);
    }

    #[test]
    fn test_role_based_permissions() {
        let admin = UserRole::Administrator;
        let investigator = UserRole::Investigator;
        let verifier = UserRole::Verifier;
        let auditor = UserRole::Auditor;

        assert!(admin.can_register_evidence());
        assert!(investigator.can_register_evidence());
        assert!(!verifier.can_register_evidence());
        assert!(!auditor.can_register_evidence());

        assert!(admin.can_verify_evidence());
        assert!(investigator.can_verify_evidence());
        assert!(verifier.can_verify_evidence());
        assert!(!auditor.can_verify_evidence());

        assert!(admin.can_modify_settings());
        assert!(!investigator.can_modify_settings());
        assert!(!verifier.can_modify_settings());
        assert!(!auditor.can_modify_settings());

        assert!(admin.can_view_audit_logs());
        assert!(!investigator.can_view_audit_logs());
        assert!(!verifier.can_view_audit_logs());
        assert!(auditor.can_view_audit_logs());
    }
}
