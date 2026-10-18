use std::fs::{self, File};
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};

use crate::hashing::calculate_stream_sha256;

#[derive(Debug, Clone)]
pub struct VaultManager {
    pub base_path: PathBuf,
}

impl VaultManager {
    
    
    pub fn init_default() -> Result<Self, String> {
        let base_path = if let Some(doc_dir) = dirs::document_dir() {
            doc_dir.join("LexChain_Vault")
        } else if let Some(data_dir) = dirs::data_local_dir() {
            data_dir.join("LexChain").join("Vault")
        } else {
            PathBuf::from("D:/LexChain_Vault")
        };

        let manager = VaultManager { base_path };
        manager.ensure_directories()?;
        Ok(manager)
    }

    pub fn with_path<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let manager = VaultManager {
            base_path: path.as_ref().to_path_buf(),
        };
        manager.ensure_directories()?;
        Ok(manager)
    }

    fn ensure_directories(&self) -> Result<(), String> {
        let files_dir = self.base_path.join("files");
        let exports_dir = self.base_path.join("exports");
        fs::create_dir_all(&files_dir).map_err(|e| format!("Failed to create vault directory: {}", e))?;
        fs::create_dir_all(&exports_dir).map_err(|e| format!("Failed to create exports directory: {}", e))?;
        Ok(())
    }

    
    pub fn sanitize_filename(name: &str) -> String {
        let clean: String = name
            .replace("..", "__")
            .chars()
            .map(|c| match c {
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' | '\0' => '_',
                c if c.is_control() => '_',
                c => c,
            })
            .collect();

        let trimmed = clean.trim().trim_matches('.');
        if trimmed.is_empty() {
            "unnamed_evidence.bin".to_string()
        } else {
            
            let stem = Path::new(&trimmed)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(trimmed);
            let upper_stem = stem.to_uppercase();
            if ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "LPT1"].contains(&upper_stem.as_str()) {
                format!("{}_evidence.bin", trimmed)
            } else {
                trimmed.to_string()
            }
        }
    }

    
    
    pub fn preserve_evidence<P: AsRef<Path>>(
        &self,
        source_path: P,
        evidence_id: &str,
        expected_hash: &str,
    ) -> Result<String, String> {
        let source = source_path.as_ref();
        if !source.exists() || !source.is_file() {
            return Err("Original evidence file does not exist or is not a regular file.".to_string());
        }

        let raw_filename = source
            .file_name()
            .map(|s| s.to_string_lossy().into_owned())
            .unwrap_or_else(|| "evidence_file.bin".to_string());

        let safe_filename = Self::sanitize_filename(&raw_filename);
        let safe_evidence_id = Self::sanitize_filename(evidence_id);

        let dest_dir = self.base_path.join("files").join(&safe_evidence_id);
        fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create evidence vault directory: {}", e))?;

        let dest_file_path = dest_dir.join(&safe_filename);

        
        if dest_file_path.exists() {
            return Err(format!(
                "An evidence file already exists for ID {} at destination. Overwrites are forbidden.",
                evidence_id
            ));
        }

        
        {
            let src_file = File::open(source).map_err(|e| format!("Failed to open source file: {}", e))?;
            let mut reader = BufReader::with_capacity(64 * 1024, src_file);

            let dst_file = File::create(&dest_file_path).map_err(|e| format!("Failed to create destination vault file: {}", e))?;
            let mut writer = BufWriter::with_capacity(64 * 1024, dst_file);

            let mut buffer = [0u8; 64 * 1024];
            loop {
                let n = reader.read(&mut buffer).map_err(|e| format!("Error copying evidence: {}", e))?;
                if n == 0 {
                    break;
                }
                writer.write_all(&buffer[..n]).map_err(|e| format!("Error writing to vault: {}", e))?;
            }
            writer.flush().map_err(|e| format!("Error flushing vault write: {}", e))?;
        }

        
        let copied_hash_result = calculate_stream_sha256(&dest_file_path)?;
        if copied_hash_result.sha256_hash.to_lowercase() != expected_hash.to_lowercase() {
            
            let _ = fs::remove_file(&dest_file_path);
            return Err(format!(
                "Integrity validation failed after storage copy! Expected hash {} but calculated {}. Corrupt copy removed.",
                expected_hash, copied_hash_result.sha256_hash
            ));
        }

        
        if let Ok(metadata) = fs::metadata(&dest_file_path) {
            let mut permissions = metadata.permissions();
            #[allow(clippy::permissions_set_readonly_modify)]
            permissions.set_readonly(true);
            let _ = fs::set_permissions(&dest_file_path, permissions);
        }

        
        let rel_path = format!("files/{}/{}", safe_evidence_id, safe_filename);
        Ok(rel_path)
    }

    
    pub fn resolve_path(&self, rel_path: &str) -> Result<PathBuf, String> {
        
        if rel_path.contains("..") {
            return Err("Path traversal detected in relative path".to_string());
        }
        let full_path = self.base_path.join(rel_path);
        if !full_path.exists() {
            return Err(format!("Preserved evidence file not found at path: {:?}", full_path));
        }
        Ok(full_path)
    }
}
