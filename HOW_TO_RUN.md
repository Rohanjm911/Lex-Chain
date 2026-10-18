# 🚀 How to Run LexChain

Comprehensive step-by-step execution guide for the **LexChain Blockchain-Based Digital Evidence Protection & Verification System**.

---

## 📑 Table of Contents
1. [⚡ Quick Start (One-Click Launch — Recommended)](#-quick-start-one-click-launch--recommended)
2. [🛠️ Prerequisites Check](#️-prerequisites-check)
3. [💻 Manual Developer Launch (Step-by-Step)](#-manual-developer-launch-step-by-step)
4. [📦 Compiling Standalone Executable (.exe)](#-compiling-standalone-executable-exe)
5. [🧪 Running Tests (Frontend, Smart Contracts, Rust Backend)](#-running-tests-frontend-smart-contracts-rust-backend)
6. [🛑 Stopping Services Cleanly](#-stopping-services-cleanly)
7. [🔍 First-Time Forensic Walkthrough](#-first-time-forensic-walkthrough)
8. [❓ Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ⚡ Quick Start (One-Click Launch — Recommended)

The fastest and easiest way to start all components of LexChain simultaneously on Windows is using the provided automated batch scripts.

### Step 1: Run the Launcher
Double-click `run_lexchain.bat` in the project root, or execute from PowerShell / Command Prompt:

```cmd
.\run_lexchain.bat
```

### What Happens Automatically:
1. **[1/4] Prepares Evidence Vault**: Creates the isolated forensic directory structure at `%USERPROFILE%\Documents\LexChain_Vault` (`evidence\`, `reports\`, `backups\`).
2. **[2/4] Starts EVM Blockchain Node**: Checks port `8545`. If not already active, launches a local private Hardhat EVM blockchain node in a dedicated terminal window.
3. **[3/4] Deploys Smart Contract**: Executes `scripts/deploy.js` to compile and deploy `EvidenceRegistry.sol` to the local node, updating the contract address and ABI synchronization file.
4. **[4/4] Launches LexChain Workstation**:
   - If a compiled standalone binary exists (`src-tauri/target/release/lexchain.exe`), it launches instantly.
   - Otherwise, it launches developer mode (`npm run tauri dev`).

---

## 🛠️ Prerequisites Check

Before running manually, ensure your system has the following installed:

| Tool | Minimum Version | Check Command |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0+ (LTS recommended) | `node -v` |
| **npm** | v9.0.0+ | `npm -v` |
| **Rust & Cargo** | 1.75.0+ | `rustc --version` |
| **C++ Build Tools** | Visual Studio 2022 C++ workload | Via VS Installer |

*(For a full list of dependencies, see [`PACKAGES_AND_EXTENSIONS.md`](./PACKAGES_AND_EXTENSIONS.md))*

---

## 💻 Manual Developer Launch (Step-by-Step)

If you prefer running services in individual terminal windows for development and debugging:

### Terminal 1: Start Local EVM Blockchain Node
```bash
# Navigate to the blockchain directory
cd blockchain

# Install blockchain dependencies (first time only)
npm install

# Launch local Hardhat EVM RPC node
npx hardhat node
```
> **Output:** Starts JSON-RPC server listening at `http://127.0.0.1:8545` with 20 pre-funded test accounts (Chain ID: `31337`).

---

### Terminal 2: Deploy Smart Contract
In a second terminal, deploy the `EvidenceRegistry.sol` contract:

```bash
cd blockchain

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost
```
> **Output:** Compiles Solidity contracts, deploys `EvidenceRegistry`, and writes the deployed address to `blockchain/contract-address.json`.

---

### Terminal 3: Launch Frontend / Desktop Application

#### Option A: Native Desktop App (Rust + Tauri v2)
```bash
# Run from repository root
npm run tauri dev
```
> This starts the Vite dev server and opens the native Windows desktop application window with full OS integration and native SQLite storage.

#### Option B: Browser Development Mode (Vite React UI)
```bash
# Run from repository root
npm run dev
```
> Opens the web interface in your browser at `http://localhost:5173/` (uses the web fallback simulation API).

---

## 📦 Compiling Standalone Executable (.exe)

To produce a production-optimized standalone Windows executable without bundling installers:

```bash
# Compile standalone release binary
npm run build:exe
```

The resulting executable will be created at:
```text
src-tauri\target\release\lexchain.exe
```

This executable can be launched directly without running `npm run tauri dev`.

---

## 🧪 Running Tests (Frontend, Smart Contracts, Rust Backend)

LexChain maintains comprehensive test coverage across all three architectural layers:

### Run All Test Suites with One Command:
```bash
npm run test:all
```

### Or Run Individual Layer Tests:

#### 1. Frontend Tests (React 19 + Vitest + Testing Library)
```bash
npm test
```
*Tests component rendering, 3-way parity matrix verification UI, role switching, and PDF export triggers.*

#### 2. Blockchain Smart Contract Tests (Hardhat + Chai)
```bash
npm run blockchain:test
```
*Tests `EvidenceRegistry.sol` unique commitments, duplicate rejections, on-chain custody event logging, and access control.*

#### 3. Native Rust Backend Tests (Cargo)
```bash
npm run test:backend
```
*Tests 64KB chunk streaming SHA-256 bitstream calculations, SQLite schema initialization, and directory path sanitization.*

---

## 🛑 Stopping Services Cleanly

When you are done with your session, use the automated shutdown script:

```cmd
.\stop_lexchain.bat
```

### What It Does:
- Closes any running Hardhat blockchain nodes on port `8545`.
- Closes any active Vite dev servers on port `5173`.
- Terminates orphaned background node processes.

---

## 🔍 First-Time Forensic Walkthrough

Once the LexChain interface is open:

1. **Verify EVM Connection**:
   - Check the **SOC Radar status** in the top header. It should display `EVM NODE ONLINE (Port 8545 - Chain ID 31337)`.
2. **Switch Forensic Roles**:
   - In the sidebar operator profile card, switch between **Administrator**, **Investigator**, **Verifier**, and **Auditor** to observe tailored navigation, metrics, and permissions.
3. **Ingest Evidence**:
   - Navigate to **Batch System Ingestion** (or *Crime Scene Ingestion*).
   - Drag and drop or browse for an evidence file (disk clone, audio, video, forensic image).
   - Enter Case ID (e.g., `CAS-2026-001`), seizing officer credentials, and source device.
   - Click **Ingest & Anchor Evidence**. The file is streamed via Rust, SHA-256 hash calculated, copied to the vault, and queued for blockchain anchoring.
4. **Inspect Blockchain Ledger**:
   - Navigate to **RPC & Queue Admin** (or *Blockchain Records*).
   - View the registered on-chain commitment, transaction hash, block number, and timestamp.
5. **Run 3-Way Parity Verification**:
   - Navigate to **Verify Integrity** (or *3-Way Parity Matrix*).
   - Select an evidence item and click **Run 3-Way Parity Check**.
   - Watch the 3 tiers evaluate:
     - Tier 1: Live Vault File Digest
     - Tier 2: SQLite Intake Reference
     - Tier 3: EVM Blockchain Anchor
6. **Simulate Tamper Detection**:
   - In the Verify view, use the **Safe Tamper Simulator** to test corrupted bitstream isolation.
7. **Export Court-Admissible PDF Report**:
   - Navigate to **Privileged SysOps Logs** (or *Statutory Audit Records*).
   - Click **Export Audit Sheet (PDF)** or open an Evidence Detail Modal and click **Export Dossier (PDF)** to download certified NIST SP 800-86 / FRE Rule 901 compliant court reports.
8. **Consult Built-in Manual**:
   - Click the **How to Use & Operations SOP** tab in the sidebar anytime for interactive playbooks and SOP documentation.

---

## ❓ Troubleshooting & FAQs

### Q1: `[ERROR] Node.js was not found in your system PATH`
**Solution**: Install Node.js 18+ LTS from [https://nodejs.org/](https://nodejs.org/) and ensure "Add to PATH" is checked during installation. Restart your terminal.

### Q2: Port 8545 is already in use
**Solution**: Run `.\stop_lexchain.bat` or run the following in PowerShell:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8545).OwningProcess | Stop-Process -Force
```

### Q3: EVM Node shows "OFFLINE" in the Header
**Solution**: Ensure Terminal 1 running `npx hardhat node` is active. If offline, registrations are safely held in the local SQLite queue (`blockchain_queue`). Once reconnected, click **Sync Queue** in the header to anchor all pending items.

### Q4: Rust compilation errors during `npm run tauri dev`
**Solution**: Make sure **Microsoft C++ Build Tools** are installed. Run:
```cmd
rustup default stable-x86_64-pc-windows-msvc
```

---

*LexChain — Zero-Trust Cryptographic Digital Evidence Protection & Verification System*
