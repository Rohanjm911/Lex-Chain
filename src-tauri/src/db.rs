use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct Database {
    pub conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    0,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;
        }

        let conn = Connection::open(&db_path)?;
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_tables()?;
        db.seed_defaults()?;
        Ok(db)
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_tables()?;
        db.seed_defaults()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cases (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                lead_investigator TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_type TEXT NOT NULL,
                sha256_hash TEXT NOT NULL,
                stored_rel_path TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                acquisition_date TEXT NOT NULL,
                collector_identity TEXT NOT NULL,
                acquisition_notes TEXT NOT NULL,
                registration_status TEXT NOT NULL,
                on_chain_commitment TEXT,
                tx_hash TEXT,
                block_number INTEGER,
                network_id TEXT,
                contract_address TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (case_id) REFERENCES cases(id)
            );

            CREATE TABLE IF NOT EXISTS custody_events (
                id TEXT PRIMARY KEY,
                evidence_id TEXT NOT NULL,
                actor_identity TEXT NOT NULL,
                event_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                context TEXT NOT NULL,
                previous_custody_ref TEXT,
                tx_ref TEXT,
                anchored_on_chain INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (evidence_id) REFERENCES evidence(id)
            );

            CREATE TABLE IF NOT EXISTS verification_records (
                id TEXT PRIMARY KEY,
                evidence_id TEXT NOT NULL,
                verifier_identity TEXT NOT NULL,
                expected_hash TEXT NOT NULL,
                calculated_hash TEXT NOT NULL,
                on_chain_commitment TEXT,
                result TEXT NOT NULL,
                details TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (evidence_id) REFERENCES evidence(id)
            );

            CREATE TABLE IF NOT EXISTS blockchain_queue (
                id TEXT PRIMARY KEY,
                evidence_id TEXT NOT NULL,
                operation_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT NOT NULL,
                tx_hash TEXT,
                attempts INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                actor_identity TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                details TEXT NOT NULL,
                timestamp TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            ",
        )?;
        Ok(())
    }

    fn seed_defaults(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))?;
        if count == 0 {
            
            
            let default_users = [
                ("USR-001", "admin", "System Administrator", "Administrator", "admin123", "2026-10-17T00:00:00Z"),
                ("USR-002", "investigator", "Senior Investigator Chen", "Investigator", "invest123", "2026-10-17T00:00:00Z"),
                ("USR-003", "verifier", "Forensic Verifier Vance", "Verifier", "verify123", "2026-10-17T00:00:00Z"),
                ("USR-004", "auditor", "Compliance Auditor Adams", "Auditor", "audit123", "2026-10-17T00:00:00Z"),
            ];

            for (id, username, display_name, role, password, created_at) in default_users {
                
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                hasher.update(password.as_bytes());
                let pw_hash = hex::encode(hasher.finalize());

                conn.execute(
                    "INSERT INTO users (id, username, display_name, role, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![id, username, display_name, role, pw_hash, created_at],
                )?;
            }
        }

        
        let case_count: i64 = conn.query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))?;
        if case_count == 0 {
            conn.execute(
                "INSERT INTO cases (id, title, description, status, lead_investigator, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "CASE-2026-001",
                    "Operation Citadel Financial Intrusion",
                    "Digital forensic examination of compromised ledger systems and exfiltrated authorization tokens.",
                    "Active",
                    "Senior Investigator Chen",
                    "2026-10-17T08:00:00Z",
                    "2026-10-17T08:00:00Z"
                ],
            )?;

            
            conn.execute(
                "INSERT INTO audit_logs (id, actor_identity, action, entity_type, entity_id, details, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    "AUD-0001",
                    "System Initializer",
                    "INITIALIZE_DATABASE",
                    "System",
                    "LOCAL_DB",
                    "Database schema migrated and baseline operational accounts initialized.",
                    "2026-10-17T08:00:00Z"
                ],
            )?;
        }

        
        let settings = [
            ("rpc_url", "http://127.0.0.1:8545"),
            ("chain_id", "31337"),
            ("network_name", "Hardhat Local EVM"),
            ("contract_address", ""),
            ("auto_anchor", "true"),
        ];

        for (k, v) in settings {
            conn.execute(
                "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?1, ?2)",
                params![k, v],
            )?;
        }

        Ok(())
    }
}
