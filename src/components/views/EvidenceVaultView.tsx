import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  HardDrive,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Blocks,
  AlertTriangle,
  UserCheck,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Scale,
  Award,
} from "lucide-react";
import { Evidence, AuthUser, UserRole } from "../../types";

interface EvidenceVaultViewProps {
  evidenceList: Evidence[];
  onSelectEvidence: (evidence: Evidence) => void;
  onVerifyEvidence: (evidenceId: string) => void;
  currentUser?: AuthUser | null;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  evidenceList,
  onSelectEvidence,
  onVerifyEvidence,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    "ALL",
    "Document",
    "Image",
    "Video",
    "Audio",
    "Disk Image",
    "Memory Dump",
    "Network Capture",
    "Other",
  ];
  const statuses = [
    "ALL",
    "Local Only",
    "Pending Registration",
    "Registration Submitted",
    "Registered On-Chain",
    "Registration Failed",
  ];

  const filteredEvidence = useMemo(() => {
    return evidenceList.filter((ev) => {
      const matchesSearch =
        ev.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.sha256_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || ev.category === selectedCategory;
      const matchesStat =
        selectedStatus === "ALL" || ev.registration_status === selectedStatus;

      let matchesRoleParam = true;
      if (role === "Administrator" && selectedRoleFilter !== "ALL") {
        if (selectedRoleFilter === "WITH_TX") matchesRoleParam = !!ev.tx_hash;
        if (selectedRoleFilter === "NO_TX") matchesRoleParam = !ev.tx_hash;
      } else if (role === "Investigator" && selectedRoleFilter !== "ALL") {
        matchesRoleParam = ev.case_id === selectedRoleFilter;
      } else if (role === "Verifier" && selectedRoleFilter !== "ALL") {
        if (selectedRoleFilter === "PARITY_ANCHORED") {
          matchesRoleParam = ev.registration_status === "Registered On-Chain";
        }
        if (selectedRoleFilter === "PARITY_LOCAL") {
          matchesRoleParam = ev.registration_status === "Local Only";
        }
      } else if (role === "Auditor" && selectedRoleFilter !== "ALL") {
        if (selectedRoleFilter === "ADMISSIBLE") matchesRoleParam = true;
        if (selectedRoleFilter === "ON_CHAIN_PROVEN")
          matchesRoleParam = !!ev.block_number;
      }

      return matchesSearch && matchesCat && matchesStat && matchesRoleParam;
    });
  }, [
    evidenceList,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedRoleFilter,
    role,
  ]);

  const copyHash = (hash: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const uniqueCases = Array.from(new Set(evidenceList.map((e) => e.case_id)));

  return (
    <div className="p-8 space-y-6 max-h-full flex flex-col bg-[#F5F5F7]">
      <div className="bg-[#141416]/95 backdrop-blur-2xl border border-white/10 text-slate-200 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md ${
              role === "Administrator"
                ? "bg-blue-600 text-white shadow-blue-500/30"
                : role === "Investigator"
                  ? "bg-emerald-600 text-white shadow-emerald-500/30"
                  : role === "Verifier"
                    ? "bg-purple-600 text-white shadow-purple-500/30"
                    : "bg-amber-600 text-white shadow-amber-500/30"
            }`}
          >
            {role[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {role} Vault Scope & Parameters
              </span>
              <span className="text-[10px] bg-white/10 text-slate-200 font-mono px-3 py-0.5 rounded-full border border-white/15 backdrop-blur-md">
                {role === "Administrator" && "STORAGE ROOT: /vault/evidence"}
                {role === "Investigator" && "INTAKE DISCIPLINE: ISO/IEC 27037"}
                {role === "Verifier" && "ALGORITHM: FIPS 180-4 SHA-256"}
                {role === "Auditor" && "STANDARDS: FRE 901 / NIST 800-86"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {role === "Administrator" &&
                "Admin parameters: Sector inode allocation, raw byte verification, SQLite schema sync, and EVM gas proofs."}
              {role === "Investigator" &&
                "Investigator parameters: Active case association, evidence bag seal tags, seizing officer, and intake timestamps."}
              {role === "Verifier" &&
                "Verifier parameters: 3-way parity matrix (Vault == DB == EVM), bitstream recalculation, and collision checks."}
              {role === "Auditor" &&
                "Auditor parameters: Federal Rules of Evidence Rule 901 compliance, chain continuity depth, and immutable block proofs."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role === "Administrator" && (
            <span className="text-[11px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Inode
              Protection: ACTIVE
            </span>
          )}
          {role === "Investigator" && (
            <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Custodian:{" "}
              {currentUser?.display_name || "Investigator"}
            </span>
          )}
          {role === "Verifier" && (
            <span className="text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Parity
              Check: AUTOMATIC
            </span>
          )}
          {role === "Auditor" && (
            <span className="text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
              <Scale className="w-3.5 h-3.5 text-amber-400" /> FRE 901
              Self-Authenticating: 100%
            </span>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                role === "Administrator"
                  ? "Search by Inode, file path, SHA-256 hash, or EVM Tx..."
                  : role === "Investigator"
                    ? "Search by case ID, file name, collecting officer, or description..."
                    : role === "Verifier"
                      ? "Search by SHA-256 bitstream hash, evidence ID, or status..."
                      : "Search for court docket, evidence ID, or statutory compliance..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200/70 rounded-full focus:border-blue-500 bg-slate-100/70 focus:bg-white text-slate-900 shadow-inner transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {role === "Administrator" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>EVM Tx Status:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Vault Records</option>
                <option value="WITH_TX">Anchored with Tx Hash</option>
                <option value="NO_TX">Local Only / Pending</option>
              </select>
            </div>
          )}

          {role === "Investigator" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Case Dossier:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 font-mono shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Active Cases</option>
                {uniqueCases.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "Verifier" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Parity State:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Parity Records</option>
                <option value="PARITY_ANCHORED">3-Way Parity (On-Chain)</option>
                <option value="PARITY_LOCAL">Local Verified Only</option>
              </select>
            </div>
          )}

          {role === "Auditor" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Admissibility:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Admissible Evidence</option>
                <option value="ON_CHAIN_PROVEN">
                  Ethereum Block Certified
                </option>
                <option value="ADMISSIBLE">FRE Rule 901 Qualified</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-200/80 rounded-full px-3 py-1.5 text-xs bg-white text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0F172A] text-slate-300 uppercase tracking-wider text-[10px] font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Evidence ID</th>
                <th className="px-4 py-3">File Name & Type</th>

                {role === "Administrator" && (
                  <>
                    <th className="px-4 py-3">Storage Inode / Path</th>
                    <th className="px-4 py-3">Raw Byte Size</th>
                    <th className="px-4 py-3">EVM Tx Hash</th>
                  </>
                )}

                {role === "Investigator" && (
                  <>
                    <th className="px-4 py-3">Case Dossier</th>
                    <th className="px-4 py-3">Evidence Bag Tag</th>
                    <th className="px-4 py-3">Intake Officer</th>
                  </>
                )}

                {role === "Verifier" && (
                  <>
                    <th className="px-4 py-3">SHA-256 Digest</th>
                    <th className="px-4 py-3">3-Way Parity</th>
                    <th className="px-4 py-3">Collision Check</th>
                  </>
                )}

                {role === "Auditor" && (
                  <>
                    <th className="px-4 py-3">FRE 901 Grade</th>
                    <th className="px-4 py-3">ISO 27037 Status</th>
                    <th className="px-4 py-3">Block Depth</th>
                  </>
                )}

                <th className="px-4 py-3">Registration Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <HardDrive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No evidence records match your {role} query parameters.
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvidence(ev)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {ev.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {ev.file_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatFileSize(ev.file_size)} &bull; {ev.category}
                      </div>
                    </td>

                    {role === "Administrator" && (
                      <>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 truncate max-w-[160px]">
                          <span title={ev.stored_rel_path}>
                            {ev.stored_rel_path ||
                              `/vault/${ev.id}/${ev.file_name}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {ev.file_size.toLocaleString()} B
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {ev.tx_hash ? (
                            <span
                              className="text-blue-600 font-semibold"
                              title={ev.tx_hash}
                            >
                              {ev.tx_hash.slice(0, 10)}...{ev.tx_hash.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              None (Local DB)
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {role === "Investigator" && (
                      <>
                        <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">
                          {ev.case_id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-slate-100 border border-slate-300 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded">
                            BAG-{ev.id.replace("EVD-", "")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          {ev.collector_identity || "Investigator"}
                        </td>
                      </>
                    )}

                    {role === "Verifier" && (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded max-w-[200px]">
                            <span className="truncate">{ev.sha256_hash}</span>
                            <button
                              onClick={(e) =>
                                copyHash(ev.sha256_hash, ev.id, e)
                              }
                              title="Copy Full SHA-256"
                              className="hover:text-slate-900 shrink-0 text-slate-400"
                            >
                              {copiedId === ev.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              ev.registration_status === "Registered On-Chain"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : "bg-blue-100 text-blue-800 border border-blue-300"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {ev.registration_status === "Registered On-Chain"
                              ? "3/3 MATCH (EVM)"
                              : "2/2 MATCH (LOCAL)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-emerald-600 font-semibold">
                          0 COLLISIONS
                        </td>
                      </>
                    )}

                    {role === "Auditor" && (
                      <>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            <Award className="w-3 h-3 text-emerald-600" />
                            FRE 901(b)(9) Tier-A
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-700 font-medium">
                            ISO 27037 &bull; Sealed
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {ev.block_number ? (
                            <span className="font-semibold text-slate-800">
                              Block #{ev.block_number}
                            </span>
                          ) : (
                            <span className="text-slate-400">Local Ledger</span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          ev.registration_status === "Registered On-Chain"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : ev.registration_status ===
                                  "Pending Registration" ||
                                ev.registration_status ===
                                  "Registration Submitted"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : ev.registration_status === "Registration Failed"
                                ? "bg-red-100 text-red-800 border border-red-300"
                                : "bg-slate-100 text-slate-800 border border-slate-300"
                        }`}
                      >
                        {ev.registration_status === "Registered On-Chain" && (
                          <Blocks className="w-3 h-3 text-emerald-700" />
                        )}
                        {ev.registration_status === "Registration Failed" && (
                          <AlertTriangle className="w-3 h-3 text-red-700" />
                        )}
                        {ev.registration_status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onVerifyEvidence(ev.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-xs active:scale-95 transition-all ${
                            role === "Verifier"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : role === "Investigator"
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : role === "Auditor"
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-[#16A34A] hover:bg-emerald-700"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {role === "Verifier"
                            ? "Audit"
                            : role === "Auditor"
                              ? "Certify"
                              : "Verify"}
                        </button>
                        <button
                          onClick={() => onSelectEvidence(ev)}
                          className="flex items-center gap-1.5 bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 px-3.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200/60 shadow-xs active:scale-95 transition-all"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
          <span>
            Showing {filteredEvidence.length} of {evidenceList.length} evidence
            items ({role} View)
          </span>
          <span className="font-mono text-slate-400">
            {role === "Administrator" &&
              "Controlled Application-Managed Vault Root"}
            {role === "Investigator" &&
              "Evidence Locker & Active Incident Dossiers"}
            {role === "Verifier" && "Cryptographic Bitstream Parity Matrix"}
            {role === "Auditor" && "Statutory Court Admissibility Registry"}
          </span>
        </div>
      </div>
    </div>
  );
};
