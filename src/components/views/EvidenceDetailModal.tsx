import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Link2,
  Blocks,
  Download,
  FileText,
} from "lucide-react";
import { CustodyEvent, Evidence, VerificationRecord } from "../../types";
import { api } from "../../services/api";
import { generateEvidenceDossierPdf } from "../../services/pdfExport";

interface EvidenceDetailModalProps {
  evidence: Evidence;
  onClose: () => void;
  onVerify: (evidenceId: string) => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  evidence,
  onClose,
  onVerify,
}) => {
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<
    VerificationRecord[]
  >([]);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedCommitment, setCopiedCommitment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "custody" | "verifications"
  >("overview");

  useEffect(() => {
    loadDetails();
  }, [evidence.id]);

  const loadDetails = async () => {
    try {
      const [events, verifs] = await Promise.all([
        api.getCustodyEvents(evidence.id),
        api.getVerificationRecords(evidence.id),
      ]);
      setCustodyEvents(events);
      setVerificationHistory(verifs);
    } catch (e) {
      console.error("Failed to load evidence details:", e);
    }
  };

  const copyText = (text: string, type: "hash" | "commitment") => {
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedCommitment(true);
      setTimeout(() => setCopiedCommitment(false), 2000);
    }
  };

  const handleExportPdf = () => {
    generateEvidenceDossierPdf(evidence, custodyEvents);
  };

  const exportReport = () => {
    const reportData = {
      title: "LEXCHAIN FORENSIC EVIDENCE DOSSIER",
      generatedAt: new Date().toISOString(),
      evidenceRecord: evidence,
      chainOfCustodyTrail: custodyEvents,
      verificationHistory: verificationHistory,
      limitations:
        "Hash verification confirms bitstream identity against the registered reference. It does not independently authenticate acquisition circumstances or physical legal chain of custody.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LexChain_Report_${evidence.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-3xl rounded-3xl border border-white/60 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-7 py-4 bg-[#141416] text-white flex items-center justify-between border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono tracking-wide text-white">
                {evidence.id} &bull; {evidence.file_name}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Case Association:{" "}
                <span className="text-blue-400 font-mono font-semibold">
                  {evidence.case_id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Dossier (PDF)</span>
            </button>
            <button
              onClick={exportReport}
              title="Download JSON Report"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => onVerify(evidence.id)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Re-Verify Hash</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-100/60 border-b border-slate-200/60 backdrop-blur-md">
          <div className="inline-flex bg-slate-200/50 p-1.5 rounded-full border border-slate-300/40 backdrop-blur-md shadow-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>Forensic Metadata & Anchors</span>
            </button>
            <button
              onClick={() => setActiveTab("custody")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === "custody"
                  ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Chain of Custody ({custodyEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("verifications")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === "verifications"
                  ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verification History ({verificationHistory.length})</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-[#141416]/95 backdrop-blur-2xl text-slate-200 p-5 rounded-3xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.14)] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Authoritative SHA-256 Digest (Vault Copy)</span>
                  <button
                    onClick={() => copyText(evidence.sha256_hash, "hash")}
                    className="flex items-center gap-1.5 hover:text-white text-blue-400 text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] transition-all"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedHash ? "Copied" : "Copy Digest"}</span>
                  </button>
                </div>
                <div className="font-mono text-sm break-all bg-black/40 p-3 rounded-2xl border border-white/[0.06] text-emerald-400 font-bold select-text">
                  {evidence.sha256_hash}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-blue-600" />
                    Blockchain Commitment & Registration
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      evidence.registration_status === "Registered On-Chain"
                        ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                        : evidence.registration_status ===
                            "Pending Registration"
                          ? "bg-amber-500/10 text-amber-800 border-amber-500/20"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {evidence.registration_status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium text-[11px]">
                        Domain-Separated Commitment:
                      </span>
                      {evidence.on_chain_commitment && (
                        <button
                          onClick={() =>
                            copyText(
                              evidence.on_chain_commitment!,
                              "commitment",
                            )
                          }
                          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                        >
                          {copiedCommitment ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedCommitment ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200/60 truncate mt-1 select-text">
                      {evidence.on_chain_commitment || "None"}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Transaction Hash:
                    </span>
                    <div className="font-mono text-[11px] text-blue-700 bg-white p-2 rounded-xl border border-slate-200/60 truncate mt-1 select-text font-semibold">
                      {evidence.tx_hash || "Awaiting On-Chain Anchor"}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Contract Address:
                    </span>
                    <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200/60 truncate mt-1 select-text">
                      {evidence.contract_address ||
                        "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Confirmation Block:
                    </span>
                    <div className="font-mono text-[11px] text-emerald-700 font-bold bg-white p-2 rounded-xl border border-slate-200/60 mt-1 select-text">
                      {evidence.block_number
                        ? `Block #${evidence.block_number}`
                        : "Not mined yet"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-xs">
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Evidence Category:
                  </span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {evidence.category}
                  </div>
                </div>
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Acquired By:
                  </span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {evidence.collector_identity}
                  </div>
                </div>
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Acquisition Date:
                  </span>
                  <div className="font-mono text-slate-900 mt-0.5">
                    {evidence.acquisition_date}
                  </div>
                </div>
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Vault Relative Path:
                  </span>
                  <div className="font-mono text-slate-900 mt-0.5 truncate select-text">
                    {evidence.stored_rel_path}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Forensic Description:
                  </span>
                  <div className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {evidence.description || "No description provided."}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Acquisition Notes:
                  </span>
                  <div className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {evidence.acquisition_notes ||
                      "Standard physical custody procedures followed."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "custody" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Append-only forensic custody trail preserved in local database:
              </div>
              <div className="relative border-l-2 border-slate-200/80 ml-4 space-y-6 py-2">
                {custodyEvents.map((ev) => (
                  <div key={ev.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-2xl p-4 text-xs space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {ev.event_type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {ev.context}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>
                          Actor:{" "}
                          <strong className="text-slate-800 font-medium">
                            {ev.actor_identity}
                          </strong>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {ev.id}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "verifications" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Recalculated integrity verification attempts and cryptographic
                comparisons:
              </div>
              <div className="space-y-3">
                {verificationHistory.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No verification records yet. Click "Re-Verify Hash" above.
                  </div>
                ) : (
                  verificationHistory.map((v) => (
                    <div
                      key={v.id}
                      className={`p-5 rounded-2xl border text-xs space-y-2.5 transition-all ${
                        v.result === "Integrity Verified"
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-rose-500/10 border-rose-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold px-3 py-1 rounded-full text-[11px] border ${
                            v.result === "Integrity Verified"
                              ? "bg-emerald-500/20 text-emerald-900 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-900 border-rose-500/30"
                          }`}
                        >
                          {v.result}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {new Date(v.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">
                        {v.details}
                      </p>
                      <div className="font-mono text-[11px] text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200/60 space-y-1">
                        <div>
                          Expected:{" "}
                          <span className="font-bold text-slate-900">
                            {v.expected_hash}
                          </span>
                        </div>
                        <div>
                          Calculated:{" "}
                          <span className="font-bold text-slate-900">
                            {v.calculated_hash}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
