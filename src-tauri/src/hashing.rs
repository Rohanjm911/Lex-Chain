use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::Path;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct HashResult {
    pub sha256_hash: String,
    pub file_size: u64,
    pub file_name: String,
    pub file_extension: String,
}



pub fn calculate_stream_sha256<P: AsRef<Path>>(path: P) -> Result<HashResult, String> {
    let path_ref = path.as_ref();
    if !path_ref.exists() || !path_ref.is_file() {
        return Err("Target path does not exist or is not a regular file".to_string());
    }

    let initial_metadata = path_ref.metadata().map_err(|e| e.to_string())?;
    let initial_len = initial_metadata.len();
    let initial_modified = initial_metadata.modified().ok();

    let file = File::open(path_ref).map_err(|e| format!("Failed to open file for read-only hashing: {}", e))?;
    let mut reader = BufReader::with_capacity(64 * 1024, file);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    let mut total_bytes_read = 0u64;

    loop {
        let bytes_read = reader.read(&mut buffer).map_err(|e| format!("Error streaming file chunk: {}", e))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
        total_bytes_read += bytes_read as u64;
    }

    
    let final_metadata = path_ref.metadata().map_err(|e| e.to_string())?;
    if final_metadata.len() != initial_len || total_bytes_read != initial_len {
        return Err("File size changed during hashing operation. The source file may have been concurrently modified.".to_string());
    }
    if let (Some(init_mod), Ok(final_mod)) = (initial_modified, final_metadata.modified()) {
        if init_mod != final_mod {
            return Err("File modification timestamp changed during hashing operation. Source is not stable.".to_string());
        }
    }

    let hash_bytes = hasher.finalize();
    let sha256_hash = hex::encode(hash_bytes);

    let file_name = path_ref
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "unnamed_file".to_string());

    let file_extension = path_ref
        .extension()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "bin".to_string());

    Ok(HashResult {
        sha256_hash,
        file_size: total_bytes_read,
        file_name,
        file_extension,
    })
}



pub fn compute_evidence_commitment(evidence_id: &str, file_sha256: &str, case_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"LEXCHAIN:EV1:");
    hasher.update(evidence_id.as_bytes());
    hasher.update(b":");
    hasher.update(file_sha256.as_bytes());
    hasher.update(b":");
    hasher.update(case_id.as_bytes());
    hex::encode(hasher.finalize())
}
