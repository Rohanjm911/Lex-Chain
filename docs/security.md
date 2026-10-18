# LexChain: Security Architecture & Threat Model

## 1. Threat Model & Adversarial Analysis

Digital evidence integrity systems face active adversarial threats from both internal and external threat actors. LexChain was engineered around a defense-in-depth security model to withstand sophisticated tampering and repudiation scenarios.

```
+-------------------------------------------------------------------------------+
|                               THREAT ACTORS                                   |
|                                                                               |
|  [ Rogue System Admin ]  [ Corrupt Investigator ]  [ External Cyber Intruder ]|
+-------------------------------------------------------------------------------+
         |                           |                             |
         v                           v                             v
+-----------------+         +-----------------+          +--------------------+
| SQLite DB Edit  |         | File Bit Tamper |          | MITM / RPC Spoof   |
| (Change hash)   |         | (Modify bytes)  |          | (Fake confirmations|
+-----------------+         +-----------------+          +--------------------+
         |                           |                             |
         x BLOCKED                   x BLOCKED                     x BLOCKED
         |                           |                             |
         v                           v                             v
+-----------------+         +-----------------+          +--------------------+
| Fails EVM Hash  |         | Fails Streaming |          | EVM Receipt Check  |
| Parity Check    |         | Re-hash Check   |          | & Tx Hash Mining   |
+-----------------+         +-----------------+          +--------------------+
```

### 1.1 Threat Scenarios & Mitigations

| Threat Vector | Attack Mechanism | LexChain Mitigation |
|---|---|---|
| **Rogue Administrator / Insider Threat** | An administrator opens `lexchain.db` with a SQLite editor and replaces an incriminating file hash or deletes a custody event. | **EVM Ledger Anchoring**: The true SHA-256 hash was permanently committed to `EvidenceRegistry.sol` on the blockchain. When verified, the local database hash fails the On-Chain Parity Check. |
| **Silent Bit Rot or File Modification** | An OS process, disk sector degradation, or user modifies an evidence file located inside the evidence vault directory. | **Pre-Verification Recalculation**: LexChain never relies on cached hashes. Verification always streams the entire file live from disk. Any byte variance flips the status to `INTEGRITY_VIOLATION`. |
| **Path Traversal & Overwrite Attack** | An attacker uploads a file named `../../Windows/System32/evil.dll` to escape the vault and overwrite operating system files. | **Strict Path Sanitization**: `src-tauri/src/vault.rs` strips all directory separators (`/`, `\`), checks for `..`, and asserts that the canonicalized target path begins strictly with the authoritative vault root. |
| **Concurrent Acquisition Tampering** | An attacker alters the content of an evidence file while the hashing engine is actively reading it into memory. | **Pre/Post File Metadata Assertion**: LexChain captures file size and modified timestamps immediately before and after the 64KB streaming read. Any discrepancy aborts the process immediately. |
| **Cross-Protocol Collision / Replay** | An attacker attempts to reuse an existing SHA-256 hash across different cases or file names. | **Domain-Separated Commitment**: Uses the domain prefix `LEXCHAIN:EV1:` combined with case ID, filename, file size, and file hash to ensure single-context uniqueness. |
| **RPC Network Interception / MITM** | Attacker intercepts JSON-RPC HTTP calls to spoof successful blockchain anchoring. | **Receipt & Event Verification**: The system verifies the mined transaction receipt, checks the transaction status (`1` for success), and asserts that the emitted `EvidenceRegistered` log matches the payload. |

---

## 2. Memory Safety & Native Execution Guarantees

LexChain’s backend is implemented in **Rust 2021 Edition**:
- **Zero Raw Pointers in Business Logic**: No manual memory management (`malloc`/`free`) or unsafe C pointer arithmetic is permitted in the application code.
- **Buffer Overflow Elimination**: File streaming utilizes fixed 64KB stack/heap slices bounded by safe Rust iterator mechanics (`std::io::Read`).
- **Data Race Freedom**: Concurrency across background tasks and the UI thread is guaranteed safe by Rust’s compile-time borrow checker and `Send + Sync` invariants.
- **Embedded C Security**: The SQLite engine is compiled from tested source code via the official `rusqlite` bundled distribution, isolated behind Rust's typed wrappers.

---

## 3. Filesystem Security & Vault Isolation

The evidence repository is managed according to strict forensic isolation rules:

1. **Storage Isolation**:
   - The vault directory is located at `%USERPROFILE%\Documents\LexChain_Vault` (or an investigator-configured dedicated physical drive).
   - It is completely outside the application binary path, preventing accidental deletion during software updates or uninstallation.

2. **Defense Against Traversal (Whitebox Implementation)**:
   ```rust
   // Enforces strictly alphanumeric, safe characters for case and evidence IDs
   pub fn sanitize_component(input: &str) -> Result<String, VaultError> {
       if input.is_empty() || input.contains("..") || input.contains('/') || input.contains('\\') {
           return Err(VaultError::InvalidPath(format!("Illegal path component: {}", input)));
       }
       // ...
   }
   ```

3. **Post-Copy Bit-Level Hash Assertion**:
   Before an evidence record is committed to the local database:
   ```
   Source File  ---> [ Streaming SHA-256 ] ---> Hash A
   Target File  ---> [ Streaming SHA-256 ] ---> Hash B
   Assert: Hash A == Hash B (if false -> delete Target File, raise VaultError)
   ```

4. **Windows Read-Only Protection**:
   Files copied into the vault have their Windows `readonly` metadata flag enabled, alerting the OS to reject accidental modification or in-place deletion attempts by non-elevated processes.

---

## 4. Role-Based Access Control (RBAC) Architecture

LexChain enforces strict forensic separation of duties across four operational roles:

```
              [ User Session ]
                     |
                     v
             +---------------+
             | Active Role   |
             +---------------+
              /      |      \
             v       v       v
      [Admin]   [Investigator]  [Verifier / Auditor]
         |           |                  |
    Full Control  Intake/Transfer    Verify Only
```

### 4.1 Permission Matrix (`src-tauri/src/auth.rs`)

| Operation | Administrator | Investigator | Verifier | Auditor |
|---|:---:|:---:|:---:|:---:|
| `case:create` | Yes | Yes | No | No |
| `case:update` | Yes | Yes | No | No |
| `evidence:import` | Yes | Yes | No | No |
| `evidence:view` | Yes | Yes | Yes | Yes |
| `evidence:verify` | Yes | Yes | Yes | Yes |
| `custody:transfer` | Yes | Yes | No | No |
| `audit:view` | Yes | No | No | Yes |
| `settings:manage` | Yes | No | No | No |
| `tamper:simulate` | Yes | No | Yes | No |

### 4.2 Native Enforcement Gatekeeper
Role checks are enforced directly in native Rust commands before any database or filesystem operation executes. Frontend UI permission hides unauthorized buttons for user experience, but the **Rust native backend remains the authoritative gatekeeper**.

---

## 5. Key Management & Blockchain Trust Boundaries

1. **Cryptographic Signer**:
   - In production environments, transaction signing is performed using hardware security modules (HSM), smart cards, or encrypted local keyrings (e.g., Windows DPAPI / Credential Guard).
   - Private keys are never logged, never transmitted over IPC in plaintext, and never stored in unencrypted SQLite tables.

2. **Immutable Blockchain Contract**:
   - `EvidenceRegistry.sol` contains no backdoor transfer or owner-drain functions.
   - Once an evidence hash is registered, it cannot be modified or deleted by anyone, including the contract owner.
   - Registrars can only append new evidence or log custody transitions.
