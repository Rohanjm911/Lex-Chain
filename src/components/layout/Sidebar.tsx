import {
  LayoutDashboard,
  HardDrive,
  FilePlus2,
  ShieldCheck,
  Briefcase,
  Link2,
  Blocks,
  ScrollText,
  Settings,
  Shield,
  UserCheck,
} from "lucide-react";
import { AuthUser, UserRole } from "../../types";

export type NavSection =
  | "dashboard"
  | "vault"
  | "import"
  | "verify"
  | "cases"
  | "custody"
  | "blockchain"
  | "audit"
  | "settings";

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: AuthUser | null;
  onSwitchRole: (role: UserRole) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  onSwitchRole,
  pendingCount = 0,
}) => {
  const roles: UserRole[] = [
    "Administrator",
    "Investigator",
    "Verifier",
    "Auditor",
  ];
  const role = currentUser?.role || "Administrator";

  const roleNavLabels: Record<UserRole, Record<NavSection, string>> = {
    Administrator: {
      dashboard: "System Telemetry",
      vault: "Evidence Vault",
      import: "Batch System Ingestion",
      verify: "Verify Integrity",
      cases: "Storage Quota & Access",
      custody: "EVM Gas & Ledger",
      blockchain: "RPC & Queue Admin",
      audit: "Privileged SysOps Logs",
      settings: "Node & Workstation Config",
    },
    Investigator: {
      dashboard: "Field Operations Hub",
      vault: "Evidence Lockers",
      import: "Crime Scene Ingestion",
      verify: "Field Hash Verification",
      cases: "Active Case Dossiers",
      custody: "Physical Custody Handoffs",
      blockchain: "On-Chain Case Receipts",
      audit: "Evidence Activity Trail",
      settings: "Investigator Profile",
    },
    Verifier: {
      dashboard: "Cryptographic Parity Hub",
      vault: "Bitstream Digest Vault",
      import: "Dual-Hash Ingestion Lab",
      verify: "3-Way Parity Matrix",
      cases: "Tamper Discrepancy Cases",
      custody: "Transfer Parity Ledger",
      blockchain: "Smart Contract Anchors",
      audit: "Cryptographic Attributions",
      settings: "Verification Algorithms",
    },
    Auditor: {
      dashboard: "Court Admissibility Hub",
      vault: "Court Vault Holdings",
      import: "Warrant Compliance Intake",
      verify: "FRE 901 Certification",
      cases: "Judicial Case Dockets",
      custody: "Continuity DAG Analysis",
      blockchain: "Decentralized Proofs",
      audit: "Statutory Audit Records",
      settings: "Compliance & Legal Policies",
    },
  };

  const navItemDefs: { id: NavSection; icon: any; badge?: number | null }[] = [
    { id: "dashboard", icon: LayoutDashboard },
    { id: "vault", icon: HardDrive },
    { id: "import", icon: FilePlus2 },
    { id: "verify", icon: ShieldCheck },
    { id: "cases", icon: Briefcase },
    { id: "custody", icon: Link2 },
    {
      id: "blockchain",
      icon: Blocks,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { id: "audit", icon: ScrollText },
    { id: "settings", icon: Settings },
  ];

  const roleSubtitles: Record<UserRole, Record<NavSection, string>> = {
    Administrator: {
      dashboard: "Core Telemetry",
      vault: "Storage & Inodes",
      import: "System Batch Ingest",
      verify: "Node & DB Audit",
      cases: "Quotas & Permissions",
      custody: "Tx Gas & Blocks",
      blockchain: "RPC & Queue Admin",
      audit: "Privilege Syslog",
      settings: "Node Configuration",
    },
    Investigator: {
      dashboard: "Active Operations",
      vault: "Evidence Lockers",
      import: "Crime Scene Intake",
      verify: "Field Check Receipts",
      cases: "Active Dossiers",
      custody: "Physical Transfers",
      blockchain: "On-Chain Receipts",
      audit: "Evidence Activity",
      settings: "Officer Credentials",
    },
    Verifier: {
      dashboard: "Parity Scanner",
      vault: "Bitstream Digests",
      import: "Dual-Hash Ingestion",
      verify: "3-Way Parity Matrix",
      cases: "Tamper Assessment",
      custody: "Integrity Handoffs",
      blockchain: "Smart Contract Anchors",
      audit: "Discrepancy Alerts",
      settings: "Crypto Algorithms",
    },
    Auditor: {
      dashboard: "Admissibility",
      vault: "Court Vault Holdings",
      import: "Warrant Compliance",
      verify: "FRE 901 Certification",
      cases: "Judicial Dockets",
      custody: "Continuity DAG",
      blockchain: "Immutability Proofs",
      audit: "Regulatory Audit",
      settings: "Audit Policies",
    },
  };

  const roleQuickActions: Record<
    UserRole,
    { label: string; action: () => void; icon: any }[]
  > = {
    Administrator: [
      {
        label: "Flush EVM Queue",
        action: () => onSelectSection("blockchain"),
        icon: Blocks,
      },
      {
        label: "Audit Node Inodes",
        action: () => onSelectSection("verify"),
        icon: ShieldCheck,
      },
      {
        label: "Storage Quotas",
        action: () => onSelectSection("settings"),
        icon: Settings,
      },
    ],
    Investigator: [
      {
        label: "New Case Dossier",
        action: () => onSelectSection("cases"),
        icon: Briefcase,
      },
      {
        label: "Acquire Seized File",
        action: () => onSelectSection("import"),
        icon: FilePlus2,
      },
      {
        label: "Locker Transfer",
        action: () => onSelectSection("custody"),
        icon: Link2,
      },
    ],
    Verifier: [
      {
        label: "Run 3-Way Parity",
        action: () => onSelectSection("verify"),
        icon: ShieldCheck,
      },
      {
        label: "Recalculate Digester",
        action: () => onSelectSection("vault"),
        icon: HardDrive,
      },
      {
        label: "Inspect EVM Root",
        action: () => onSelectSection("blockchain"),
        icon: Blocks,
      },
    ],
    Auditor: [
      {
        label: "Examine Custody DAG",
        action: () => onSelectSection("custody"),
        icon: Link2,
      },
      {
        label: "FRE 901 Certification",
        action: () => onSelectSection("verify"),
        icon: ShieldCheck,
      },
      {
        label: "Export Court Report",
        action: () => onSelectSection("audit"),
        icon: ScrollText,
      },
    ],
  };

  const rolePillColors: Record<
    UserRole,
    { activeBg: string; tagBg: string; tagText: string; actionHover: string }
  > = {
    Administrator: {
      activeBg: "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(0,242,254,0.4)]",
      tagBg: "bg-cyan-950/90 border-cyan-500/60 shadow-[0_0_12px_rgba(0,242,254,0.2)]",
      tagText: "text-cyan-300",
      actionHover:
        "hover:bg-cyan-500/15 hover:border-cyan-500/40 text-cyan-300",
    },
    Investigator: {
      activeBg: "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(0,255,136,0.4)]",
      tagBg: "bg-emerald-950/90 border-emerald-500/60 shadow-[0_0_12px_rgba(0,255,136,0.2)]",
      tagText: "text-emerald-300",
      actionHover:
        "hover:bg-emerald-500/15 hover:border-emerald-500/40 text-emerald-300",
    },
    Verifier: {
      activeBg: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-[0_0_25px_rgba(168,85,247,0.4)]",
      tagBg: "bg-purple-950/90 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]",
      tagText: "text-purple-300",
      actionHover:
        "hover:bg-purple-500/15 hover:border-purple-500/40 text-purple-300",
    },
    Auditor: {
      activeBg: "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(255,184,0,0.4)]",
      tagBg: "bg-amber-950/90 border-amber-500/60 shadow-[0_0_12px_rgba(255,184,0,0.2)]",
      tagText: "text-amber-300",
      actionHover:
        "hover:bg-amber-500/15 hover:border-amber-500/40 text-amber-300",
    },
  };

  const currentRoleStyle = rolePillColors[role];
  const quickActions = roleQuickActions[role] || roleQuickActions.Administrator;

  return (
    <aside className="w-64 bg-[#020409]/98 backdrop-blur-2xl text-slate-300 flex flex-col h-screen border-r border-cyan-500/20 select-none shadow-[4px_0_35px_rgba(0,0,0,0.8)]">
      <div className="p-5 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-lg shadow-[0_0_25px_rgba(0,255,136,0.5)]">
            <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-wider flex items-center gap-1.5">
              LEXCHAIN
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/40 shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                SOC v1.0
              </span>
            </div>
            <p className="text-[11px] text-cyan-400/80 font-mono font-medium leading-tight mt-0.5">
              Zero-Trust Cryptographic Defense
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.08] backdrop-blur-md">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
            Profile:
          </span>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentRoleStyle.tagBg} ${currentRoleStyle.tagText}`}
          >
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500 px-3 py-1.5">
          <span>{role} Navigation</span>
          <span className="font-mono text-[9px] text-slate-500">{role}</span>
        </div>
        {navItemDefs.map((def) => {
          const Icon = def.icon;
          const isActive = activeSection === def.id;
          const label = roleNavLabels[role]?.[def.id] || def.id;
          const subParam = roleSubtitles[role]?.[def.id] || "";

          return (
            <button
              key={def.id}
              onClick={() => onSelectSection(def.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-left group ${
                isActive
                  ? `${currentRoleStyle.activeBg} text-white font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.25)]`
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                />
                <div className="min-w-0">
                  <div className="truncate leading-tight font-medium">
                    {label}
                  </div>
                  <div
                    className={`text-[9px] font-mono leading-tight truncate mt-0.5 ${isActive ? "text-white/80" : "text-slate-500 group-hover:text-slate-300"}`}
                  >
                    {subParam}
                  </div>
                </div>
              </div>
              {def.badge && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full shrink-0 ml-1.5 shadow-sm">
                  {def.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 px-3 py-1 flex items-center justify-between">
            <span>{role} Operations</span>
            <span className="text-[8px] bg-white/[0.06] text-slate-400 px-1.5 py-0.5 rounded font-mono">
              OPTS
            </span>
          </div>
          <div className="space-y-1 mt-1">
            {quickActions.map((qa, idx) => {
              const ActionIcon = qa.icon;
              return (
                <button
                  key={idx}
                  onClick={qa.action}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-transparent transition-all duration-150 text-slate-400 ${currentRoleStyle.actionHover}`}
                >
                  <ActionIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-3.5 border-t border-white/[0.08] bg-black/20">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Current Operator
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {currentUser?.id || "USR-001"}
          </span>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-2.5 text-xs backdrop-blur-xl">
          <div className="text-white font-semibold truncate px-1">
            {currentUser?.display_name || "System Operator"}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06] px-1">
            <span className="text-[11px] text-blue-400 font-semibold">
              Role:
            </span>
            <select
              value={currentUser?.role || "Administrator"}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="bg-white/[0.08] text-slate-200 border border-white/[0.12] text-[11px] rounded-lg px-2.5 py-1 focus:border-blue-400 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
};
