import { useState } from "react";
import { ScrollText, Search, Download, Filter, FileText, CheckCircle2 } from "lucide-react";
import { AuditLog, AuthUser, UserRole } from "../../types";
import { generateAuditSheetPdf } from "../../services/pdfExport";

interface AuditLogsViewProps {
  logs: AuditLog[];
  currentUser?: AuthUser | null;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const actions = [
    "ALL",
    "INITIALIZE_DATABASE",
    "REGISTER_EVIDENCE",
    "VERIFY_EVIDENCE",
    "CREATE_CASE",
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor_identity.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_id &&
        log.entity_id.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleExportPdf = () => {
    generateAuditSheetPdf(filteredLogs, currentUser, actionFilter);
    setPdfGenerated(true);
    setTimeout(() => setPdfGenerated(false), 3000);
  };

  const exportAuditTrail = () => {
    const data = {
      title: "LEXCHAIN SYSTEM SECURITY AUDIT TRAIL",
      exportedAt: new Date().toISOString(),
      totalEntries: filteredLogs.length,
      auditRecords: filteredLogs,
      verificationNotice:
        "Audit logs are stored in append-only SQLite tables with operator role attribution.",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LexChain_AuditTrail_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6 max-h-full flex flex-col overflow-hidden bg-[#F5F5F7]">
      <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/[0.08] text-slate-200 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.14)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${
              role === "Administrator"
                ? "bg-gradient-to-tr from-blue-600 to-indigo-500 text-white"
                : role === "Investigator"
                  ? "bg-gradient-to-tr from-sky-600 to-cyan-500 text-white"
                  : role === "Verifier"
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                    : "bg-gradient-to-tr from-amber-600 to-orange-500 text-white"
            }`}
          >
            {role[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {role} Audit Scope & Parameters
              </span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {role === "Administrator" && "SYS-SECURITY & PRIVILEGED OPS"}
                {role === "Investigator" && "CRIME SCENE EVIDENCE ACTIVITY"}
                {role === "Verifier" && "CRYPTOGRAPHIC CHECK ATTRIBUTION"}
                {role === "Auditor" && "NIST SP 800-86 / FRE 901 AUDIT TRAIL"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {role === "Administrator" &&
                "Privileged operator actions, database initialization, role switching, vault alterations, and EVM synchronization."}
              {role === "Investigator" &&
                "Evidence acquisition logs, case dossier bindings, chain transfers, and investigator timestamps."}
              {role === "Verifier" &&
                "Cryptographic hash recalculation logs, parity audit outcomes, and tamper discrepancy alerts."}
              {role === "Auditor" &&
                "Full statutory compliance ledger \u2022 NIST SP 800-86 integrity \u2022 Non-repudiation verified."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-3.5 py-1.5 rounded-full border bg-white/[0.06] border-white/[0.1] text-slate-300">
            Records:{" "}
            <span className="text-blue-400 font-bold">
              {filteredLogs.length}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <ScrollText className="w-4 h-4" />
            </div>
            Security & Forensics Audit Trail
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Authoritative log of privileged operations, evidence acquisitions,
            and cryptographic checks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            {pdfGenerated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>PDF Generated!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {role === "Administrator" && "Generate Audit Sheet (PDF)"}
                  {role === "Investigator" && "Generate Evidence Log Sheet (PDF)"}
                  {role === "Verifier" && "Generate Cryptographic Audit (PDF)"}
                  {role === "Auditor" && "Generate Statutory FRE 901 Audit Sheet (PDF)"}
                </span>
              </>
            )}
          </button>
          <button
            onClick={exportAuditTrail}
            title="Download Raw JSON Log"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 rounded-full text-xs font-medium border border-slate-200/60 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, details, entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300/80 rounded-full focus:border-blue-500 focus:outline-none bg-slate-50/50 text-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-300/80 rounded-full px-3 py-1.5 text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/60 border-b border-slate-200/60 text-slate-600 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-5 py-3.5">Log ID</th>
                <th className="px-5 py-3.5">Timestamp (UTC)</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Operator / Actor</th>
                <th className="px-5 py-3.5">Entity Ref</th>
                <th className="px-5 py-3.5">Forensic Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-400 font-sans"
                  >
                    No audit records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-slate-500 font-bold">
                      {log.id}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      <span className="bg-slate-200/60 text-slate-800 border border-slate-300/60 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-900 font-medium">
                      {log.actor_identity}
                    </td>
                    <td className="px-5 py-3.5 text-blue-700 font-bold">
                      {log.entity_id || "-"}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-700 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
          Total Log Entries: {filteredLogs.length}
        </div>
      </div>
    </div>
  );
};
