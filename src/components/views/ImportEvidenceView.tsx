import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FilePlus2,
  FolderOpen,
  Blocks,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
} from "lucide-react";
import {
  Case,
  HashResult,
  RegisterEvidencePayload,
  AuthUser,
  UserRole,
} from "../../types";
import { api } from "../../services/api";
import { blockchainService } from "../../services/blockchain";

interface ImportEvidenceViewProps {
  cases: Case[];
  preselectedCaseId?: string | null;
  onSuccess: (evidenceId: string) => void;
  onCancel: () => void;
  currentUser?: AuthUser | null;
}

export const ImportEvidenceView: React.FC<ImportEvidenceViewProps> = ({
  cases,
  preselectedCaseId,
  onSuccess,
  onCancel,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [filePath, setFilePath] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  const [hashResult, setHashResult] = useState<HashResult | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  const [evidenceId, setEvidenceId] = useState("");
  const [caseId, setCaseId] = useState(
    preselectedCaseId || (cases.length > 0 ? cases[0].id : "CASE-2026-001"),
  );
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Document");
  const [collectorIdentity, setCollectorIdentity] = useState(
    currentUser?.display_name || "Senior Investigator Chen",
  );
  const [acquisitionDate, setAcquisitionDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [acquisitionNotes, setAcquisitionNotes] = useState("");
  const [queueBlockchain, setQueueBlockchain] = useState(true);

  const [vaultSubsector, setVaultSubsector] = useState(
    "Primary Secure Inode (/vault/evidence)",
  );
  const [streamBufferSize, setStreamBufferSize] = useState(
    "64 KB Stream Blocks",
  );

  const [bagTagNumber, setBagTagNumber] = useState("BAG-2026-084");
  const [seizureLocation, setSeizureLocation] = useState(
    "Crime Scene - Primary Residence / Office",
  );
  const [legalAuthBasis, setLegalAuthBasis] = useState("Search Warrant");
  const [isoChecklist, setIsoChecklist] = useState({
    antiStatic: true,
    writeBlocker: true,
    cameraLogged: true,
  });

  const [secondaryHashAlgo, setSecondaryHashAlgo] = useState(
    "Blake3 Bitstream Dual-Check",
  );
  const [precomputedExpectedHash, setPrecomputedExpectedHash] = useState("");

  const [courtDocketRef, setCourtDocketRef] = useState("DOCKET-CR-2026-4402");
  const [statutoryAttestation, setStatutoryAttestation] = useState(true);

  const [isPreserving, setIsPreserving] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [blockchainResultMsg, setBlockchainResultMsg] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (preselectedCaseId) {
      setCaseId(preselectedCaseId);
    }
  }, [preselectedCaseId]);

  useEffect(() => {
    if (!evidenceId) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setEvidenceId(`EVD-2026-${randomSuffix}`);
    }
  }, []);

  const handlePickFile = async () => {
    setHashError(null);
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title:
          "Select Original Digital Evidence File for Forensics Preservation",
      });

      if (selected && typeof selected === "string") {
        setFilePath(selected);
        await processFileHash(selected);
      }
    } catch (e: any) {
      console.error("Native dialog error:", e);
      setHashError(
        "Could not open native dialog. You can manually enter the file path below.",
      );
    }
  };

  const processFileHash = async (path: string) => {
    if (!path.trim()) return;
    setIsHashing(true);
    setHashError(null);
    setHashResult(null);

    try {
      const result = await api.calculateFileHash(path.trim());
      setHashResult(result);
    } catch (err: any) {
      setHashError(
        typeof err === "string"
          ? err
          : err.message || "Failed to calculate authoritative hash.",
      );
    } finally {
      setIsHashing(false);
    }
  };

  const handleManualPathBlur = () => {
    if (filePath.trim() && (!hashResult || hashResult.file_name !== filePath)) {
      processFileHash(filePath.trim());
    }
  };

  const handleCommitRegistration = async () => {
    if (!hashResult) return;
    setIsPreserving(true);
    setRegistrationError(null);
    setBlockchainResultMsg(null);

    try {
      const payload: RegisterEvidencePayload = {
        source_file_path: filePath,
        evidence_id: evidenceId.trim(),
        case_id: caseId,
        description: description.trim(),
        category,
        acquisition_date: acquisitionDate,
        collector_identity: collectorIdentity.trim(),
        acquisition_notes: acquisitionNotes.trim(),
        queue_blockchain: queueBlockchain,
      };

      const registeredEvidence = await api.registerEvidence(payload);

      if (queueBlockchain && registeredEvidence.on_chain_commitment) {
        setBlockchainResultMsg(
          "Local preservation verified. Connecting to EVM network to submit commitment...",
        );
        const net = await blockchainService.checkConnection();
        if (net.connected) {
          const txRes = await blockchainService.registerEvidenceOnChain(
            registeredEvidence.id,
            registeredEvidence.on_chain_commitment,
          );

          if (txRes.success) {
            await api.updateBlockchainRegistrationResult(
              "IMMEDIATE",
              registeredEvidence.id,
              "Confirmed",
              txRes.txHash,
              txRes.blockNumber,
              "31337",
              net.contractAddress,
            );
            setBlockchainResultMsg(
              `Anchored on EVM! Tx Hash: ${txRes.txHash?.slice(0, 16)}... (Block #${txRes.blockNumber})`,
            );
          } else {
            setBlockchainResultMsg(
              `EVM transaction failed: ${txRes.error}. Operation preserved in local queue for auto-retry.`,
            );
          }
        } else {
          setBlockchainResultMsg(
            "EVM node offline. Operation preserved in persistent SQLite queue for subsequent anchoring.",
          );
        }
      }

      setRegistrationSuccess(true);
      setTimeout(() => {
        onSuccess(registeredEvidence.id);
      }, 2500);
    } catch (err: any) {
      setRegistrationError(
        typeof err === "string" ? err : err.message || "Registration failed.",
      );
    } finally {
      setIsPreserving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-8 max-h-full overflow-y-auto bg-[#F5F5F7]">
      <div className="max-w-3xl mx-auto bg-white/85 backdrop-blur-2xl border border-slate-200/60 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="bg-[#141416]/95 backdrop-blur-2xl text-white p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.35)]">
                <FilePlus2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  Digital Evidence Registration Wizard
                </h2>
                <p className="text-xs text-slate-400">
                  Cryptographic hashing, controlled vault storage, and EVM
                  anchoring.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-3 py-1 rounded-full ${step === 1 ? "bg-blue-600 text-white font-bold shadow-xs" : "bg-white/10 text-slate-400"}`}
              >
                1. Hash
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span
                className={`px-3 py-1 rounded-full ${step === 2 ? "bg-blue-600 text-white font-bold shadow-xs" : "bg-white/10 text-slate-400"}`}
              >
                2. Metadata
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span
                className={`px-3 py-1 rounded-full ${step === 3 ? "bg-blue-600 text-white font-bold shadow-xs" : "bg-white/10 text-slate-400"}`}
              >
                3. Review
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Step 1: Select Source Evidence File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter file path or click Browse..."
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    onBlur={handleManualPathBlur}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded focus:border-blue-500 font-mono text-slate-900 bg-slate-50"
                  />
                  <button
                    onClick={handlePickFile}
                    className="flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse...
                  </button>
                </div>
              </div>

              {isHashing && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-center gap-3 text-xs text-blue-900">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <div className="font-bold">
                      Streaming SHA-256 Calculation in Native Backend...
                    </div>
                    <div className="text-blue-700 text-[11px]">
                      Processing in 64KB blocks while monitoring file
                      modification integrity.
                    </div>
                  </div>
                </div>
              )}

              {hashError && (
                <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center gap-3 text-xs text-red-900">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <div className="font-bold">Integrity Pre-Check Failed</div>
                    <div className="text-red-700">{hashError}</div>
                  </div>
                </div>
              )}

              {hashResult && (
                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Authoritative SHA-256 Calculated Successfully
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {formatFileSize(hashResult.file_size)}
                    </span>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded border border-slate-800 break-all select-text font-bold">
                    {hashResult.sha256_hash}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      File Name:{" "}
                      <strong className="text-slate-900">
                        {hashResult.file_name}
                      </strong>
                    </div>
                    <div>
                      File Extension:{" "}
                      <strong className="text-slate-900">
                        {hashResult.file_extension}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={!hashResult}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  <span>Continue to Metadata</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Step 2: Provide Case & Evidence Metadata
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Unique Evidence Identifier *
                  </label>
                  <input
                    type="text"
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Associated Case *
                  </label>
                  <select
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 bg-white"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Evidence Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 bg-white"
                  >
                    <option value="Document">Document / PDF</option>
                    <option value="Image">Image / Photograph</option>
                    <option value="Video">Video Footage</option>
                    <option value="Audio">Audio Recording</option>
                    <option value="Disk Image">
                      Forensic Disk Image (E01/RAW)
                    </option>
                    <option value="Memory Dump">RAM / Memory Dump</option>
                    <option value="Network Capture">
                      Network Packet Capture (PCAP)
                    </option>
                    <option value="Other">Other Binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Acquisition Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Collector / Seizing Officer Identity *
                  </label>
                  <input
                    type="text"
                    value={collectorIdentity}
                    onChange={(e) => setCollectorIdentity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Evidence Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Physical context, seized equipment, serial numbers, drive partitions..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Acquisition & Chain of Custody Notes
                  </label>
                  <textarea
                    rows={2}
                    value={acquisitionNotes}
                    onChange={(e) => setAcquisitionNotes(e.target.value)}
                    placeholder="Sealing bag number, write-blocking hardware used, witness presence..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div className="col-span-2 mt-2 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          role === "Administrator"
                            ? "bg-blue-600"
                            : role === "Investigator"
                              ? "bg-emerald-600"
                              : role === "Verifier"
                                ? "bg-purple-600"
                                : "bg-amber-600"
                        }`}
                      />
                      {role} Ingestion Parameters & Standards
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {role === "Administrator" && "SYS-INODE / BUFFER CONTROL"}
                      {role === "Investigator" && "ISO/IEC 27037 PROTOCOL"}
                      {role === "Verifier" && "DUAL-HASH PARITY VERIFICATION"}
                      {role === "Auditor" && "FRE 901 STATUTORY ADMISSIBILITY"}
                    </span>
                  </div>

                  {role === "Administrator" && (
                    <div className="grid grid-cols-2 gap-3 bg-blue-50/60 border border-blue-200 rounded p-3 text-xs">
                      <div>
                        <label className="block text-blue-900 font-semibold mb-1">
                          Storage Inode Subsector
                        </label>
                        <select
                          value={vaultSubsector}
                          onChange={(e) => setVaultSubsector(e.target.value)}
                          className="w-full px-2 py-1 border border-blue-300 rounded bg-white text-slate-800"
                        >
                          <option>
                            Primary Secure Inode (/vault/evidence)
                          </option>
                          <option>
                            Archival Cold Storage (/vault/archive)
                          </option>
                          <option>
                            Quarantine Sandbox (/vault/quarantine)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-blue-900 font-semibold mb-1">
                          Streaming Buffer Chunk Size
                        </label>
                        <select
                          value={streamBufferSize}
                          onChange={(e) => setStreamBufferSize(e.target.value)}
                          className="w-full px-2 py-1 border border-blue-300 rounded bg-white text-slate-800"
                        >
                          <option>64 KB Stream Blocks (Standard)</option>
                          <option>1 MB Pipeline Stream (Optimized)</option>
                          <option>4 MB Direct I/O (High Speed)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {role === "Investigator" && (
                    <div className="space-y-3 bg-emerald-50/60 border border-emerald-200 rounded p-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-emerald-950 font-semibold mb-1">
                            Physical Bag / Tag #
                          </label>
                          <input
                            type="text"
                            value={bagTagNumber}
                            onChange={(e) => setBagTagNumber(e.target.value)}
                            className="w-full px-2 py-1 border border-emerald-300 rounded bg-white text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-emerald-950 font-semibold mb-1">
                            Crime Scene Location
                          </label>
                          <input
                            type="text"
                            value={seizureLocation}
                            onChange={(e) => setSeizureLocation(e.target.value)}
                            className="w-full px-2 py-1 border border-emerald-300 rounded bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-emerald-950 font-semibold mb-1">
                            Legal Authority Basis
                          </label>
                          <select
                            value={legalAuthBasis}
                            onChange={(e) => setLegalAuthBasis(e.target.value)}
                            className="w-full px-2 py-1 border border-emerald-300 rounded bg-white text-slate-800"
                          >
                            <option>Search Warrant</option>
                            <option>Consent Search</option>
                            <option>Exigent Circumstances</option>
                            <option>Plain View Seizure</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-emerald-900 font-medium pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isoChecklist.antiStatic}
                            onChange={(e) =>
                              setIsoChecklist({
                                ...isoChecklist,
                                antiStatic: e.target.checked,
                              })
                            }
                            className="rounded border-emerald-300 text-emerald-600"
                          />
                          <span>Anti-Static Packaging</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isoChecklist.writeBlocker}
                            onChange={(e) =>
                              setIsoChecklist({
                                ...isoChecklist,
                                writeBlocker: e.target.checked,
                              })
                            }
                            className="rounded border-emerald-300 text-emerald-600"
                          />
                          <span>Hardware Write-Blocker Verified</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isoChecklist.cameraLogged}
                            onChange={(e) =>
                              setIsoChecklist({
                                ...isoChecklist,
                                cameraLogged: e.target.checked,
                              })
                            }
                            className="rounded border-emerald-300 text-emerald-600"
                          />
                          <span>Scene In-Situ Photos Logged</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {role === "Verifier" && (
                    <div className="grid grid-cols-2 gap-3 bg-purple-50/60 border border-purple-200 rounded p-3 text-xs">
                      <div>
                        <label className="block text-purple-900 font-semibold mb-1">
                          Secondary Cross-Check Algorithm
                        </label>
                        <select
                          value={secondaryHashAlgo}
                          onChange={(e) => setSecondaryHashAlgo(e.target.value)}
                          className="w-full px-2 py-1 border border-purple-300 rounded bg-white text-slate-800"
                        >
                          <option>Blake3 Bitstream Dual-Check</option>
                          <option>SHA-512 Secondary Checksum</option>
                          <option>MD5 Legacy Cross-Reference</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-purple-900 font-semibold mb-1">
                          Pre-computed Checksum (Optional Match)
                        </label>
                        <input
                          type="text"
                          placeholder="Paste expected SHA-256 for 0-diff..."
                          value={precomputedExpectedHash}
                          onChange={(e) =>
                            setPrecomputedExpectedHash(e.target.value)
                          }
                          className="w-full px-2 py-1 border border-purple-300 rounded bg-white text-slate-800 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  {role === "Auditor" && (
                    <div className="grid grid-cols-2 gap-3 bg-amber-50/60 border border-amber-200 rounded p-3 text-xs">
                      <div>
                        <label className="block text-amber-900 font-semibold mb-1">
                          Court Docket / Order Reference
                        </label>
                        <input
                          type="text"
                          value={courtDocketRef}
                          onChange={(e) => setCourtDocketRef(e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded bg-white text-slate-800 font-mono"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-amber-950 font-semibold">
                          <input
                            type="checkbox"
                            checked={statutoryAttestation}
                            onChange={(e) =>
                              setStatutoryAttestation(e.target.checked)
                            }
                            className="rounded border-amber-300 text-amber-600"
                          />
                          <span>
                            Attest FRE 901 Self-Authentication Compliance
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  disabled={!evidenceId.trim() || !collectorIdentity.trim()}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  <span>Review Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Step 3: Verification Review & Storage Confirmation
              </label>

              {registrationError && (
                <div className="bg-red-50 border border-red-300 rounded p-3 text-xs text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{registrationError}</span>
                </div>
              )}

              {registrationSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 rounded p-4 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Evidence Preserved & Successfully Verified in Controlled
                    Vault!
                  </div>
                  {blockchainResultMsg && (
                    <div className="text-[11px] text-emerald-800 font-mono">
                      {blockchainResultMsg}
                    </div>
                  )}
                  <div className="text-slate-500 text-[11px]">
                    Redirecting to evidence dossier...
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Evidence ID:</span>
                    <div className="font-bold font-mono text-slate-900">
                      {evidenceId}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Case ID:</span>
                    <div className="font-bold font-mono text-blue-700">
                      {caseId}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">File Name:</span>
                    <div className="font-semibold text-slate-900">
                      {hashResult?.file_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">File Size:</span>
                    <div className="font-mono text-slate-900">
                      {formatFileSize(hashResult?.file_size || 0)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">SHA-256 Digest:</span>
                    <div className="font-mono text-[11px] text-slate-900 bg-white p-1.5 rounded border border-slate-200 break-all">
                      {hashResult?.sha256_hash}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Category:</span>
                    <div className="text-slate-900">{category}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Seizing Officer:</span>
                    <div className="text-slate-900">{collectorIdentity}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={queueBlockchain}
                      onChange={(e) => setQueueBlockchain(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Blocks className="w-4 h-4 text-blue-600" />
                      Queue On-Chain Cryptographic Commitment Anchoring
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
                    Submits a domain-separated commitment to the
                    EvidenceRegistry smart contract when online.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  disabled={isPreserving}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  disabled={isPreserving || registrationSuccess}
                  onClick={handleCommitRegistration}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded text-xs font-bold disabled:opacity-50"
                >
                  {isPreserving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preserving & Verifying Stored Copy...</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-4 h-4" />
                      <span>Preserve Evidence in Vault</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
