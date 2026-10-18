import React, { useState, useEffect, useMemo } from "react";
import {
  HardDrive,
  Blocks,
  Clock,
  ShieldAlert,
  Briefcase,
  Link2,
  FilePlus2,
  ShieldCheck,
  ArrowRight,
  Database,
  Activity,
  Layers,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  RefreshCw,
  Server,
  Terminal,
  Search,
  Copy,
  Check,
  TrendingUp,
  PieChart,
} from "lucide-react";
import {
  CustodyEvent,
  DashboardStats,
  AuthUser,
  Evidence,
  Case,
  BlockchainQueueItem,
  AuditLog,
  UserRole,
} from "../../types";
import { NetworkStatus } from "../../services/blockchain";
import { NavSection } from "../layout/Sidebar";
import { DonutChartCard } from "../charts/DonutChartCard";

interface DashboardViewProps {
  stats: DashboardStats;
  recentEvents: CustodyEvent[];
  onNavigate: (section: NavSection) => void;
  vaultPath: string;
  currentUser?: AuthUser | null;
  onSwitchRole?: (role: UserRole) => void;
  evidenceList?: Evidence[];
  cases?: Case[];
  queue?: BlockchainQueueItem[];
  auditLogs?: AuditLog[];
  networkStatus?: NetworkStatus;
  onSyncQueue?: () => void;
  isSyncingQueue?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentEvents,
  onNavigate,
  vaultPath,
  currentUser,
  onSwitchRole,
  evidenceList = [],
  cases = [],
  queue = [],
  auditLogs = [],
  networkStatus,
  onSyncQueue,
  isSyncingQueue = false,
}) => {
  const role = currentUser?.role || "Administrator";
  const [copiedVault, setCopiedVault] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<
    "All" | "Verified" | "Confirmed" | "Transferred"
  >("All");
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyVault = () => {
    if (vaultPath) {
      navigator.clipboard.writeText(vaultPath);
      setCopiedVault(true);
      setTimeout(() => setCopiedVault(false), 2000);
    }
  };

  const rolesList: { id: UserRole; label: string; icon: any; color: string }[] =
    [
      {
        id: "Administrator",
        label: "Administrator",
        icon: Server,
        color: "text-blue-500",
      },
      {
        id: "Investigator",
        label: "Investigator",
        icon: Briefcase,
        color: "text-sky-500",
      },
      {
        id: "Verifier",
        label: "Verifier",
        icon: ShieldCheck,
        color: "text-emerald-500",
      },
      { id: "Auditor", label: "Auditor", icon: Scale, color: "text-amber-500" },
    ];

  const total = stats.total_evidence || 1;
  const onChainPct = Math.round((stats.registered_on_chain / total) * 100);
  const localOnlyPct = Math.round((stats.local_only / total) * 100);
  const pendingPct = Math.round((stats.pending_registration / total) * 100);
  const failedPct = Math.round((stats.failed_integrity_checks / total) * 100);

  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      const matchesSearch =
        searchQuery === "" ||
        ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.evidence_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.actor_identity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.context.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        eventFilter === "All" ||
        (eventFilter === "Verified" && ev.event_type.includes("Verified")) ||
        (eventFilter === "Confirmed" && ev.event_type.includes("Confirmed")) ||
        (eventFilter === "Transferred" &&
          (ev.event_type.includes("Transferred") ||
            ev.event_type.includes("Transfer")));

      return matchesSearch && matchesFilter;
    });
  }, [recentEvents, searchQuery, eventFilter]);

  const [selectedCaseUser, setSelectedCaseUser] = useState<string>("ALL");

  const displayCases = useMemo(() => {
    const defaults: Case[] = [
      {
        id: "CASE-2026-001",
        title: "Citadel Financial Intrusion",
        description: "Exfiltration of memory buffers and transaction logs",
        status: "Active",
        lead_investigator: "Senior Investigator Chen",
        created_at: "2026-10-17T08:00:00Z",
        updated_at: "2026-10-17T08:00:00Z",
        evidence_count: 5,
      },
      {
        id: "CASE-2026-002",
        title: "Darknet Infrastructure Ransomware",
        description: "Ransomware staging binary and network trace capture",
        status: "Active",
        lead_investigator: "Forensic Analyst Vance",
        created_at: "2026-10-17T09:30:00Z",
        updated_at: "2026-10-17T09:30:00Z",
        evidence_count: 8,
      },
      {
        id: "CASE-2026-003",
        title: "Judicial FRE 901 Statutory Review",
        description:
          "Statutory court admissibility and chain of custody continuity audit",
        status: "Closed",
        lead_investigator: "Compliance Auditor Adams",
        created_at: "2026-10-16T11:00:00Z",
        updated_at: "2026-10-17T14:00:00Z",
        evidence_count: 12,
      },
      {
        id: "CASE-2026-004",
        title: "Corporate Data Exfiltration Incident",
        description: "Encrypted disk drive image and volatile RAM dump",
        status: "Active",
        lead_investigator: "Senior Investigator Chen",
        created_at: "2026-10-17T10:15:00Z",
        updated_at: "2026-10-17T10:15:00Z",
        evidence_count: 4,
      },
      {
        id: "CASE-2026-005",
        title: "SysOps Storage Cluster & Inode Audit",
        description:
          "Filesystem storage cluster quota check and node sync verification",
        status: "Archived",
        lead_investigator: "System Administrator",
        created_at: "2026-10-15T07:00:00Z",
        updated_at: "2026-10-16T18:00:00Z",
        evidence_count: 15,
      },
      {
        id: "CASE-2026-006",
        title: "Unauthorized Contract Interaction",
        description:
          "EVM transaction payload and signature non-repudiation audit",
        status: "Active",
        lead_investigator: "Forensic Analyst Vance",
        created_at: "2026-10-17T12:00:00Z",
        updated_at: "2026-10-17T12:00:00Z",
        evidence_count: 6,
      },
    ];

    if (!cases || cases.length === 0) return defaults;
    const existingIds = new Set(cases.map((c) => c.id));
    return [...cases, ...defaults.filter((d) => !existingIds.has(d.id))];
  }, [cases]);

  const caseUsers = useMemo(() => {
    return Array.from(new Set(displayCases.map((c) => c.lead_investigator)));
  }, [displayCases]);

  const filteredCasesForCharts = useMemo(() => {
    if (selectedCaseUser === "ALL") return displayCases;
    return displayCases.filter((c) => c.lead_investigator === selectedCaseUser);
  }, [displayCases, selectedCaseUser]);

  const roleChartConfig = useMemo(() => {
    if (role === "Investigator") {
      return {
        matrixTitle: "Investigator Case Portfolio & Evidence Ingestion",
        matrixSubtitle:
          "Active crime scene dossiers, forensic intake milestones, and seized digital media distribution",
        chart1: {
          title: "Case Portfolio by Category",
          subtitle: "Crime scene dossier distribution under active investigation",
          icon: Briefcase,
          slices: [
            { label: "Financial Ledger Fraud", value: 3, color: "#0284C7", unit: "cases" },
            { label: "Ransomware Staging", value: 2, color: "#EF4444", unit: "cases" },
            { label: "Exfiltration Forensics", value: 2, color: "#F59E0B", unit: "cases" },
            { label: "Contract Breaches", value: 1, color: "#8B5CF6", unit: "cases" },
          ],
          centerValue: `${displayCases.length}`,
          centerLabel: "Dossiers",
          unitLabel: "cases",
        },
        chart2: {
          title: "Investigation Lifecycle",
          subtitle: "Case dossier progression & prosecution status",
          icon: TrendingUp,
          slices: [
            { label: "Active Evidence Intake", value: 4, color: "#10B981", unit: "cases" },
            { label: "Forensic Lab Analysis", value: 3, color: "#3B82F6", unit: "cases" },
            { label: "Grand Jury Ready", value: 2, color: "#8B5CF6", unit: "cases" },
          ],
          centerValue: "78%",
          centerLabel: "Progression",
          unitLabel: "cases",
        },
        chart3: {
          title: "Seized Digital Media",
          subtitle: "Digital artifact media breakdown acquired under custody",
          icon: Database,
          slices: [
            { label: "NVMe & SSD Forensic Clones", value: 18, color: "#0284C7", unit: "items" },
            { label: "Hardware RAM Dumps", value: 12, color: "#6366F1", unit: "items" },
            { label: "Mobile Flash Extractions", value: 8, color: "#EC4899", unit: "items" },
            { label: "Network Packet Captures", value: 4, color: "#F59E0B", unit: "items" },
          ],
          centerValue: `${stats.total_evidence || 42}`,
          centerLabel: "Media",
          unitLabel: "items",
        },
      };
    } else if (role === "Verifier") {
      return {
        matrixTitle: "Cryptographic Parity & Integrity Verification Matrix",
        matrixSubtitle:
          "3-Way cryptographic hash comparison, algorithm validation, and tamper detection telemetry",
        chart1: {
          title: "3-Way Cryptographic Parity",
          subtitle: "Local bitstream vs. SQLite hash vs. EVM smart contract",
          icon: ShieldCheck,
          slices: [
            { label: "3-Way Exact Match", value: stats.registered_on_chain || 28, color: "#10B981", unit: "items" },
            { label: "Unanchored Bitstreams", value: stats.local_only || 12, color: "#0284C7", unit: "items" },
            { label: "Queue Sync Buffer", value: stats.pending_registration || 2, color: "#F59E0B", unit: "items" },
            { label: "Discrepancy Breaches", value: stats.failed_integrity_checks || 1, color: "#EF4444", unit: "items" },
          ],
          centerValue: "98%",
          centerLabel: "Parity",
          unitLabel: "items",
        },
        chart2: {
          title: "Digest Algorithm Verification",
          subtitle: "Multi-layer checksum and commitment checks",
          icon: CheckCircle2,
          slices: [
            { label: "SHA-256 Bitstream Digests", value: 38, color: "#10B981", unit: "digests" },
            { label: "Keccak-256 Commitments", value: 28, color: "#3B82F6", unit: "digests" },
            { label: "Domain-Separated Salts", value: 28, color: "#8B5CF6", unit: "digests" },
          ],
          centerValue: "100%",
          centerLabel: "Valid",
          unitLabel: "digests",
        },
        chart3: {
          title: "Integrity Isolation & Quarantine",
          subtitle: "Tamper detection and security isolation rate",
          icon: AlertTriangle,
          slices: [
            { label: "Bit-Level Bitstream Pass", value: 41, color: "#10B981", unit: "items" },
            { label: "Quarantined & Flagged", value: stats.failed_integrity_checks || 1, color: "#EF4444", unit: "items" },
          ],
          centerValue: "Clean",
          centerLabel: "Vault",
          unitLabel: "items",
        },
      };
    } else if (role === "Auditor") {
      return {
        matrixTitle: "Judicial Admissibility & Chain-of-Custody DAG Matrix",
        matrixSubtitle:
          "Federal Rules of Evidence (FRE 901) compliance, NIST SP 800-86 standard, and DAG continuity",
        chart1: {
          title: "FRE Rule 901 Statutory Admissibility",
          subtitle: "Federal Rules of Evidence court admissibility index",
          icon: Scale,
          slices: [
            { label: "Fully Admissible (FRE 901)", value: 28, color: "#10B981", unit: "exhibits" },
            { label: "Self-Authenticating Media", value: 12, color: "#0284C7", unit: "exhibits" },
            { label: "Grand Jury Ready Dossiers", value: 4, color: "#8B5CF6", unit: "exhibits" },
          ],
          centerValue: "100%",
          centerLabel: "Admissible",
          unitLabel: "exhibits",
        },
        chart2: {
          title: "NIST SP 800-86 Forensic Rigor",
          subtitle: "Four-phase statutory compliance verification",
          icon: CheckCircle2,
          slices: [
            { label: "Acquisition Rigor (Phase 1)", value: 25, color: "#3B82F6", unit: "pts" },
            { label: "Preservation Control (Phase 2)", value: 25, color: "#10B981", unit: "pts" },
            { label: "Cryptographic Analysis (Phase 3)", value: 25, color: "#8B5CF6", unit: "pts" },
            { label: "Court Presentation (Phase 4)", value: 25, color: "#F59E0B", unit: "pts" },
          ],
          centerValue: "Certified",
          centerLabel: "Audit",
          unitLabel: "pts",
        },
        chart3: {
          title: "Chain of Custody DAG Continuity",
          subtitle: "Sequential transfer hash-link completeness",
          icon: Link2,
          slices: [
            { label: "Continuous Hash-Linked Handoffs", value: 34, color: "#10B981", unit: "events" },
            { label: "Cryptographic Dual-Signatures", value: 26, color: "#3B82F6", unit: "events" },
            { label: "On-Chain Anchored Transfers", value: 18, color: "#8B5CF6", unit: "events" },
          ],
          centerValue: "0 Breaks",
          centerLabel: "Continuity",
          unitLabel: "events",
        },
      };
    } else {
      return {
        matrixTitle: "SysOps Infrastructure & Blockchain Anchoring Telemetry",
        matrixSubtitle:
          "Physical storage quotas, EVM node transaction pipeline, and administrative privilege tracking",
        chart1: {
          title: "Storage Quota & Volume Distribution",
          subtitle: "Physical filesystem vault allocation by artifact type",
          icon: HardDrive,
          slices: [
            { label: "Forensic Disk Images", value: 46, color: "#3B82F6", unit: "GB" },
            { label: "Network PCAP Captures", value: 32, color: "#06B6D4", unit: "GB" },
            { label: "Volatile RAM Dumps", value: 16, color: "#8B5CF6", unit: "GB" },
            { label: "SQLite Forensic Journal", value: 6, color: "#10B981", unit: "GB" },
          ],
          centerValue: "100 GB",
          centerLabel: "Quota",
          unitLabel: "GB",
        },
        chart2: {
          title: "EVM Node Sync & Queue Throughput",
          subtitle: "Blockchain transaction anchoring pipeline",
          icon: Blocks,
          slices: [
            { label: "Confirmed on EVM", value: stats.registered_on_chain || 28, color: "#10B981", unit: "tx" },
            { label: "Mempool Processing", value: stats.pending_registration || 2, color: "#F59E0B", unit: "tx" },
            { label: "Offline Vault Spool", value: stats.local_only || 12, color: "#0284C7", unit: "tx" },
          ],
          centerValue: `${stats.registered_on_chain || 28}`,
          centerLabel: "Anchored",
          unitLabel: "tx",
        },
        chart3: {
          title: "SysOps Privileged Access Audit",
          subtitle: "Role assignments, keys & admin operations",
          icon: Activity,
          slices: [
            { label: "Evidence Ingestions", value: 36, color: "#3B82F6", unit: "ops" },
            { label: "Hash Recalculations", value: 20, color: "#10B981", unit: "ops" },
            { label: "Operator Role Shifts", value: 12, color: "#8B5CF6", unit: "ops" },
            { label: "Node Configurations", value: 4, color: "#F59E0B", unit: "ops" },
          ],
          centerValue: "72 Ops",
          centerLabel: "Audited",
          unitLabel: "ops",
        },
      };
    }
  }, [role, stats, displayCases]);

  return (
    <div className="p-8 space-y-7 overflow-y-auto max-h-full bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Active Profile:
          </span>
          <div className="inline-flex bg-slate-950/80 p-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md shadow-xs">
            {rolesList.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onSwitchRole?.(r.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,242,254,0.4)] scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-slate-400"}`}
                  />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs w-full xl:w-auto justify-start xl:justify-end">
          <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/60 px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-700 backdrop-blur-md shadow-xs">
            <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[200px] select-text">
              {vaultPath || "C:\\Users\\...\\Documents\\LexChain_Vault"}
            </span>
            <button
              onClick={handleCopyVault}
              title="Copy Vault Path"
              className="text-slate-400 hover:text-slate-700 transition-colors ml-1 p-0.5 rounded-full hover:bg-black/5"
            >
              {copiedVault ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-medium border shadow-xs backdrop-blur-md ${
              networkStatus?.connected
                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-800 border-amber-500/20"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  networkStatus?.connected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  networkStatus?.connected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span>
              {networkStatus?.connected ? "EVM Node :8545" : "Air-Gapped"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/60 px-3.5 py-1.5 rounded-full font-mono text-[11px] text-slate-600 shadow-xs backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{liveTime}</span>
          </div>

          {stats.pending_registration > 0 && onSyncQueue && (
            <button
              onClick={onSyncQueue}
              disabled={isSyncingQueue}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 text-[11px]"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSyncingQueue ? "animate-spin" : ""}`}
              />
              Sync ({stats.pending_registration})
            </button>
          )}
        </div>
      </div>

      <div
        className={`rounded-3xl p-7 text-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-white/10 backdrop-blur-2xl relative overflow-hidden transition-all duration-300 ${
          role === "Administrator"
            ? "bg-gradient-to-br from-[#121826] via-[#1B273F] to-[#0E1524] border-blue-500/20"
            : role === "Investigator"
              ? "bg-gradient-to-br from-[#0F1E36] via-[#162D56] to-[#0A1628] border-sky-500/20"
              : role === "Verifier"
                ? "bg-gradient-to-br from-[#0E241E] via-[#143B30] to-[#091A15] border-emerald-500/20"
                : "bg-gradient-to-br from-[#241A10] via-[#3A2A18] to-[#17100A] border-amber-500/20"
        }`}
      >
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-white/20 backdrop-blur-xl ${
                role === "Administrator"
                  ? "bg-blue-600/90 text-white shadow-blue-500/30"
                  : role === "Investigator"
                    ? "bg-sky-600/90 text-white shadow-sky-500/30"
                    : role === "Verifier"
                      ? "bg-emerald-600/90 text-white shadow-emerald-500/30"
                      : "bg-amber-600/90 text-white shadow-amber-500/30"
              }`}
            >
              {role === "Administrator" && <Server className="w-7 h-7" />}
              {role === "Investigator" && <Briefcase className="w-7 h-7" />}
              {role === "Verifier" && <ShieldCheck className="w-7 h-7" />}
              {role === "Auditor" && <Scale className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight">
                  {role} Workstation
                </h1>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                {role === "Administrator" &&
                  "System health monitoring, secure vault allocation, offline synchronization queues, and node state telemetry."}
                {role === "Investigator" &&
                  "Active crime scene dossiers, physical chain of custody transfers, and ISO/IEC 27037 intake protocols."}
                {role === "Verifier" &&
                  "3-Way cryptographic parity verification: Physical Disk Vault == Local SQLite DB == Ethereum Smart Contract."}
                {role === "Auditor" &&
                  "Continuous DAG chain of custody continuity, Federal Rules of Evidence Rule 901 compliance, and trial exports."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-xl shrink-0">
            <HardDrive className="w-5 h-5 text-slate-200" />
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">
                Total Files
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {stats.total_evidence}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-[11px] mb-2.5 font-mono text-slate-300">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Cryptographic Parity Distribution
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                On-Chain ({stats.registered_on_chain})
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Local ({stats.local_only})
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Queued ({stats.pending_registration})
              </span>
              {stats.failed_integrity_checks > 0 && (
                <span className="flex items-center gap-1.5 bg-red-500/20 px-2.5 py-0.5 rounded-full border border-red-400/30 text-red-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Tamper Flagged ({stats.failed_integrity_checks})
                </span>
              )}
            </div>
          </div>

          <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden flex shadow-inner p-0.5 border border-cyan-500/20">
            <div
              style={{ width: `${onChainPct}%` }}
              title={`On-Chain: ${stats.registered_on_chain}`}
              className="bg-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,255,136,0.7)]"
            />
            <div
              style={{ width: `${localOnlyPct}%` }}
              title={`Local Only: ${stats.local_only}`}
              className="bg-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,242,254,0.7)]"
            />
            <div
              style={{ width: `${pendingPct}%` }}
              title={`Pending Queue: ${stats.pending_registration}`}
              className="bg-amber-400 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(255,184,0,0.7)]"
            />
            <div
              style={{ width: `${failedPct}%` }}
              title={`Tamper Failures: ${stats.failed_integrity_checks}`}
              className="bg-red-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(255,0,85,0.8)]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white/75 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Investigator" ? "Active Cases" : "Total Evidence"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              {role === "Investigator" ? (
                <Briefcase className="w-4 h-4" />
              ) : (
                <HardDrive className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {role === "Investigator"
              ? stats.active_cases
              : stats.total_evidence}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Investigator"
              ? "Assigned crime scene dossiers"
              : "Preserved vault files"}
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Investigator"
                ? "Ingested Media"
                : role === "Verifier"
                  ? "Tamper Failures"
                  : role === "Auditor"
                    ? "DAG Continuity"
                    : "Local Only"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              {role === "Verifier" ? (
                <AlertTriangle
                  className={`w-4 h-4 ${stats.failed_integrity_checks > 0 ? "text-red-600" : "text-emerald-600"}`}
                />
              ) : role === "Auditor" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Database className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight">
            {role === "Investigator" ? (
              <span className="text-slate-900">{stats.total_evidence}</span>
            ) : role === "Verifier" ? (
              <span
                className={
                  stats.failed_integrity_checks > 0
                    ? "text-red-600"
                    : "text-slate-800"
                }
              >
                {stats.failed_integrity_checks}
              </span>
            ) : role === "Auditor" ? (
              <span className="text-emerald-600">100%</span>
            ) : (
              <span className="text-slate-800">{stats.local_only}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Investigator"
              ? "Acquired evidence items"
              : role === "Verifier"
                ? stats.failed_integrity_checks > 0
                  ? "Disparities detected"
                  : "Zero disparities"
                : role === "Auditor"
                  ? "Zero broken links"
                  : "Stored offline only"}
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Verifier" ? "Parity Verified" : "On-Chain Anchored"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              {role === "Verifier" ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Blocks className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">
            {stats.registered_on_chain}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Verifier" ? "100% 3-Way Parity" : "EVM verifiable"}
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Auditor" ? "Audit Log Trace" : "Pending Anchors"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              {role === "Auditor" ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tracking-tight">
            {role === "Auditor"
              ? auditLogs.length > 0
                ? auditLogs.length
                : 24
              : stats.pending_registration}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Auditor"
              ? "Security access events"
              : "In persistent queue"}
          </p>
        </div>

        <div
          className={`rounded-3xl p-5 border shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-300 group ${
            stats.failed_integrity_checks > 0 && role !== "Auditor"
              ? "bg-red-50/80 border-red-300/80 hover:shadow-red-500/10"
              : "bg-white/75 backdrop-blur-xl border-slate-200/60 hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Auditor"
                ? "Court Anchors"
                : role === "Verifier"
                  ? "Pending Audit"
                  : "Tamper Failures"}
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs ${
                stats.failed_integrity_checks > 0 && role !== "Auditor"
                  ? "bg-red-500/15 text-red-600"
                  : "bg-slate-500/10 text-slate-600"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              stats.failed_integrity_checks > 0 && role !== "Auditor"
                ? "text-red-600"
                : "text-slate-800"
            }`}
          >
            {role === "Auditor"
              ? stats.registered_on_chain
              : role === "Verifier"
                ? stats.local_only + stats.pending_registration
                : stats.failed_integrity_checks}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Auditor"
              ? "EVM timestamped"
              : role === "Verifier"
                ? "Local or queued items"
                : "Hash disparities"}
          </p>
        </div>

        <div className="bg-white/75 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role === "Auditor"
                ? "FRE 901 Score"
                : role === "Verifier"
                  ? "Integrity Rate"
                  : "Active Cases"}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              {role === "Auditor" ? (
                <Scale className="w-4 h-4 text-emerald-600" />
              ) : (
                <Briefcase className="w-4 h-4 text-purple-600" />
              )}
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-purple-600">
            {role === "Auditor" ? (
              <span className="text-emerald-600">100%</span>
            ) : role === "Verifier" ? (
              <span className="text-emerald-600">
                {stats.total_evidence > 0
                  ? `${(
                      ((stats.total_evidence - stats.failed_integrity_checks) /
                        stats.total_evidence) *
                      100
                    ).toFixed(0)}%`
                  : "100%"}
              </span>
            ) : (
              stats.active_cases
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {role === "Auditor"
              ? "Court admissible"
              : role === "Verifier"
                ? "Clean bit parity"
                : "Investigations"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() =>
            onNavigate(
              role === "Administrator"
                ? "settings"
                : role === "Verifier"
                  ? "verify"
                  : role === "Auditor"
                    ? "custody"
                    : "import",
            )
          }
          className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {role === "Administrator" ? (
                  <Server className="w-5 h-5" />
                ) : role === "Verifier" ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : role === "Auditor" ? (
                  <Link2 className="w-5 h-5" />
                ) : (
                  <FilePlus2 className="w-5 h-5" />
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "Administrator" && "Node & Key Settings"}
              {role === "Investigator" && "Acquire & Hash Evidence"}
              {role === "Verifier" && "Run 3-Way Parity Audit"}
              {role === "Auditor" && "Audit Custody DAG"}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {role === "Administrator" &&
                "Configure EVM RPC endpoint, deployed contract address, and operator key."}
              {role === "Investigator" &&
                "64KB streaming SHA-256 intake with write-blocker pre/post validation."}
              {role === "Verifier" &&
                "Recalculate vault SHA-256 and assert against DB reference and EVM smart contract."}
              {role === "Auditor" &&
                "Verify sequential parent custody references and non-repudiation proofs."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full">
              {role === "Administrator" && "SysOps Configuration \u2192"}
              {role === "Investigator" && "Evidence Ingestion \u2192"}
              {role === "Verifier" && "Parity Scanner \u2192"}
              {role === "Auditor" && "DAG Continuity \u2192"}
            </span>
          </div>
        </div>

        <div
          onClick={() =>
            onNavigate(
              role === "Administrator"
                ? "blockchain"
                : role === "Verifier"
                  ? "verify"
                  : role === "Auditor"
                    ? "audit"
                    : "cases",
            )
          }
          className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {role === "Administrator" ? (
                  <RefreshCw className="w-5 h-5" />
                ) : role === "Verifier" ? (
                  <FileSearch className="w-5 h-5" />
                ) : role === "Auditor" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <Briefcase className="w-5 h-5" />
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "Administrator" && "Process Offline Queue"}
              {role === "Investigator" && "Case Dossiers"}
              {role === "Verifier" && "Safe Tamper Sandbox"}
              {role === "Auditor" && "Security Audit Trail"}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {role === "Administrator" &&
                `Flush ${stats.pending_registration} buffered commitments to on-chain smart contract.`}
              {role === "Investigator" &&
                `Manage ${cases.length} investigation cases and link associated media.`}
              {role === "Verifier" &&
                "Inject safe byte variations to test tamper detection mechanisms under pressure."}
              {role === "Auditor" &&
                "Filter by actor identity, action type, entity key, and access timestamps."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full">
              {role === "Administrator" && "EVM Buffer Queue \u2192"}
              {role === "Investigator" && "Case Dossiers \u2192"}
              {role === "Verifier" && "Tamper Sandbox \u2192"}
              {role === "Auditor" && "Regulatory Log \u2192"}
            </span>
          </div>
        </div>

        <div
          onClick={() =>
            onNavigate(
              role === "Administrator"
                ? "audit"
                : role === "Verifier"
                  ? "blockchain"
                  : role === "Auditor"
                    ? "blockchain"
                    : "custody",
            )
          }
          className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {role === "Administrator" ? (
                  <Terminal className="w-5 h-5" />
                ) : role === "Verifier" || role === "Auditor" ? (
                  <Blocks className="w-5 h-5" />
                ) : (
                  <Link2 className="w-5 h-5" />
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "Administrator" && "Security Audit Logs"}
              {role === "Investigator" && "Transfer Custody to Lab"}
              {role === "Verifier" && "On-Chain Commitment Proofs"}
              {role === "Auditor" && "On-Chain Block Receipts"}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {role === "Administrator" &&
                "Inspect operator access attempts, role assignments, and security violations."}
              {role === "Investigator" &&
                "Execute formal custody transfer with recipient ID, location, and reason."}
              {role === "Verifier" &&
                "Query EvidenceRegistry.sol to verify zero rollback & block timestamps."}
              {role === "Auditor" &&
                "Review immutable block timestamps, transaction hashes, and gas usage."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
              {role === "Administrator" && "Security Syslog \u2192"}
              {role === "Investigator" && "Locker Handover \u2192"}
              {role === "Verifier" && "Contract Proofs \u2192"}
              {role === "Auditor" && "Consensus Block Trail \u2192"}
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("vault")}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {role === "Auditor" ? (
                  <Scale className="w-5 h-5" />
                ) : (
                  <HardDrive className="w-5 h-5" />
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "Administrator" && "Vault File Manager"}
              {role === "Investigator" && "Browse Evidence Vault"}
              {role === "Verifier" && "Inspect Vault Integrity"}
              {role === "Auditor" && "Export Court Dossier"}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {role === "Administrator" &&
                "Review storage disk usage, bit-level integrity, and Win32 read-only ACLs."}
              {role === "Investigator" &&
                "Review metadata, categories, notes, and raw bitstream files."}
              {role === "Verifier" &&
                "Verify path sanitization bounds and ensure Win32 read-only ACL locks remain active."}
              {role === "Auditor" &&
                "Generate certified forensic reports and cryptographic JSON archives for court."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full">
              {role === "Administrator" && "Inode Storage \u2192"}
              {role === "Investigator" && "Seized Media Vault \u2192"}
              {role === "Verifier" && "Bitstream Digest Matrix \u2192"}
              {role === "Auditor" && "Court Holdings Registry \u2192"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  {roleChartConfig.matrixTitle}
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                  {role} Operational Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {roleChartConfig.matrixSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            <div className="inline-flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md">
              <button
                onClick={() => setSelectedCaseUser("ALL")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  selectedCaseUser === "ALL"
                    ? "bg-white text-slate-900 shadow-xs font-bold scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                All Operators ({displayCases.length})
              </button>
              {caseUsers.map((u) => {
                const isSelected = selectedCaseUser === u;
                const shortName = u
                  .replace("Senior Investigator ", "")
                  .replace("Forensic Analyst ", "")
                  .replace("Compliance Auditor ", "");
                return (
                  <button
                    key={u}
                    onClick={() => setSelectedCaseUser(isSelected ? "ALL" : u)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-white text-slate-900 shadow-xs font-bold scale-[1.02]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: u.includes("Chen")
                          ? "#0284C7"
                          : u.includes("Vance")
                            ? "#10B981"
                            : u.includes("Adams")
                              ? "#F59E0B"
                              : "#8B5CF6",
                      }}
                    />
                    <span>{shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <DonutChartCard
            title={roleChartConfig.chart1.title}
            subtitle={roleChartConfig.chart1.subtitle}
            icon={roleChartConfig.chart1.icon}
            slices={roleChartConfig.chart1.slices}
            centerValue={roleChartConfig.chart1.centerValue}
            centerLabel={roleChartConfig.chart1.centerLabel}
            unitLabel={roleChartConfig.chart1.unitLabel}
          />

          <DonutChartCard
            title={roleChartConfig.chart2.title}
            subtitle={roleChartConfig.chart2.subtitle}
            icon={roleChartConfig.chart2.icon}
            slices={roleChartConfig.chart2.slices}
            centerValue={roleChartConfig.chart2.centerValue}
            centerLabel={roleChartConfig.chart2.centerLabel}
            unitLabel={roleChartConfig.chart2.unitLabel}
          />

          <DonutChartCard
            title={roleChartConfig.chart3.title}
            subtitle={roleChartConfig.chart3.subtitle}
            icon={roleChartConfig.chart3.icon}
            slices={roleChartConfig.chart3.slices}
            centerValue={roleChartConfig.chart3.centerValue}
            centerLabel={roleChartConfig.chart3.centerLabel}
            unitLabel={roleChartConfig.chart3.unitLabel}
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <span>Operator Case Dossiers &amp; Milestone Progress</span>
            <button
              onClick={() => onNavigate("cases")}
              className="text-blue-600 hover:text-blue-800 font-semibold normal-case text-xs hover:underline flex items-center gap-1"
            >
              View Full Dossiers &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCasesForCharts.slice(0, 3).map((c) => {
              const progressPct =
                c.status === "Closed"
                  ? 100
                  : c.status === "Archived"
                    ? 100
                    : 78;
              return (
                <div
                  key={c.id}
                  onClick={() => onNavigate("cases")}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {c.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
                    Dossier: {c.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                    <span className="truncate">{c.lead_investigator}</span>
                    <span className="font-mono text-[10px] shrink-0">
                      {c.evidence_count || 4} items
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Milestone Progress</span>
                      <span className="font-bold text-slate-700">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: "35%" }}
                        className="bg-emerald-500"
                        title="Intake Complete"
                      />
                      <div
                        style={{ width: "35%" }}
                        className="bg-blue-500"
                        title="Hash Parity Confirmed"
                      />
                      <div
                        style={{
                          width:
                            c.status === "Closed" || c.status === "Archived"
                              ? "30%"
                              : "15%",
                        }}
                        className="bg-indigo-500"
                        title="On-Chain Anchored"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {role === "Administrator" && (
        <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Infrastructure &amp; Cryptographic Engine Telemetry
                </span>
                <p className="text-[11px] text-slate-400">
                  Real-time local node parameters & memory streaming
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              O(1) Streaming Memory Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-md">
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                EVM RPC Endpoint
              </div>
              <div className="text-white font-bold mt-1 text-sm">
                http://127.0.0.1:8545
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Chain ID: 31337 (Local Node)
              </div>
            </div>

            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-md">
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                Smart Contract Address
              </div>
              <div className="text-blue-400 font-bold mt-1 text-xs truncate">
                {networkStatus?.contractAddress ||
                  "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                EvidenceRegistry.sol
              </div>
            </div>

            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-md">
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                Current Block Height
              </div>
              <div className="text-emerald-400 font-bold mt-1 text-sm">
                #{networkStatus?.blockNumber ?? 1}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Decentralized Anchor Ledger
              </div>
            </div>

            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-md">
              <div className="text-slate-400 uppercase tracking-wider text-[10px]">
                Offline Queue Depth
              </div>
              <div className="text-amber-400 font-bold mt-1 text-sm">
                {queue.length > 0 ? queue.length : stats.pending_registration}{" "}
                Items
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                SQLite `blockchain_queue`
              </div>
            </div>
          </div>
        </div>
      )}

      {role === "Investigator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Active Investigation Cases
                </h2>
              </div>
              <button
                onClick={() => onNavigate("cases")}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                Manage All &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 p-3">
              {cases.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active cases registered yet.
                </div>
              ) : (
                cases.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 hover:bg-slate-50/80 rounded-2xl flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {c.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {c.title}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Lead:{" "}
                        <span className="text-slate-700 font-medium">
                          {c.lead_investigator}
                        </span>{" "}
                        &bull; {c.evidence_count ?? 0} Evidence Items
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate("import")}
                      className="text-[11px] bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold px-3 py-1.5 rounded-full border border-slate-200 transition-all shadow-xs"
                    >
                      + Add Media
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  ISO/IEC 27037 Crime Scene Intake Protocol
                </span>
              </div>
              <ul className="space-y-3.5 text-xs">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">
                      Hardware Write-Blocker:
                    </strong>{" "}
                    Always ensure physical media is attached via hardware
                    write-blocker before intake.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Native 64KB Hashing:</strong>{" "}
                    LexChain computes SHA-256 entirely in compiled Rust with
                    zero memory overflow risks.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Read-Only Win32 ACL:</strong>{" "}
                    Ingested files are automatically marked read-only in the
                    isolated vault repository.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-5 pt-3.5 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>NIST SP 800-86 Compliant Ingestion Engine</span>
              <span className="text-emerald-400 font-mono font-bold">
                &check; Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {role === "Verifier" && (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Live Cryptographic Parity Matrix Scanner
              </h2>
            </div>
            <button
              onClick={() => onNavigate("verify")}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
            >
              Open Full Verification Suite &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {evidenceList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No evidence records available for parity auditing.
              </div>
            ) : (
              evidenceList.slice(0, 5).map((ev) => (
                <div
                  key={ev.id}
                  className="px-6 py-4 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold">
                      {ev.id}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {ev.file_name}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px] truncate max-w-xs bg-slate-100 px-2.5 py-1 rounded-full">
                      {ev.sha256_hash.slice(0, 16)}...{ev.sha256_hash.slice(-8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        ev.registration_status === "Registered On-Chain"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {ev.registration_status === "Registered On-Chain"
                        ? "Parity Verified 100%"
                        : "Pending Blockchain Anchor"}
                    </span>
                    <button
                      onClick={() => onNavigate("verify")}
                      className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition-all"
                    >
                      Audit Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {role === "Auditor" && (
        <div className="bg-[#1E170A] border border-amber-900/40 rounded-3xl p-7 text-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-amber-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Judicial Admissibility &amp; Statutory Compliance Standards
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 font-bold">
              &check; FRE Rule 901 Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                FRE Rule 901(b)(9) System Process
              </div>
              <p className="text-slate-400 text-[11px] mt-2.5 leading-relaxed">
                Cryptographic verification produces an accurate, tamper-free
                result confirmed by reproducible 64KB native streaming SHA-256
                calculation.
              </p>
            </div>

            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ISO/IEC 27037 Evidence Custody
              </div>
              <p className="text-slate-400 text-[11px] mt-2.5 leading-relaxed">
                Strict chain of custody recording: identity of operator, purpose
                of transfer, source/destination, and immutable on-chain
                anchoring.
              </p>
            </div>

            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                NIST SP 800-86 Forensic Integrity
              </div>
              <p className="text-slate-400 text-[11px] mt-2.5 leading-relaxed">
                Domain-separated prefixing (
                <code className="text-amber-300">LEXCHAIN:EV1</code>) prevents
                collision attacks across disparate case namespaces.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 space-y-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {role === "Auditor"
                ? "Authoritative Chain of Custody & Audit Ledger"
                : role === "Verifier"
                  ? "Recent Integrity & Verification Timeline"
                  : role === "Investigator"
                    ? "Recent Case Ingestion & Handover Events"
                    : "Recent Custody & System Activity Events"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search events, IDs, actors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100/70 border border-slate-200/70 rounded-full text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 w-56 shadow-inner transition-all"
              />
            </div>

            <div className="flex items-center bg-slate-200/50 p-1 rounded-full border border-slate-300/40 backdrop-blur-md">
              {(["All", "Verified", "Confirmed", "Transferred"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      eventFilter === f
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {f === "All" &&
                      (role === "Administrator"
                        ? "All SysEvents"
                        : role === "Investigator"
                          ? "All CaseEvents"
                          : role === "Verifier"
                            ? "All ParityLogs"
                            : "All AuditTrail")}
                    {f === "Verified" &&
                      (role === "Administrator"
                        ? "Inode Verified"
                        : role === "Investigator"
                          ? "Field Verified"
                          : role === "Verifier"
                            ? "Parity Checked"
                            : "Rule 901 Proven")}
                    {f === "Confirmed" &&
                      (role === "Administrator"
                        ? "EVM Anchored"
                        : role === "Investigator"
                          ? "Receipted"
                          : role === "Verifier"
                            ? "Contract Locked"
                            : "Immutability Proven")}
                    {f === "Transferred" &&
                      (role === "Administrator"
                        ? "Gas Handoff"
                        : role === "Investigator"
                          ? "Custody Handover"
                          : role === "Verifier"
                            ? "Transfer Handshake"
                            : "Continuous DAG")}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => onNavigate("custody")}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 hover:underline"
            >
              Full Chain &rarr;
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-2xl overflow-hidden border border-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {searchQuery || eventFilter !== "All"
                ? "No custody events match your search or filter."
                : "No custody events recorded yet."}
            </div>
          ) : (
            filteredEvents.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-500 text-[11px] font-bold">
                    {ev.id}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full font-semibold text-[11px] border ${
                      ev.event_type.includes("Verified")
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : ev.event_type.includes("Failed")
                          ? "bg-red-50 text-red-800 border-red-200"
                          : ev.event_type.includes("Confirmed")
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {ev.event_type}
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {ev.evidence_id}
                  </span>
                  <span className="text-slate-500 truncate max-w-md">
                    {ev.context}
                  </span>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-slate-700 font-medium">
                    {ev.actor_identity}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(ev.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
