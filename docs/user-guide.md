# LexChain: Forensic Investigator User Guide

## 1. Overview & Workstation Setup

LexChain is an enterprise desktop workstation designed for digital forensics specialists, law enforcement officers, and compliance auditors. It guarantees that digital evidence gathered during an investigation remains mathematically verifiable, cryptographically sealed, and legally admissible under strict chain of custody standards.

---

## 2. Investigator Workflow: Step-by-Step

### 2.1 Managing Investigative Cases
Every piece of digital evidence must belong to a formal case folder.

1. Navigate to **Cases** in the left navigation sidebar.
2. Click **New Case**.
3. Complete the case registration fields:
   - **Case Number**: e.g., `CAS-2026-001` (must be unique).
   - **Case Title**: Short descriptive title (e.g., *Operation BitProtect*).
   - **Description**: Summary of the incident, subpoena, or forensic warrant.
   - **Lead Investigator**: Designated primary investigating officer.
4. Click **Create Case**. The case is initialized in the local SQLite database.

---

### 2.2 Ingesting and Vaulting Digital Evidence
The **Import Evidence Wizard** executes the complete acquisition and hashing pipeline:

```
[ Step 1: Select File ] -> [ Step 2: Set Metadata ] -> [ Step 3: Compute & Vault ] -> [ Step 4: Anchor ]
```

1. Click **Import Evidence** in the top navigation or sidebar.
2. **File Selection**:
   - Click **Browse File** to trigger the native Windows explorer picker, or drop the target forensic artifact into the target dropzone.
   - The file size, source path, and file extension are read without loading the entire payload into RAM.
3. **Forensic Metadata**:
   - Assign the evidence to an existing case from the dropdown.
   - Select the **Evidence Type** (e.g., Disk Image, Memory Dump, Network Capture, Document, Video Recording).
   - Add detailed **Collector Notes** documenting seizure context, serial numbers, and physical chain details.
4. **Acquisition & Hashing**:
   - Click **Process & Secure to Vault**.
   - The native Rust backend initiates a 64KB chunked streaming SHA-256 calculation.
   - A domain-separated cryptographic commitment is generated:
     $$\text{Commitment} = \text{SHA-256}(\text{"LEXCHAIN:EV1:"} \mathbin{\Vert} \text{case\_id} \mathbin{\Vert} \dots)$$
   - The file is copied to `%USERPROFILE%\Documents\LexChain_Vault\<case_id>\`.
   - The destination file is re-hashed. If the hashes match, read-only permissions are enforced on the disk file.
5. **Blockchain Anchoring**:
   - LexChain automatically sends a transaction to `EvidenceRegistry.sol` via JSON-RPC.
   - Once mined, the transaction hash and block number are permanently linked to the evidence record.

---

### 2.3 Managing the Chain of Custody
Every time physical custody or analytical responsibility changes, a custody event must be logged:

1. Navigate to **Chain of Custody**.
2. Click **Transfer Custody**.
3. Select the evidence item to transfer.
4. Fill in:
   - **From Officer**: Current custodian.
   - **To Officer**: Receiving custodian or lab specialist.
   - **Destination Location**: e.g., *Forensic Lab Vault Room 4B*, *Courtroom Exhibits*.
   - **Reason**: e.g., *Subpoena Compliance*, *Deep Hex Analysis*, *Safe Storage*.
5. Click **Record Custody Transfer**.
   - An immutable record is appended to SQLite.
   - An on-chain custody event is transmitted via `logCustodyEvent()`.

---

### 2.4 Independent Verification & The Parity Matrix
A Verifier or Auditor can perform independent cryptographic verification at any time:

1. Navigate to **Verify Evidence**.
2. Select the evidence item from the catalog.
3. Click **Perform Cryptographic Verification**.
4. The system executes a three-way parity check:
   - **Vault Recalculation**: Streams the file from the vault drive and recalculates its SHA-256 hash.
   - **Local DB Comparison**: Compares the live hash to the hash recorded at intake.
   - **Blockchain Ledger Query**: Calls the `EvidenceRegistry` contract on the EVM network to retrieve the immutable timestamp and commitment.
5. Review the **Forensic Parity Matrix**:
   - **All Green (MATCH)**: Proof that the file has not experienced bit rot, deletion, or tampering since intake.
   - **Discrepancy Detected (RED)**: Immediate alert showing the exact expected vs. computed hash.

---

### 2.5 Demonstrating Forensic Tamper Resilience
LexChain features a demonstration tool allowing investigators to prove to courts and evaluators that the system detects any unauthorized bit-level modification:

> [!WARNING]
> This tool should only be used in demonstration mode or training scenarios to validate system alerting.

1. Navigate to **Verify Evidence**.
2. Select an evidence item and open the **Tamper Simulation Sandbox**.
3. Click **Simulate File Tamper (Append Byte)**:
   - The native backend appends a single byte (`0xFF`) to the demonstrator file.
4. Re-run **Perform Cryptographic Verification**:
   - The streaming recalculation immediately produces an entirely different SHA-256 digest (avalanche effect).
   - The **Parity Matrix** immediately switches to **RED (TAMPERED)**.
   - Discrepancy details display:
     `Vault hash mismatch: Expected 0x4a8f... but found 0x9c12... (Size altered: +1 byte)`.
5. Click **Restore Original State** to reverse the test byte and return to a pristine state.

---

### 2.6 Generating Court-Admissible Dossiers & Reports

1. Navigate to **Evidence Vault**.
2. Select any evidence record and click **View Dossier**.
3. The dossier modal displays:
   - Unique Evidence ID and Registration UUID.
   - Full SHA-256 Digest and Domain Commitment string.
   - EVM Transaction Hash and Block Number.
   - Authoritative Intake Timestamp and Collector Identity.
   - Complete Chain of Custody History.
4. Click **Export Forensic Dossier (JSON)** to download a digitally signed, structured JSON manifest suitable for court filings.
