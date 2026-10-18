# LexChain: Automated Testing Strategy & Validation Matrix

## 1. Test Philosophy & Verification Hierarchy

In a digital forensics and legal evidence system, software correctness is a matter of evidentiary admissibility. A bug in hashing, path handling, or state synchronization could lead to evidence dismissal in judicial proceedings.

LexChain implements an end-to-end automated verification pyramid:

1. **Tier 1: Native Rust Backend Tests** (Cryptographic primitives, memory boundaries, path sanitization, database transactions, vault ACLs).
2. **Tier 2: EVM Smart Contract Tests** (Contract invariants, access control, state mutability, revert assertions, event logs).
3. **Tier 3: Frontend Workstation Tests** (Component rendering, navigation, role switching, user permission gates, parity matrix diagnostics).
4. **Tier 4: Unified Regression Runner** (`npm run test:all`).

---

## 2. Test Execution Quick Reference

| Test Suite                   | Subsystem               | Command                                                 | Execution Time |
| ---------------------------- | ----------------------- | ------------------------------------------------------- | :------------: |
| **Rust In-Crate Unit Tests** | Native Backend Core     | `cargo test --lib --manifest-path src-tauri/Cargo.toml` |     ~0.05s     |
| **Hardhat Contract Tests**   | Solidity Smart Contract | `cd blockchain && npx hardhat test`                     |     ~1.1s      |
| **Vitest Component Tests**   | React / TypeScript UI   | `npm test`                                              |     ~1.5s      |
| **All Test Suites**          | Full System Integration | `npm run test:all`                                      |     ~3.0s      |

---

## 3. Tier 1: Native Rust Backend Tests (`src-tauri/src/lib.rs`)

The Rust test suite executes in native compiled machine code and tests the core security guarantees:

### 3.1 Test Scenarios

```rust
#[cfg(test)]
mod tests {
    // 1. Streaming SHA-256 against NIST Test Vector
    // Validates that 64KB chunking produces the exact SHA-256 digest
    // matching the known test vector for "The quick brown fox jumps over the lazy dog"
    #[test]
    fn test_streaming_sha256_known_vector() { ... }

    // 2. Domain-Separated Commitment Determinism
    // Asserts that commitment generation is strictly reproducible
    // and sensitive to any metadata attribute variation
    #[test]
    fn test_evidence_commitment_determinism() { ... }

    // 3. Vault Path Traversal Defense
    // Validates that sanitize_component() rejects directory traversal attacks:
    // "../../../windows/system32", "foo/bar", "foo\bar", and null bytes
    #[test]
    fn test_vault_path_sanitization() { ... }

    // 4. SQLite Schema & Foreign Key Constraints
    // Verifies foreign key enforcement, default schema migrations,
    // and relational integrity in rusqlite
    #[test]
    fn test_database_foreign_keys_and_schema() { ... }

    // 5. Vault Tamper Detection & Post-Copy Verification
    // Verifies that modifying a single byte in a vaulted file causes
    // verify_evidence_file() to immediately return an integrity violation
    #[test]
    fn test_vault_tamper_detection() { ... }

    // 6. Role-Based Access Control (RBAC) Permitted Actions
    // Validates that each role can only execute authorized operations
    #[test]
    fn test_rbac_permissions() { ... }
}
```

### 3.2 Running the Rust Test Suite

```bash
cargo test --lib --manifest-path src-tauri/Cargo.toml
```

Expected output:

```text
running 6 tests
test tests::test_streaming_sha256_known_vector ... ok
test tests::test_evidence_commitment_determinism ... ok
test tests::test_vault_path_sanitization ... ok
test tests::test_database_foreign_keys_and_schema ... ok
test tests::test_vault_tamper_detection ... ok
test tests::test_rbac_permissions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s
```

---

## 4. Tier 2: EVM Smart Contract Tests (`blockchain/test/EvidenceRegistry.test.js`)

The smart contract test suite runs within the Hardhat EVM environment:

### 4.1 Test Scenarios

- **Deployment & Ownership**:
  - Sets deploying account as `owner`.
  - Grants `REGISTRAR_ROLE` to contract owner by default.
- **Evidence Registration (`registerEvidence`)**:
  - Successfully registers new evidence hash and commitment.
  - Emits `EvidenceRegistered` event with matching arguments.
  - Authoritative block timestamp is set.
- **Duplicate Prevention**:
  - Reverts with custom error `EvidenceAlreadyExists(fileHash)` when registering an existing hash.
- **Registrar Authorization**:
  - Non-registrar accounts cannot register evidence (reverts with `NotAuthorized()`).
  - Owner can authorize new registrars via `setRegistrar()`.
  - Revoked registrars are barred from future registrations.
- **Invalid Parameters**:
  - Reverts with `InvalidHash()` if `fileHash` is zero.
  - Reverts with `InvalidCommitment()` if `commitment` is zero.
