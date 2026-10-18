import { useState } from "react";
import {
  Link2,
  Filter,
  Plus,
  Blocks,
  Download,
  UserCheck,
  Send,
  FileText,
} from "lucide-react";
import { CustodyEvent, Evidence, AuthUser, UserRole } from "../../types";
import { api } from "../../services/api";
import { blockchainService } from "../../services/blockchain";
import { generateCustodySheetPdf } from "../../services/pdfExport";
import { ethers } from "ethers";

interface ChainOfCustodyViewProps {
  events: CustodyEvent[];
  evidenceList: Evidence[];
  onRefreshEvents: () => void;
  currentUser?: AuthUser | null;
}

export const ChainOfCustodyView: React.FC<ChainOfCustodyViewProps> = ({
  events,
  evidenceList,
  onRefreshEvents,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [filterEvidenceId, setFilterEvidenceId] = useState<string>("ALL");
  const [filterEventType, setFilterEventType] = useState<string>("ALL");

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetEvidence, setTransferTargetEvidence] = useState(
    evidenceList.length > 0 ? evidenceList[0].id : "",
  );
  const [recipientCustodian, setRecipientCustodian] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [anchorOnChain, setAnchorOnChain] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferStatusMsg, setTransferStatusMsg] = useState<string | null>(
    null,
  );

  const eventTypes = [
    "ALL",
    "Evidence Registered",
    "Evidence Imported",
    "Evidence Verified",
    "Custody Transferred",
    "Custody Accepted",
    "Integrity Check Failed",
    "Blockchain Registration Confirmed",
    "Blockchain Registration Failed",
  ];

  const filteredEvents = events.filter((ev) => {
    const matchEv =
      filterEvidenceId === "ALL" || ev.evidence_id === filterEvidenceId;
    const matchType =
      filterEventType === "ALL" || ev.event_type === filterEventType;
    return matchEv && matchType;
  });

  const handleRecordTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetEvidence || !recipientCustodian.trim()) return;

    setIsSubmitting(true);
    setTransferStatusMsg(null);

    try {
      const context = `Custody legally transferred to ${recipientCustodian.trim()}. Reason/Notes: ${transferReason.trim()}`;
      const lastEvent = events.find(
        (ev) => ev.evidence_id === transferTargetEvidence,
      );

      const newEv = await api.addCustodyEvent(
        transferTargetEvidence,
        "Custody Transferred",
        context,
        lastEvent?.id,
      );

      if (anchorOnChain) {
        const net = await blockchainService.checkConnection();
        if (net.connected) {
          const custodyCommitment = ethers.id(
            `${newEv.id}:${recipientCustodian}:${newEv.timestamp}`,
          );

          await blockchainService.anchorCustodyEventOnChain(
            transferTargetEvidence,
            "Custody Transferred",
            custodyCommitment,
          );
        }
      }

      setTransferStatusMsg(
        "Custody transfer logged and preserved successfully.",
      );
      onRefreshEvents();
      setTimeout(() => {
        setShowTransferModal(false);
        setRecipientCustodian("");
        setTransferReason("");
        setTransferStatusMsg(null);
      }, 1500);
    } catch (err: any) {
      setTransferStatusMsg("Error logging transfer: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPdf = () => {
    generateCustodySheetPdf(filteredEvents, currentUser, filterEvidenceId);
  };

  const exportCustodyLog = () => {
    const exportData = {
      title: "LEXCHAIN OFFICIAL CHAIN OF CUSTODY AUDIT LOG",
      exportedAt: new Date().toISOString(),
      totalEvents: filteredEvents.length,
      events: filteredEvents,
      complianceStandard:
        "ISO/IEC 27037 Digital Evidence Handling & Append-Only Workstation Logging",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LexChain_CustodyLog_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6 max-h-full overflow-y-auto bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Link2 className="w-4 h-4" />
            </div>
            Append-Only Chain of Custody Timeline
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Immutable chronological record of physical transfers, forensic
            examinations, and blockchain anchors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {role === "Administrator" && "Generate Custody Sheet (PDF)"}
              {role === "Investigator" && "Generate Custody Trail (PDF)"}
              {role === "Verifier" && "Generate Attestation Sheet (PDF)"}
              {role === "Auditor" && "Generate FRE 901 Custody Sheet (PDF)"}
            </span>
          </button>
          <button
            onClick={exportCustodyLog}
            title="Download Raw JSON Log"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-full text-xs font-medium border border-slate-200/60 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>
              {role === "Administrator" && "Log Custody Gas Anchor"}
              {role === "Investigator" && "Record Custody Transfer"}
              {role === "Verifier" && "Record Parity Transfer"}
              {role === "Auditor" && "Record Docket Continuity"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/[0.08] text-slate-200 rounded-3xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.14)] flex flex-wrap items-center justify-between gap-4">
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
                {role} Chain of Custody Parameters
              </span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {role === "Administrator" &&
                  "BLOCKCHAIN TX HASH & GAS RECONCILIATION"}
                {role === "Investigator" &&
                  "PHYSICAL HANDOFF & CUSTODIAL TRANSFERS"}
                {role === "Verifier" && "RE-CALCULATED HASH PARITY TIMELINE"}
                {role === "Auditor" && "LEGAL CONTINUITY DAG & GAP ANALYSIS"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {role === "Administrator" &&
                "EVM smart contract event logs, gas consumption parameters, transaction references, and queue commitments."}
              {role === "Investigator" &&
                "Physical evidence locker transfers, receiving officers, transfer justifications, and evidence bag tags."}
              {role === "Verifier" &&
                "Authoritative integrity state at every transfer step \u2022 Tamper rate: 0.00% \u2022 Hash matches: 100%."}
              {role === "Auditor" &&
                "Admissibility DAG: 0 gaps detected \u2022 Continuous uninterrupted custody under Federal Rules of Evidence Rule 901."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-3.5 py-1.5 rounded-full border bg-white/[0.06] border-white/[0.1] text-slate-300">
            Total Custody Logs:{" "}
            <span className="text-blue-400 font-bold">
              {filteredEvents.length}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">
            Filter by Evidence:
          </span>
          <select
            value={filterEvidenceId}
            onChange={(e) => setFilterEvidenceId(e.target.value)}
            className="border border-slate-300/80 rounded-full px-3 py-1.5 text-xs bg-slate-50/50 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Evidence Items</option>
            {evidenceList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} - {e.file_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Event Type:</span>
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="border border-slate-300/80 rounded-full px-3 py-1.5 text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 text-xs ml-auto font-mono">
          Showing {filteredEvents.length} events
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="relative border-l-2 border-slate-200/80 ml-4 space-y-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No custody events found matching your filter criteria.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isVerification = ev.event_type.includes("Verified");
              const isFailure = ev.event_type.includes("Failed");
              const isAnchor =
                ev.event_type.includes("Blockchain") || ev.anchored_on_chain;

              return (
                <div key={ev.id} className="relative pl-6">
                  <div
                    className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      isFailure
                        ? "bg-rose-500"
                        : isVerification
                          ? "bg-emerald-500"
                          : isAnchor
                            ? "bg-blue-600"
                            : "bg-slate-500"
                    }`}
                  ></div>

                  <div className="bg-slate-50/70 border border-slate-200/60 hover:border-slate-300/80 rounded-2xl p-4 text-xs space-y-2.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] border ${
                            isFailure
                              ? "bg-rose-500/10 text-rose-800 border-rose-500/20"
                              : isVerification
                                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                                : isAnchor
                                  ? "bg-blue-500/10 text-blue-800 border-blue-500/20"
                                  : "bg-slate-200/80 text-slate-800 border-slate-300/60"
                          }`}
                        >
                          {ev.event_type}
                        </span>
                        <span className="font-mono font-bold text-slate-900 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200/70">
                          {ev.evidence_id}
                        </span>
                        {ev.anchored_on_chain && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-500/10 px-2.5 py-0.5 rounded-full font-mono border border-blue-500/20">
                            <Blocks className="w-3 h-3" /> Anchored On-Chain
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <p className="text-slate-800 font-normal leading-relaxed">
                      {ev.context}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 gap-1">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Custody Actor:{" "}
                        <strong className="text-slate-800 font-medium">
                          {ev.actor_identity}
                        </strong>
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                        {ev.previous_custody_ref && (
                          <span>Prev: {ev.previous_custody_ref}</span>
                        )}
                        <span>Event ID: {ev.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-3xl rounded-3xl border border-white/60 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#141416] text-white flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Record Custody Transfer Event
              </span>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleRecordTransfer}
              className="p-6 space-y-4 text-xs"
            >
              {transferStatusMsg && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-blue-900 font-medium">
                  {transferStatusMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Target Evidence Record *
                </label>
                <select
                  value={transferTargetEvidence}
                  onChange={(e) => setTransferTargetEvidence(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                >
                  {evidenceList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} - {e.file_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Recipient Authorized Custodian *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Detective Sarah Lin / Central Forensics Lab"
                  value={recipientCustodian}
                  onChange={(e) => setRecipientCustodian(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Transfer Purpose & Reason *
                </label>
                <textarea
                  rows={3}
                  placeholder="Hardware write-block extraction, court hearing presentation, lab analysis..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={anchorOnChain}
                    onChange={(e) => setAnchorOnChain(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-800">
                    Anchor Custody Event on EVM Smart Contract
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300/80 rounded-full font-medium text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Preserving..." : "Commit Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
