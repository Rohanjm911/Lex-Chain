# LexChain: EVM Blockchain Integration & Smart Contract Specification

## 1. Smart Contract Architecture: `EvidenceRegistry.sol`

The LexChain smart contract serves as an immutable, decentralized court of record for digital evidence proofs-of-existence and chain of custody audit logs.

- **Language**: Solidity 0.8.20
- **License**: MIT
- **Design Pattern**: Registry Pattern with Custom Error Reverts and Role-Based Authorization

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract EvidenceRegistry {
    // --- Data Structures ---
    struct EvidenceRecord {
        bytes32 fileHash;        // SHA-256 hash of the evidence file
        bytes32 commitment;      // Domain-separated commitment hash
        string caseId;           // Associated case identifier
        string metadataUri;      // URI or hash reference to metadata
        address registeredBy;    // Ethereum address that registered this evidence
        uint256 registeredAt;    // Block timestamp of registration
        bool exists;             // Flag indicating if evidence is registered
    }

    struct CustodyEvent {
        bytes32 evidenceHash;    // Reference to evidence file hash
        string action;           // e.g., "TRANSFER", "AUDIT", "COLLECTION"
        string actor;            // Identifier/badge of actor initiating action
        string toActor;          // Identifier/badge of recipient
        string location;         // Physical or logical destination
        uint256 timestamp;       // Block timestamp
    }

    // --- State Storage ---
    mapping(bytes32 => EvidenceRecord) private _records;
    mapping(bytes32 => CustodyEvent[]) private _custodyEvents;
    mapping(address => bool) public authorizedRegistrars;
    address public owner;

    // --- Custom Errors ---
    error EvidenceAlreadyExists(bytes32 fileHash);
    error EvidenceNotFound(bytes32 fileHash);
    error NotAuthorized();
    error InvalidCommitment();
    error InvalidHash();
}
```

---

## 2. Interface Specification

### 2.1 Evidence Registration
```solidity
function registerEvidence(
    bytes32 fileHash,
    bytes32 commitment,
    string calldata caseId,
    string calldata metadataUri
) external onlyRegistrar returns (bool)
```
- **Requirements**:
  - `fileHash` and `commitment` must be non-zero.
  - `_records[fileHash].exists` must be `false` (reverts with `EvidenceAlreadyExists(fileHash)`).
  - Caller must be `owner` or have `authorizedRegistrars[msg.sender] == true`.
- **Emitted Event**:
  ```solidity
  event EvidenceRegistered(
      bytes32 indexed fileHash,
      bytes32 indexed commitment,
      string caseId,
      address indexed registeredBy,
      uint256 registeredAt
  );
  ```

### 2.2 Custody Logging
```solidity
function logCustodyEvent(
    bytes32 evidenceHash,
    string calldata action,
    string calldata actor,
    string calldata toActor,
    string calldata location
) external onlyRegistrar returns (uint256 eventIndex)
```
- **Requirements**:
  - `_records[evidenceHash].exists` must be `true` (reverts with `EvidenceNotFound(evidenceHash)`).
  - Appends to `_custodyEvents[evidenceHash]`.
- **Emitted Event**:
  ```solidity
  event CustodyEventLogged(
      bytes32 indexed evidenceHash,
      string action,
      string actor,
      string toActor,
      string location,
      uint256 timestamp
  );
  ```

### 2.3 Verification Inquiries
```solidity
function verifyEvidence(
    bytes32 fileHash,
    bytes32 commitment
) external view returns (bool isValid, uint256 registeredAt, address registeredBy)
```
- Performs constant-time validation comparing the queried hash and commitment against on-chain storage.
- Returns `isValid = true` if and only if both match recorded state.

---

## 3. Gas Optimization Strategy

1. **Fixed-Size `bytes32` for Hashes**:
   - SHA-256 hashes and cryptographic commitments are strictly stored as `bytes32` (32 bytes).
   - Avoids the dynamic heap allocation and overhead associated with ASCII hex strings (`string`).
2. **`calldata` Parameter Modifiers**:
   - String arguments (`caseId`, `metadataUri`, `action`, `actor`, `location`) are declared `calldata` rather than `memory` to avoid unnecessary copying into the EVM memory space.
3. **Custom Errors**:
   - Reverts use `error()` declarations instead of long revert string descriptions (`require(..., "Evidence already exists")`), saving ~300 gas per revert branch.
4. **Append-Only Array Packing**:
   - `CustodyEvent` structs group strings and timestamp fields to ensure efficient array indexing.

---

## 4. Local EVM Development & Deployment

The `blockchain/` directory contains the complete Hardhat 2 toolchain:

### 4.1 Configuration (`blockchain/hardhat.config.js`)
```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

### 4.2 Automated ABI & Address Sync (`blockchain/scripts/deploy.js`)
When running `npx hardhat run scripts/deploy.js --network localhost`:
1. Compiles `contracts/EvidenceRegistry.sol`.
2. Deploys the contract to the local test node.
3. Formats an export artifact containing:
   - `address`: The deployed contract address (e.g. `0x5FbDB2315678afecb367f032d93F642f64180aa3`).
   - `network`: Network name and chain ID.
   - `abi`: Full JSON ABI array.
4. Writes directly to `src/blockchain/EvidenceRegistry.json`, ensuring the React frontend immediately inherits the new address and interface without manual copying.

---

## 5. Offline Queuing & Fault-Tolerant Synchronization

If an investigator registers evidence in a field environment without active internet or RPC node access:
1. LexChain safely completes native streaming SHA-256 calculation and stores the evidence in the local SQLite database.
2. An entry is created in `blockchain_queue` with status `pending`.
3. The UI Header displays a persistent badge: **"EVM Offline / X Queued"**.
4. When the investigator reconnects:
   - The queue monitor in `src/services/blockchain.ts` automatically dispatches pending transactions sequentially.
   - Upon mining, the SQLite database is updated with the returned transaction hash and block number, and the queue entry status flips to `completed`.
