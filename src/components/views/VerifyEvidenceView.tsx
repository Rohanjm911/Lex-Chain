import { useState, useEffect } from "react";
import {
  HardDrive,
  Blocks,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Info,
} from "lucide-react";
import {
  Evidence,
  VerifyEvidenceResult,
  AuthUser,
  UserRole,
} from "../../types";
import { api } from "../../services/api";
import { blockchainService } from "../../services/blockchain";

interface VerifyEvidenceViewProps {
  evidenceList: Evidence[];
  preselectedEvidenceId?: string | null;
  onViewDetails: (evidence: Evidence) => void;
  currentUser?: AuthUser | null;
}

export const VerifyEvidenceView: React.FC<VerifyEvidenceViewProps> = ({
  evidenceList,
  preselectedEvidenceId,
  onViewDetails,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [selectedId, setSelectedId] = useState<string>(
    preselectedEvidenceId ||
      (evidenceList.length > 0 ? evidenceList[0].id : ""),
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerifyEvidenceResult | null>(null);
  const [onChainCheck, setOnChainCheck] = useState<{
    checked: boolean;
    isRegistered: boolean;
    matches: boolean;
    onChainCommitment?: string;
    error?: string;
  } | null>(null);

  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedEvidenceId) {
      setSelectedId(preselectedEvidenceId);
    }
  }, [preselectedEvidenceId]);

  const currentEvidence = evidenceList.find((e) => e.id === selectedId);

  const handleRunVerification = async () => {
    if (!selectedId) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setOnChainCheck(null);
    setTamperMessage(null);

    try {
      const localResult = await api.verifyEvidence(selectedId);
      setVerificationResult(localResult);

      if (currentEvidence?.on_chain_commitment) {
        try {
          const chainCheck = await blockchainService.verifyOnChainCommitment(
            selectedId,
            currentEvidence.on_chain_commitment,
          );
          setOnChainCheck({
            checked: true,
            isRegistered: chainCheck.isRegistered,
            matches: chainCheck.matches,
            onChainCommitment: chainCheck.onChainCommitment,
          });
        } catch (e: any) {
          setOnChainCheck({
            checked: true,
            isRegistered: false,
            matches: false,
            error: e.message || "Failed to query on-chain commitment.",
          });
        }
      }
    } catch (err: any) {
      setVerificationResult({
        verification_id: "ERR",
        evidence_id: selectedId,
        status: "Verification Error",
        expected_hash: currentEvidence?.sha256_hash || "",
        calculated_hash: "",
        is_match: false,
        timestamp: new Date().toISOString(),
        details:
          typeof err === "string"
            ? err
            : err.message || "Native verification error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedId) return;
    try {
      const msg = await api.simulateTamperForTesting(selectedId);
      setTamperMessage(msg);

      await handleRunVerification();
    } catch (e: any) {
      alert("Tamper simulation failed: " + e);
    }
  };

  return (
    <div className="p-8 space-y-6 max-h-full overflow-y-auto bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 text-xs text-slate-700 flex items-start gap-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">
            Forensic Integrity Scope & Limitations:
          </span>
          <p className="mt-0.5 leading-relaxed text-slate-500">
            Cryptographic verification recalculates the raw bitstream SHA-256
            hash of the vault copy and asserts exact parity with the reference
            record. A successful hash match confirms that the file contents have
            not undergone alteration since initial acquisition. It does not
            independently prove original authentic provenance, judicial
            admissibility, or legal chain of custody prior to acquisition.
          </p>
        </div>
      </div>

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
                {role} Verification Parameters
              </span>
              <span className="text-[10px] bg-white/10 text-slate-200 font-mono px-3 py-0.5 rounded-full border border-white/15 backdrop-blur-md">
                {role === "Administrator" && "DB / INODE / EVM AUDIT MODE"}
                {role === "Investigator" && "CRIME SCENE RECEIPT CHECK"}
                {role === "Verifier" && "AUTHORITATIVE 3-WAY PARITY MATRIX"}
                {role === "Auditor" && "FRE 901(b)(9) STATUTORY ADMISSIBILITY"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {role === "Administrator" &&
                "Target DB: SQLite master table &bull; EVM Target: EvidenceRegistry.sol &bull; Inode Link: Strict"}
              {role === "Investigator" &&
                `Case: ${currentEvidence?.case_id || "Active"} &bull; Seizing Officer: ${currentEvidence?.collector_identity || "Investigator"} &bull; Bag Seal: BAG-${selectedId.replace("EVD-", "")}`}
              {role === "Verifier" &&
                "Algorithm: FIPS 180-4 SHA-256 &bull; Scope: Vault File == DB Record == EVM On-Chain &bull; Collision: 0.00%"}
              {role === "Auditor" &&
                "Judicial Basis: FRE Rule 901(b)(9) Electronic Systems &bull; Standard: ISO/IEC 27037:2012"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full border bg-white/10 border-white/15 text-slate-200 backdrop-blur-md">
            {currentEvidence?.registration_status || "Active Record"}
          </span>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[320px]">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0">
            Target Evidence:
          </span>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setVerificationResult(null);
              setOnChainCheck(null);
              setTamperMessage(null);
            }}
            className="flex-1 px-4 py-2 border border-slate-200/70 rounded-full text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white shadow-2xs focus:outline-none cursor-pointer"
          >
            {evidenceList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} &bull; {e.file_name} ({e.case_id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateTamper}
            title="Alters 1 byte in the vault file to demonstrate live failure detection"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/20 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {role === "Administrator" && "Simulate Inode Corruption"}
              {role === "Investigator" && "Simulate Seized File Tamper"}
              {role === "Verifier" && "Simulate Parity Tamper"}
              {role === "Auditor" && "Simulate Admissibility Breach"}
            </span>
          </button>

          <button
            onClick={handleRunVerification}
            disabled={isVerifying || !selectedId}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`}
            />
            <span>
              {isVerifying
                ? "Recalculating..."
                : role === "Administrator"
                  ? "Verify Storage & Inode Parity"
                  : role === "Investigator"
                    ? "Verify Field Hash Match"
                    : role === "Verifier"
                      ? "Run 3-Way Parity Matrix Audit"
                      : "Execute FRE 901 Admissibility Audit"}
            </span>
          </button>
        </div>
      </div>

      {tamperMessage && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{tamperMessage}</span>
        </div>
      )}

      {currentEvidence && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                Preserved Reference Record:{" "}
                <span className="font-mono">{currentEvidence.id}</span>
              </span>
            </div>
            <button
              onClick={() => onViewDetails(currentEvidence)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Inspect Complete Dossier &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500">File Name:</span>
              <div className="font-semibold text-slate-900">
                {currentEvidence.file_name}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Case Association:</span>
              <div className="font-mono text-blue-700 font-bold">
                {currentEvidence.case_id}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Registration Status:</span>
              <div className="font-semibold text-slate-800">
                {currentEvidence.registration_status}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Storage Relative Path:</span>
              <div className="font-mono text-slate-800 truncate">
                {currentEvidence.stored_rel_path}
              </div>
            </div>
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-md border text-xs shadow-sm flex items-center justify-between ${
              verificationResult.status === "Integrity Verified"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-center gap-3">
              {verificationResult.status === "Integrity Verified" ? (
                <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="text-base font-bold tracking-tight">
                  {verificationResult.status.toUpperCase()}
                </div>
                <div className="text-xs mt-0.5 max-w-2xl font-normal">
                  {verificationResult.details}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[11px] text-slate-600 font-semibold">
                Audit Record ID: {verificationResult.verification_id}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                {new Date(verificationResult.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cryptographic Hash Parity Matrix
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>
                    1. Expected Trusted Reference Hash (Local SQLite Database)
                  </span>
                  <span className="text-blue-700">Baseline Target</span>
                </div>
                <div className="text-slate-900 font-bold break-all select-text">
                  {verificationResult.expected_hash}
                </div>
              </div>

              <div
                className={`p-3 rounded border space-y-1 ${
                  verificationResult.is_match
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-red-50 border-red-200 text-red-950"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>
                    2. Authoritative Recalculated Hash (Vault Stored Copy)
                  </span>
                  <span>
                    {verificationResult.is_match
                      ? "MATCH CONFIRMED"
                      : "MISMATCH DETECTED"}
                  </span>
                </div>
                <div className="font-bold break-all select-text">
                  {verificationResult.calculated_hash || "Calculation Failed"}
                </div>
              </div>

              {onChainCheck && (
                <div
                  className={`p-3 rounded border space-y-1 ${
                    onChainCheck.matches
                      ? "bg-blue-50 border-blue-200 text-blue-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Blocks className="w-3.5 h-3.5 text-blue-700" />
                      3. Blockchain Immutable Anchor Record (EVM
                      EvidenceRegistry.sol)
                    </span>
                    <span>
                      {onChainCheck.matches
                        ? "ON-CHAIN ANCHOR CONFIRMED"
                        : onChainCheck.isRegistered
                          ? "REFERENCE INCONSISTENCY"
                          : "NOT REGISTERED ON-CHAIN"}
                    </span>
                  </div>
                  <div className="font-bold break-all select-text">
                    {onChainCheck.onChainCommitment ||
                      "No on-chain commitment found on connected network."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