- **Custody Event Logging (`logCustodyEvent`)**:
  - Successfully appends custody transition to evidence record.
  - Emits `CustodyEventLogged` event with correct metadata.
  - Reverts with `EvidenceNotFound(fileHash)` if evidence is not registered.
  - `getCustodyEvents()` returns the complete append-only history.
- **Verification Query (`verifyEvidence`)**:
  - Returns `(true, timestamp, registrar)` for valid hash and commitment.
  - Returns `(false, 0, address(0))` if commitment does not match or evidence does not exist.

### 4.2 Running the Smart Contract Test Suite

```bash
cd blockchain
npx hardhat test
```

Expected output:

```text
  EvidenceRegistry Smart Contract
    Deployment & Roles
      ✔ Should set deployer as owner
      ✔ Should authorize deployer as registrar by default
      ✔ Should allow owner to authorize and revoke registrars
    Evidence Registration
      ✔ Should register new evidence and emit EvidenceRegistered event
      ✔ Should revert with EvidenceAlreadyExists on duplicate registration
      ✔ Should revert with NotAuthorized if non-registrar attempts registration
      ✔ Should revert with InvalidHash if file hash is zero
      ✔ Should revert with InvalidCommitment if commitment is zero
    Custody Event Logging
      ✔ Should log custody event and emit CustodyEventLogged
      ✔ Should return all custody events in append-only array
      ✔ Should revert with EvidenceNotFound when logging custody for unknown evidence
    Evidence Verification Queries
      ✔ Should return valid for matching hash and commitment
      ✔ Should return invalid for mismatched commitment or nonexistent hash

  13 passing (1s)
```

---

## 5. Tier 3: Frontend Workstation Tests (`src/test/frontend.test.tsx`)

The React component test suite utilizes **Vitest** and **React Testing Library**:

### 5.1 Test Scenarios

- **DashboardView Live Metrics & Donut Chart Telemetry**:
  - Renders live database KPI metrics (42 evidence items, 28 registered on-chain, 1 failed integrity alert).
  - Validates dynamic SVG telemetry charts and legend slices across user roles.
- **Investigator Workstation & Dossiers**:
  - Renders Investigator specific action buttons (Acquire & Hash Evidence).
  - Displays ISO/IEC 27037 Crime Scene Intake Protocol.
  - Lists assigned case dossiers with milestone progress badges.
- **Verifier Cryptographic Parity Matrix**:
  - Renders Verifier specific dashboard with live 3-Way Parity Matrix Scanner.
  - Compares raw bitstream SHA-256 against local SQLite and EVM on-chain commitments.
- **Auditor Court Admissibility & FRE 901 Compliance**:
  - Displays Statutory FRE Rule 901 and ISO/IEC 27037 compliance rating.
  - Verifies unbroken Chain of Custody DAG continuity.
- **Sidebar & Navigation**:
  - Renders all primary navigation tabs (Dashboard, Evidence Vault, Import, Verify, Cases, Custody, Blockchain, Audit Logs, Settings).
  - Toggles active view on click and switches roles via dropdown.
- **Evidence Vault Table & Role Scope**:
  - Formats file sizes, SHA-256 hashes, timestamps, and case badges.
  - Dynamically adapts storage root or intake discipline based on active officer role.
- **Header Component**:
  - Displays EVM connected state when blockchain is reachable (Chain ID 31337, block number).
  - Displays Local-First offline banner when RPC node is unreachable.

### 5.2 Running the Frontend Test Suite

```bash
npm test
```

Expected output:

```text
 ✓ src/test/frontend.test.tsx (8 tests)
   ✓ DashboardView Component
     ✓ renders live database statistics correctly
     ✓ renders Investigator specific dashboard with active cases and intake protocols
     ✓ renders Verifier specific dashboard with 3-way parity matrix scanner
     ✓ renders Auditor specific dashboard with FRE 901 compliance and DAG continuity
   ✓ Sidebar Navigation & Role Switcher
     ✓ renders primary navigation items and allows role switching
   ✓ EvidenceVaultView Component
     ✓ filters evidence list based on search query and displays role parameters
   ✓ Header Component
     ✓ displays EVM connected state when blockchain is reachable
     ✓ displays Local-First offline banner when blockchain node is unreachable

 Test Files  1 passed (1)
      Tests  8 passed (8)
```

---

## 6. Unified Test Suite Execution (`npm run test:all`)

The root `package.json` includes a master test script:

```json
"scripts": {
  "test:all": "npm test && cd blockchain && npx hardhat test && cd .. && cargo test --lib --manifest-path src-tauri/Cargo.toml"
}
```

Running `npm run test:all` executes all 27 automated tests across all 3 layers (6 Rust + 13 Hardhat + 8 Vitest) in under 4 seconds.
