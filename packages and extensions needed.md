# 📦 Packages & Extensions Needed for LexChain

A comprehensive index of all runtime dependencies, development tools, Rust crates, Node.js packages, and recommended VS Code extensions required to develop, build, and run **LexChain**.

---

## 📑 Table of Contents
1. [🛠️ System Prerequisites & Runtimes](#️-system-prerequisites--runtimes)
2. [🌐 Frontend & Core Node.js Packages (`package.json`)](#-frontend--core-nodejs-packages-packagejson)
3. [⛓️ Blockchain & Smart Contract Packages (`blockchain/package.json`)](#-blockchain--smart-contract-packages-blockchainpackagejson)
4. [🦀 Rust Core Backend Crates (`src-tauri/Cargo.toml`)](#-rust-core-backend-crates-src-tauricargotoml)
5. [🧩 Recommended VS Code Extensions](#-recommended-vs-code-extensions)
6. [🚀 Complete One-Shot Installation Commands](#-complete-one-shot-installation-commands)

---

## 🛠️ System Prerequisites & Runtimes

Ensure these core system components are installed on your workstation:

| Software / Runtime | Required Version | Purpose | Download Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` or `v20+` LTS | JavaScript runtime for React, Vite, and Hardhat | [nodejs.org](https://nodejs.org/) |
| **npm** | `v9.0.0+` | Node package manager (comes with Node.js) | Bundled with Node.js |
| **Rust & Cargo** | `1.75.0+` (Stable) | Compiles the native forensic hashing engine & Tauri shell | [rustup.rs](https://rustup.rs/) |
| **C++ Build Tools** | VS 2022 (MSVC v143+) | Required for compiling native Windows Rust binaries and SQLite | [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| **Git** | `2.30+` | Version control & remote repository management | [git-scm.com](https://git-scm.com/) |

> 💡 **Windows Tip**: When installing Rust via `rustup-init.exe`, select option `1` (Proceed with installation using default `x86_64-pc-windows-msvc`). Ensure the **"Desktop development with C++"** workload is checked in the Visual Studio Installer.

---

## 🌐 Frontend & Core Node.js Packages (`package.json`)

### Production Dependencies (`dependencies`)

| Package Name | Version | Description & Forensic Role |
| :--- | :--- | :--- |
| **`react`** | `^19.1.0` | UI component library powering the SOC interface. |
| **`react-dom`** | `^19.1.0` | DOM rendering layer for React 19. |
| **`react-router-dom`** | `^7.18.4` | View routing and history management across forensic tabs. |
| **`ethers`** | `^6.17.0` | Ethereum & EVM JSON-RPC provider, transaction signing, and ABI encoder for smart contracts. |
| **`jspdf`** | `^4.2.1` | Client-side certified forensic PDF generation conforming to FRE Rule 901 & NIST SP 800-86 standards. |
| **`lucide-react`** | `^1.59.0` | Iconography suite for the Cyber Security SOC theme (shields, hashes, locks, terminals, matrices). |
| **`react-hook-form`** | `^7.90.0` | High-performance, re-render-isolated form controller for evidence ingestion and transfer handoffs. |
| **`@hookform/resolvers`** | `^5.9.2` | Resolvers bridge linking React Hook Form with Zod validation schemas. |
| **`zod`** | `^4.6.7` | TypeScript-first schema declaration and input sanitization (blocks path traversal & invalid hash lengths). |
| **`clsx`** | `^2.1.1` | Utility for conditionally joining CSS class strings. |
| **`tailwind-merge`** | `^3.7.0` | Merges Tailwind CSS classes efficiently without style collisions. |
| **`@tauri-apps/api`** | `^2.0.0` | High-speed IPC communication bridge between React and native Rust backend. |
| **`@tauri-apps/plugin-dialog`**| `^2.8.3` | Native Windows OS file-picker and directory selection dialogs. |
| **`@tauri-apps/plugin-opener`**| `^2.0.0` | Safely opens local audit PDF files and external blockchain explorer URLs in default apps. |

---

### Development Dependencies (`devDependencies`)

| Package Name | Version | Description & Role |
| :--- | :--- | :--- |
| **`vite`** | `^8.0.16` | Ultra-fast development server with HMR and Rollup production bundler. |
| **`typescript`** | `~6.0.3` | Type-safety and strict interface enforcement across all forensic models. |
| **`@vitejs/plugin-react`** | `^6.0.2` | Vite plugin enabling React Fast Refresh and JSX transformation. |
| **`tailwindcss`** | `^3.4.19` | Utility-first CSS framework for Cyber Security SOC glassmorphism UI. |
| **`postcss`** | `^8.5.30` | CSS transformation engine for Tailwind. |
| **`autoprefixer`** | `^10.6.1` | Parses CSS and adds vendor prefixes automatically. |
| **`vitest`** | `^5.0.5` | Fast Vite-native unit testing runner with ESM support. |
| **`jsdom`** | `^29.1.1` | In-memory DOM implementation for executing frontend unit tests headlessly. |
| **`@testing-library/react`**| `^16.3.3` | User-centric React component testing utilities. |
| **`@testing-library/jest-dom`**| `^7.0.1` | Custom jest-style matchers for asserting DOM element states. |
| **`@tauri-apps/cli`** | `^2.0.0` | Tauri command-line tool for dev server orchestrations and `.exe` packaging. |
| **`@types/react`** | `^19.1.8` | Type definitions for React. |
| **`@types/react-dom`** | `^19.1.6` | Type definitions for React DOM. |
| **`@types/node`** | `^26.6.5` | Type definitions for Node.js APIs. |

---

## ⛓️ Blockchain & Smart Contract Packages (`blockchain/package.json`)

The blockchain subsystem contains the EVM local node and Solidity smart contract testbed.

| Package Name | Version | Description & Role |
| :--- | :--- | :--- |
| **`hardhat`** | `^2.29.1` | Flexible EVM development environment. Runs local private testnet node (:8545), compiles Solidity, and executes deployments. |
| **`@nomicfoundation/hardhat-toolbox`** | `^6.1.2` | Comprehensive plugin bundle containing Ethers.js v6, Hardhat Network helpers, Chai matchers, and contract artifacts generators. |

---

## 🦀 Rust Core Backend Crates (`src-tauri/Cargo.toml`)

The native backend runs via Rust 2021 edition, delivering memory safety, low resource footprint, and raw cryptographic throughput.

| Crate Name | Version | Features | Description & Role |
| :--- | :--- | :--- | :--- |
| **`tauri`** | `2` | Default | Cross-platform desktop application framework. Exposes native IPC invoke commands to React. |
| **`tauri-build`** | `2` | Build Script | Pre-compiles native assets and links Windows subsystem APIs. |
| **`rusqlite`** | `0.31` | `["bundled"]` | Embedded zero-config SQLite engine with self-contained C amalgamation. Stores cases, evidence, custody events, and audit logs. |
| **`sha2`** | `0.10` | Default | Pure Rust FIPS 180-4 compliant SHA-256 implementation. Computes 64KB chunk-buffered streaming digests without memory saturation. |
| **`hex`** | `0.4` | Default | High-speed hexadecimal encoding and decoding of raw cryptographic digests. |
| **`chrono`** | `0.4` | `["serde"]` | High-precision ISO 8601 UTC timestamp generator for audit logs and custody records. |
| **`uuid`** | `1.8` | `["v4", "serde"]`| RFC 4122 compliant cryptographically secure UUIDv4 generation for evidence IDs and transaction IDs. |
| **`serde`** | `1` | `["derive"]` | High-performance Rust object serialization and deserialization framework. |
| **`serde_json`** | `1` | Default | Fast JSON parser and serializer for IPC payloads. |
| **`dirs`** | `5.0` | Default | Platform-standard OS directory resolution (locates `%USERPROFILE%\Documents` on Windows). |
| **`tauri-plugin-opener`** | `2` | Default | Native plugin to invoke OS default file handlers. |
| **`tauri-plugin-dialog`** | `2` | Default | Native plugin for Windows OpenFileDialog integration. |

---

## 🧩 Recommended VS Code Extensions

For the best developer experience when modifying or inspecting the codebase, install these extensions from the VS Code Marketplace:

### 1. Essential Core Extensions
* **Tailwind CSS IntelliSense**
  - **ID**: `bradlc.vscode-tailwindcss`
  - **Why**: Autocompletion, color previews, and hover docs for custom cyber-security classes (`bg-[#02040A]`, neon cyan glows, and tactical borders).
* **rust-analyzer**
  - **ID**: `rust-lang.rust-analyzer`
  - **Why**: Deep language intelligence, inline type hints, syntax checking, and code navigation for Rust backend code (`src-tauri/src/`).
* **Solidity**
  - **ID**: `NomicFoundation.hardhat-solidity`
  - **Why**: Official Hardhat extension providing Solidity language support, compiler error checking, and autocomplete for `EvidenceRegistry.sol`.
* **ESLint**
  - **ID**: `dbaeumer.vscode-eslint`
  - **Why**: Static code analysis to catch syntax issues and unused variables.
* **Prettier - Code Formatter**
  - **ID**: `esbenp.prettier-vscode`
  - **Why**: Consistent code formatting across TypeScript, CSS, JSON, and Markdown.

### 2. Enhanced Productivity & Tauri Extensions
* **Tauri**
  - **ID**: `tauri-apps.tauri-vscode`
  - **Why**: Validates `tauri.conf.json` schemas, auto-completes capabilities, and assists with desktop app configurations.
* **Error Lens**
  - **ID**: `usernamehw.errorlens`
  - **Why**: Displays TypeScript, Rust, and Solidity compiler diagnostics inline right where the error occurs.
* **Even Better TOML**
  - **ID**: `tamasfe.even-better-toml`
  - **Why**: Syntax highlighting, formatting, and validation for `src-tauri/Cargo.toml`.
* **Markdown All in One**
  - **ID**: `yzhang.markdown-all-in-one`
  - **Why**: Rich table formatting, TOC generation, and live preview for documentation.

---

## 🚀 Complete One-Shot Installation Commands

To set up everything from scratch on a clean system, run these commands in order:

### 1. Install Root Frontend & Desktop Dependencies:
```bash
# Navigate to the workspace root
cd "d:\projects and certificates\projects\block\Lex chain"

# Install all npm dependencies (React 19, Tauri v2 CLI, Ethers, Lucide, Tailwind, jsPDF, Vitest)
npm install
```

### 2. Install Blockchain Hardhat Dependencies:
```bash
# Navigate to the blockchain directory
cd blockchain

# Install Hardhat and Hardhat Toolbox
npm install

# Return to root
cd ..
```

### 3. Verify Rust Toolchain & Compile Backend:
```bash
# Check rust compiler version
rustc --version

# Verify Rust crates compilation
cd src-tauri
cargo check
cd ..
```

### 4. Verify System Readiness:
```bash
# Run the complete test suite across all 3 layers
npm run test:all
```

If all 3 layers pass (`frontend`, `blockchain`, `backend`), your environment is 100% configured and ready!

---

*LexChain — Zero-Trust Cryptographic Digital Evidence Protection & Verification System*
