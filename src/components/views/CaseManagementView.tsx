import { useState } from "react";
import {
  Briefcase,
  Plus,
  HardDrive,
  Download,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";
import { Case, Evidence, AuthUser, UserRole } from "../../types";
import { api } from "../../services/api";

interface CaseManagementViewProps {
  cases: Case[];
  evidenceList: Evidence[];
  onRefreshCases: () => void;
  onSelectEvidence: (evidence: Evidence) => void;
  onNavigateImportForCase: (caseId: string) => void;
  currentUser?: AuthUser | null;
}

export const CaseManagementView: React.FC<CaseManagementViewProps> = ({
  cases,
  evidenceList,
  onRefreshCases,
  onSelectEvidence,
  onNavigateImportForCase,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    cases.length > 0 ? cases[0].id : "",
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCaseId, setNewCaseId] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseDesc, setNewCaseDesc] = useState("");
  const [newCaseLead, setNewCaseLead] = useState("Senior Investigator Chen");
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const caseEvidence = evidenceList.filter((e) => e.case_id === selectedCaseId);

  const handleOpenCreateModal = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewCaseId(`CASE-2026-${randomSuffix}`);
    setNewCaseTitle("");
    setNewCaseDesc("");
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newCaseId.trim() || !newCaseTitle.trim()) {
      setCreateError("Case ID and Title are required.");
      return;
    }

    try {
      await api.createCase(
        newCaseId.trim(),
        newCaseTitle.trim(),
        newCaseDesc.trim(),
        newCaseLead.trim(),
      );
      setShowCreateModal(false);
      onRefreshCases();
      setSelectedCaseId(newCaseId.trim());
    } catch (err: any) {
      setCreateError(
        typeof err === "string" ? err : err.message || "Failed to create case.",
      );
    }
  };

  const exportCaseSummary = () => {
    if (!selectedCase) return;

    const summary = {
      title: "LEXCHAIN OFFICIAL INVESTIGATION CASE DOSSIER",
      generatedAt: new Date().toISOString(),
      caseDetails: selectedCase,
      associatedEvidenceCount: caseEvidence.length,
      associatedEvidence: caseEvidence.map((e) => ({
        id: e.id,
        fileName: e.file_name,
        fileSize: e.file_size,
        category: e.category,
        sha256Hash: e.sha256_hash,
        registrationStatus: e.registration_status,
        onChainCommitment: e.on_chain_commitment,
        acquisitionDate: e.acquisition_date,
        collector: e.collector_identity,
      })),
      complianceNotes:
        "Local case metadata is maintained in encrypted/controlled application storage. Confidential case descriptions are strictly preserved locally and never broadcasted unencrypted to public blockchain layers.",
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LexChain_Case_${selectedCase.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6 max-h-full overflow-y-auto bg-[#F5F5F7]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
            Investigation Dossiers & Case Associations
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Segregate evidence collections under authorized case identifiers and
            custody scopes.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>
            {role === "Administrator" && "New Storage Quota Case"}
            {role === "Investigator" && "New Investigation Case"}
            {role === "Verifier" && "Register Parity Case"}
            {role === "Auditor" && "File Judicial Case Docket"}
          </span>
        </button>
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
                {role} Dossier Scope & Parameters
              </span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {role === "Administrator" && "STORAGE QUOTA & RETENTION LOCKS"}
                {role === "Investigator" && "CRIME SCENE INVESTIGATIVE LEADS"}
                {role === "Verifier" && "DOSSIER PARITY AUDIT RATIO"}
                {role === "Auditor" && "JUDICIAL DOCKETS & LEGAL HOLDS"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {role === "Administrator" &&
                "Storage allocation: 50.0 GB per dossier \u2022 Security Level: Restricted \u2022 Immutable Deletion Policy: Active"}
              {role === "Investigator" &&
                "Active dossiers, rapid evidence association, field lead attribution, and crime scene tags."}
              {role === "Verifier" &&
                "Cryptographic parity ratio: 100% Verified \u2022 Tamper alerts: 0 active \u2022 Unverified items: 0"}
              {role === "Auditor" &&
                "Judicial Case Docketing \u2022 Court Jurisdiction: US Federal District \u2022 Chain of Custody Completeness: 100%"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-3.5 py-1.5 rounded-full border bg-white/[0.06] border-white/[0.1] text-slate-300">
            Selected:{" "}
            <span className="text-blue-400 font-bold">
              {selectedCaseId || "None"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-100/60 border-b border-slate-200/60 text-xs font-semibold text-slate-700 uppercase tracking-wider flex justify-between items-center backdrop-blur-md">
            <span>Investigation Cases ({cases.length})</span>
          </div>

          <div className="p-3 divide-y divide-slate-100/80 overflow-y-auto max-h-[600px] space-y-1">
            {cases.map((c) => {
              const isSelected = c.id === selectedCaseId;
              const count = evidenceList.filter(
                (e) => e.case_id === c.id,
              ).length;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer text-xs transition-all duration-200 ${
                    isSelected
                      ? "bg-blue-500/10 border border-blue-500/30 shadow-xs"
                      : "hover:bg-slate-100/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">
                      {c.id}
                    </span>
                    <span className="text-[10px] bg-slate-200/60 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                      {count} items
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 mt-1.5 truncate text-[13px]">
                    {c.title}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {c.lead_investigator}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />{" "}
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedCase ? (
            <>
              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-blue-700 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        {selectedCase.id}
                      </span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        {selectedCase.status}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 mt-2">
                      {selectedCase.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={exportCaseSummary}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 rounded-full text-xs font-medium border border-slate-200/60 transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {role === "Administrator" && "Export Inode Allocation"}
                        {role === "Investigator" && "Export Case Dossier"}
                        {role === "Verifier" && "Export Parity Report"}
                        {role === "Auditor" && "Generate Docket Admissibility"}
                      </span>
                    </button>
                    <button
                      onClick={() => onNavigateImportForCase(selectedCase.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {role === "Administrator" && "Allocate Evidence"}
                        {role === "Investigator" && "Acquire & Add Evidence"}
                        {role === "Verifier" && "Queue Parity Evidence"}
                        {role === "Auditor" && "Attach Court Exhibit"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-2 text-slate-700">
                  <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Case Description & Forensic Scope
                  </div>
                  <p className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 text-slate-800 leading-relaxed">
                    {selectedCase.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Lead Investigator:
                    </span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {selectedCase.lead_investigator}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Case Created Date:
                    </span>
                    <div className="font-mono text-slate-900 mt-0.5">
                      {new Date(selectedCase.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-6 py-4 bg-slate-100/60 border-b border-slate-200/60 flex items-center justify-between backdrop-blur-md">
                  <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-600" />
                    Associated Evidence Collection ({caseEvidence.length})
                  </div>
                </div>

                <div className="divide-y divide-slate-100/80 text-xs">
                  {caseEvidence.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                      No evidence has been associated with this case yet. Click
                      "Add Evidence" above to import files into this case.
                    </div>
                  ) : (
                    caseEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onSelectEvidence(ev)}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {ev.id}
                            </span>
                            <span className="font-medium text-slate-800">
                              &bull; {ev.file_name}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {ev.category}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 truncate max-w-lg">
                            SHA-256: {ev.sha256_hash}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              ev.registration_status === "Registered On-Chain"
                                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {ev.registration_status}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            {new Date(ev.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              Select a case from the left column or create a new case to view
              evidence.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-3xl rounded-3xl border border-white/60 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#141416] text-white flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Initialize New Case Dossier
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Unique Case ID *
                </label>
                <input
                  type="text"
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Operation Northern Vault Investigation"
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Lead Investigator *
                </label>
                <input
                  type="text"
                  value={newCaseLead}
                  onChange={(e) => setNewCaseLead(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Case Description
                </label>
                <textarea
                  rows={3}
                  value={newCaseDesc}
                  onChange={(e) => setNewCaseDesc(e.target.value)}
                  placeholder="Scope of investigation, jurisdiction, target entity, authorization warrant..."
                  className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300/80 rounded-full font-medium text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-sm transition-all active:scale-95"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
