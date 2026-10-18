import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  HardDrive,
  FilePlus2,
  ShieldCheck,
  Link2,
  Blocks,
  FileText,
  Terminal,
  Search,
  Copy,
  Check,
  ArrowRight,
  Shield,
  Layers,
  Database,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AuthUser, UserRole } from "../../types";
import { NavSection } from "../layout/Sidebar";

interface HowToUseViewProps {
  onNavigate: (section: NavSection) => void;
  currentUser?: AuthUser | null;
}

export const HowToUseView: React.FC<HowToUseViewProps> = ({
  onNavigate,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [activeTab, setActiveTab] = useState<
    "workflow" | "roles" | "parity" | "reports" | "cli" | "faq"
  >("workflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const workflowSteps = [
    {
      step: 1,
      title: "Evidence Ingestion & Bitstream Hashing",
      subtitle: "Secure file import into the isolated forensic vault",
      icon: FilePlus2,
      targetSection: "import" as NavSection,
      actionLabel: "Go to Batch Ingestion",
      details: [
        "Select evidence files (disk clones, network captures, memory dumps, digital media) or drag-and-drop into the intake locker.",
        "LexChain streams files through native Rust in 64KB memory chunks, calculating the true SHA-256 bitstream digest without loading gigabytes into RAM.",
        "A domain-separated cryptographic commitment is computed: SHA-256('LEXCHAIN:EV1:' || caseId || ':' || filename || ':' || size || ':' || hash).",
        "The file is transferred to the isolated vault directory (%USERPROFILE%\\Documents\\LexChain_Vault) and Windows read-only filesystem ACLs are locked.",
      ],
      tip: "ISO/IEC 27037 Standard: Always verify the original write-blocker seal before proceeding with digital ingestion.",
    },
    {
      step: 2,
      title: "Blockchain Proof-of-Existence Registration",
      subtitle: "Anchor cryptographic commitments onto the EVM ledger",
      icon: Blocks,
      targetSection: "blockchain" as NavSection,
      actionLabel: "Go to Blockchain Records",
      details: [
        "Upon ingestion, the evidence commitment is queued for smart contract registration (EvidenceRegistry.sol).",
        "If the local EVM blockchain node (:8545) is connected, the transaction is immediately anchored with block timestamp and caller gas signature.",
        "Offline Buffer Resilience: If network connection is interrupted, evidence is securely cached locally in SQLite. Once connection is restored, click 'Process Queue' to flush anchors without data loss.",
        "Duplicate Rejection: The smart contract strictly rejects duplicate commitments, mathematically guaranteeing uniqueness.",
      ],
      tip: "Local Hardhat node runs on port 8545 with Chain ID 31337. Check Header radar for connection state.",
    },
    {
      step: 3,
      title: "3-Way Cryptographic Parity Verification",
      subtitle: "Mathematical integrity audit across 3 independent tiers",
      icon: ShieldCheck,
      targetSection: "verify" as NavSection,
      actionLabel: "Go to Parity Verifier",
      details: [
        "Tier 1 (Live Vault Bitstream): Re-streams the physical stored evidence from disk to compute a fresh SHA-256 hash.",
        "Tier 2 (SQLite Reference): Compares the fresh hash against the authoritative database intake digest.",
        "Tier 3 (EVM Smart Contract): Queries the immutable blockchain anchor on Ethereum/Hardhat to verify non-repudiation.",
        "Tamper Detection: If even 1 single bit is altered on disk, the system flags a TAMPER ALERT, quarantines the record, and records a critical breach log.",
      ],
      tip: "Try the built-in Tamper Simulator in Verify Integrity view to test how the system detects corrupted files.",
    },
    {
      step: 4,
      title: "Append-Only Chain of Custody (ISO 27037)",
      subtitle: "Unbroken chronological trail of every physical and digital transfer",
      icon: Link2,
      targetSection: "custody" as NavSection,
      actionLabel: "Go to Chain of Custody",
      details: [
        "Log every physical locker movement, forensic analysis handoff, and court submission with authenticated operator identity.",
        "Each custody event includes source custodian, destination custodian, exact ISO-8601 UTC timestamp, and physical transfer rationale.",
        "Custody handoffs are committed as cryptographic events on the EVM smart contract via logCustodyEvent.",
        "The Custody DAG (Directed Acyclic Graph) verifies continuity with zero missing links, ensuring 100% court admissibility.",
      ],
      tip: "Auditor role provides FRE 901 Custody Gap Analysis to highlight any unanchored transfer intervals.",
    },
    {
      step: 5,
      title: "Court-Admissible PDF Dossier Export",
      subtitle: "Generate statutory trial exhibits compliant with FRE Rule 901 & NIST SP 800-86",
      icon: FileText,
      targetSection: "vault" as NavSection,
      actionLabel: "Go to Evidence Vault",
      details: [
        "Evidence Dossier PDF: In Evidence Vault, click any evidence record and select 'Export Dossier (PDF)' to produce a complete evidentiary trial brief.",
        "Chain of Custody PDF: In Chain of Custody view, click 'Generate Custody Sheet (PDF)' for an unbroken ISO/IEC 27037 custody transfer sheet.",
        "SysOps Audit Sheet PDF: In Audit Logs view, export complete tamper-evident audit logs with operator attribution and severity levels.",
        "Pixel-Perfect Vector Output: Generated using pure vector jsPDF engine in standard A4 format with dark tactical headers and cryptographic seals.",
      ],
      tip: "All exported PDFs are self-authenticating electronic records ready for grand jury or judicial submission.",
    },
  ];

  const roleGuides = [
    {
      role: "Administrator" as UserRole,
      badge: "SYSTEM OPERATOR & STORAGE CONTROLLER",
      accent: "text-cyan-400 border-cyan-500/30 bg-cyan-950/60",
      description:
        "Responsible for workstation telemetry, physical vault inode allocation, SQLite database migrations, EVM gas quotas, and privileged system logs.",
      tasks: [
        "Monitor core system telemetry and bitstream storage usage in System Telemetry.",
        "Review EVM RPC connectivity, block height, and gas consumption in EVM Gas & Ledger.",
        "Execute batch file imports for multi-drive forensic acquisitions.",
        "Audit privileged sysops activity in Privileged SysOps Logs.",
      ],
      primarySection: "dashboard" as NavSection,
    },
    {
      role: "Investigator" as UserRole,
      badge: "FIELD OPERATIONS & CRIME SCENE INTAKE",
      accent: "text-emerald-400 border-emerald-500/30 bg-emerald-950/60",
      description:
        "Handles initial crime scene intake, evidence bag seals, hardware clones (NVMe, RAM dumps, PCAP), active case dossiers, and physical locker transfers.",
      tasks: [
        "Ingest digital artifacts under ISO/IEC 27037 forensic intake protocols.",
        "Associate evidence items with specific Active Case Dossiers.",
        "Record physical evidence locker handoffs with transfer receipts.",
        "Verify field hash receipts against seizing officer notes.",
      ],
      primarySection: "cases" as NavSection,
    },
    {
      role: "Verifier" as UserRole,
      badge: "CRYPTOGRAPHIC PARITY & FORENSIC LAB",
      accent: "text-purple-400 border-purple-500/30 bg-purple-950/60",
      description:
        "Specializes in multi-layer checksum recalculation, collision checks, 3-way cryptographic parity verification, and tamper isolation.",
      tasks: [
        "Run 3-Way Parity Matrix tests (Vault file == SQLite hash == EVM contract anchor).",
        "Perform on-demand bitstream recalculation across large files.",
        "Detect any bit-level tampering or discrepancy breaches immediately.",
        "Test laboratory resilience using the sandbox tamper simulator.",
      ],
      primarySection: "verify" as NavSection,
    },
    {
      role: "Auditor" as UserRole,
      badge: "STATUTORY COMPLIANCE & LEGAL ADMISSIBILITY",
      accent: "text-amber-400 border-amber-500/30 bg-amber-950/60",
      description:
        "Ensures court admissibility under Federal Rules of Evidence (FRE Rule 901), judicial case dockets, warrant compliance, and DAG continuity.",
      tasks: [
        "Certify evidence exhibits under FRE Rule 901(b)(9) trial standards.",
        "Verify search warrant compliance and legal authority basis.",
        "Examine unbroken custody DAG continuity with zero missing handoffs.",
        "Export official court-admissible forensic PDF reports.",
      ],
      primarySection: "audit" as NavSection,
    },
  ];

  const faqs = [
    {
      q: "How does LexChain prove evidence was not tampered with?",
      a: "LexChain creates a mathematical proof at the moment of intake: the exact SHA-256 bitstream hash and a domain-separated commitment are anchored to an immutable smart contract on the blockchain. Because blockchain entries are write-once and cryptographically sealed by Ethereum block depth, any modification to the file on disk creates a discrepancy that is instantly caught during 3-way parity checks.",
    },
    {
      q: "What happens if the local blockchain node is offline or disconnected?",
      a: "LexChain operates on a resilient Local-First architecture. All evidence files and metadata are safely saved in your local vault and SQLite database. Registrations are automatically placed into the Offline Buffer Queue. As soon as the blockchain node reconnects, clicking 'Process Queue' anchors all queued items on-chain with full transaction receipts.",
    },
    {
      q: "Where is the evidence stored on my computer?",
      a: "Evidence is stored in an isolated, secure directory at: %USERPROFILE%\\Documents\\LexChain_Vault. LexChain automatically applies read-only filesystem ACLs to prevent accidental deletion, overwrites, or tampering by other programs.",
    },
    {
      q: "Can LexChain handle large disk images (e.g. 100 GB+)?",
      a: "Yes! LexChain's backend is compiled in native Rust and uses a 64KB chunked streaming buffer. It streams files through memory chunk by chunk, so you can hash 500GB+ forensic drive images without running out of RAM or crashing your computer.",
    },
    {
      q: "How do I start and stop all LexChain components?",
      a: "Simply double-click 'run_lexchain.bat' in the project directory. It automatically initializes the Evidence Vault, launches the Hardhat EVM node on port 8545, deploys the EvidenceRegistry smart contract, and opens the LexChain desktop app. To stop everything cleanly, run 'stop_lexchain.bat'.",
    },
  ];

  const filteredSteps = workflowSteps.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-7 overflow-y-auto max-h-full bg-[#02040A] text-slate-100 font-sans">
      {/* Top Cyber Security Header Banner */}
      <div className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(0,255,136,0.5)] shrink-0">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  LexChain Operations Manual & How-to-Use Guide
                </h1>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-mono px-2.5 py-0.5 rounded-full border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                  SOC v1.0 DOCS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete forensic procedures for evidence ingestion, 3-way parity matrix verification, EVM blockchain anchoring, and court-admissible PDF reporting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">Your Active Profile:</span>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full border bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.25)]">
              {role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guide topics (e.g., 'SHA-256', 'tamper', 'PDF export', 'Hardhat', 'custody DAG', 'offline queue')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-slate-950/90 border border-cyan-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate("import")}
              className="px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,242,254,0.15)]"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Import Evidence</span>
            </button>
            <button
              onClick={() => onNavigate("verify")}
              className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,136,0.15)]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Parity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-500/15 pb-4">
        {[
          { id: "workflow", label: "End-to-End Workflow (5 Steps)", icon: Layers },
          { id: "roles", label: "Security Role Workstations", icon: Shield },
          { id: "parity", label: "3-Way Parity Architecture", icon: ShieldCheck },
          { id: "reports", label: "Court PDF Reporting (FRE 901)", icon: FileText },
          { id: "cli", label: "Launcher Scripts & CLI", icon: Terminal },
          { id: "faq", label: "Troubleshooting & FAQ", icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,254,0.4)] scale-[1.02]"
                  : "bg-[#070D1A]/80 border border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORKFLOW */}
      {activeTab === "workflow" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Standard Forensic Operating Procedure
            </h2>
            <span className="text-xs text-slate-400">
              Showing {filteredSteps.length} of {workflowSteps.length} lifecycle phases
            </span>
          </div>

          <div className="space-y-4">
            {filteredSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-cyan-400/50 transition-all duration-200 group"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm shadow-[0_0_12px_rgba(0,242,254,0.25)] shrink-0">
                        0{step.step}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate(step.targetSection)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center gap-2.5 text-xs text-cyan-200">
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-[11px]">{step.tip}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === "roles" && (
        <div className="space-y-5">
          <div className="p-4 rounded-3xl bg-[#070D1A]/90 border border-cyan-500/25 text-xs text-slate-300">
            <span className="font-bold text-white">Role-Based Access Control (RBAC):</span> LexChain features 4 distinct operational security workstations. You can switch your active role anytime using the role selector in the left sidebar or the top profile bar.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roleGuides.map((rg) => (
              <div
                key={rg.role}
                className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {rg.role} Workstation
                      </h3>
                      <span className={`inline-block text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border mt-1.5 ${rg.accent}`}>
                        {rg.badge}
                      </span>
                    </div>
                    {role === rg.role && (
                      <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                        CURRENT ROLE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {rg.description}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                      Primary Responsibilities:
                    </span>
                    {rg.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-cyan-500/15">
                  <button
                    onClick={() => onNavigate(rg.primarySection)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Open {rg.role} Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 3-WAY PARITY ARCHITECTURE */}
      {activeTab === "parity" && (
        <div className="space-y-5">
          <div className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              The 3-Way Cryptographic Parity Matrix
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional forensic evidence systems rely on trust in the database. If a database row is updated maliciously, previous hashes can be overwritten silently. LexChain prevents this through **3-Way Parity**:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                  <HardDrive className="w-4 h-4" />
                  <span>Tier 1: Physical Vault Bitstream</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Streamed directly from %USERPROFILE%\Documents\LexChain_Vault in native Rust. Generates a live, recalculated SHA-256 hash.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <Database className="w-4 h-4" />
                  <span>Tier 2: Relational SQLite Storage</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authoritative intake metadata recorded upon evidence acquisition, including case ID, filename, size, and original collector notes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Blocks className="w-4 h-4" />
                  <span>Tier 3: EVM Smart Contract</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Immutable domain-separated commitment anchored on the blockchain. Once confirmed, no database admin or unauthorized operator can alter it.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/25 mt-4 text-xs font-mono text-cyan-200">
              <span className="font-bold text-white block mb-1">Mathematical Parity Formula:</span>
              Match Status = (Live Disk SHA-256 == SQLite DB Hash) AND (Domain Commitment == EVM Contract Anchor)
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate("verify")}
                className="px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.4)] flex items-center gap-2"
              >
                <span>Run 3-Way Parity Verification Matrix Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COURT PDF EXPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-5">
          <div className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Statutory Court Reports (FRE Rule 901 & NIST SP 800-86)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              LexChain generates 3 types of self-authenticating court reports using a client-side vector jsPDF engine. Documents are rendered in crisp A4 portrait format with non-repudiation attestations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-300">
                    1. Evidence Forensic Dossier
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    FRE Rule 901(b)(9) Evidence Exhibit
                  </span>
                  <p className="text-xs text-slate-300 mt-2">
                    Contains item metadata, SHA-256 digest, EVM smart contract anchor, transaction hash, complete custody history, and certified examiner attestation.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("vault")}
                  className="mt-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-center"
                >
                  Generate from Vault Modal
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    2. Chain of Custody Sheet
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    ISO/IEC 27037 Evidence Handling
                  </span>
                  <p className="text-xs text-slate-300 mt-2">
                    Records the unbroken chronological custody handoff chain from crime scene intake to court presentation, with UTC timestamps and custodian signatures.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("custody")}
                  className="mt-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all text-center"
                >
                  Generate from Custody View
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-300">
                    3. Forensic Audit Sheet
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    NIST SP 800-86 Append-Only Trail
                  </span>
                  <p className="text-xs text-slate-300 mt-2">
                    Complete statutory audit log of all system activities, permission modifications, access verifications, and tamper alert events with dynamic pagination.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("audit")}
                  className="mt-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all text-center"
                >
                  Generate from Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CLI & SCRIPTS */}
      {activeTab === "cli" && (
        <div className="space-y-5">
          <div className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              1-Click Automation Scripts & Developer Commands
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">run_lexchain.bat</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      1-Click Launch All
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("run_lexchain.bat", "run_bat")}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedText === "run_bat" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === "run_bat" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2">
                  Automatically initializes the isolated Evidence Vault folder, starts the Hardhat EVM Blockchain Node (:8545), deploys the EvidenceRegistry contract, and opens the LexChain desktop app.
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  D:\projects\Lex chain\run_lexchain.bat
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300">stop_lexchain.bat</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Clean Shutdown
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy("stop_lexchain.bat", "stop_bat")}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedText === "stop_bat" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === "stop_bat" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2">
                  Terminates the desktop application binary and gracefully shuts down the Hardhat blockchain node process running on port 8545.
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  D:\projects\Lex chain\stop_lexchain.bat
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">Hardhat Local RPC Endpoint</span>
                  <button
                    onClick={() => handleCopy("http://127.0.0.1:8545", "rpc_url")}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedText === "rpc_url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === "rpc_url" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2">
                  Use this JSON-RPC endpoint to connect external tools (MetaMask, Remix, hardhat console) to the LexChain private EVM node.
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  http://127.0.0.1:8545 (Chain ID: 31337)
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Frequently Asked Questions & Troubleshooting
            </h2>
            <span className="text-xs text-slate-400">
              Showing {filteredFaqs.length} of {faqs.length} answers
            </span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
              >
                <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] flex items-center justify-center font-mono">
                    Q
                  </span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-2.5 pl-7 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
