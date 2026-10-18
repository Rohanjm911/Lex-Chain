import { useState } from "react";
import {
  Blocks,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import { BlockchainQueueItem, Evidence, AuthUser, UserRole } from "../../types";
import { NetworkStatus } from "../../services/blockchain";

interface BlockchainRecordsViewProps {
  evidenceList: Evidence[];
  queue: BlockchainQueueItem[];
  networkStatus: NetworkStatus;
  onRefresh: () => void;
  onProcessQueue: () => void;
  isProcessing: boolean;
  currentUser?: AuthUser | null;
}

export const BlockchainRecordsView: React.FC<BlockchainRecordsViewProps> = ({
  evidenceList,
  queue,
  networkStatus,
  onRefresh,
  onProcessQueue,
  isProcessing,
  currentUser,
}) => {
  const role: UserRole = currentUser?.role || "Administrator";
  const [activeTab, setActiveTab] = useState<"anchors" | "queue">("anchors");

  const onChainEvidence = evidenceList.filter(
    (e) => e.registration_status === "Registered On-Chain" || e.tx_hash,
  );

  const pendingItems = queue.filter(
    (q) => q.status === "Pending" || q.status === "Failed",
  );

  return (
    <div className="p-8 space-y-6 max-h-full overflow-y-auto bg-[#F5F5F7]">
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
                {role} Blockchain Scope & Parameters
              </span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 font-mono px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {role === "Administrator" && "RPC ENDPOINT / QUEUE ADMIN"}
                {role === "Investigator" && "ON-CHAIN CONFIRMATION RECEIPTS"}
                {role === "Verifier" && "SMART CONTRACT DIGEST VERIFICATION"}
                {role === "Auditor" && "DECENTRALIZED IMMUTABILITY PROOFS"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {role === "Administrator" &&
                "RPC: http://127.0.0.1:8545 \u2022 Chain ID: 31337 \u2022 Contract: EvidenceRegistry.sol \u2022 Queue Auto-Retry: 3x"}
              {role === "Investigator" &&
                "Case evidence block height confirmations, transaction hash explorer links, and printable receipts."}
              {role === "Verifier" &&
                "Smart contract getter: getEvidence(bytes32 evidenceId) \u2022 Merkle leaf validity: 100%."}
              {role === "Auditor" &&
                "Block depth consensus, immutable timestamp attestations, and statutory non-repudiation records."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-3.5 py-1.5 rounded-full border bg-white/[0.06] border-white/[0.1] text-slate-300">
            Pending Queue:{" "}
            <span className="text-amber-400 font-bold">
              {pendingItems.length}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#121826] via-[#1B273F] to-[#0E1524] text-white rounded-3xl p-6 border border-blue-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-2xl relative overflow-hidden space-y-4">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-sm">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight flex items-center gap-2.5">
                Decentralized Evidence Anchor Status
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                    networkStatus.connected
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {networkStatus.connected
                    ? "EVM NODE CONNECTED"
                    : "OFFLINE / LOCAL-FIRST"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                EvidenceRegistry smart contract stores domain-separated
                cryptographic commitments without exposing raw evidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onRefresh}
              className="p-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-full border border-white/10 text-xs transition-all active:scale-95"
              title="Refresh Network Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onProcessQueue}
              disabled={isProcessing || !networkStatus.connected}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Send
                className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
              />
              <span>
                {isProcessing
                  ? "Processing Queue..."
                  : role === "Administrator"
                    ? "Flush & Broadcast EVM Queue"
                    : role === "Investigator"
                      ? "Sync On-Chain Receipts"
                      : role === "Verifier"
                        ? "Batch Verify Smart Contract Anchors"
                        : "Validate Consensus Immutability Proofs"}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-3 border-t border-white/10 font-mono relative z-10">
          <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Network:
            </span>
            <span className="text-slate-200 font-bold text-[13px]">
              {networkStatus.networkName || "Local Hardhat EVM"}
            </span>
          </div>
          <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Chain ID:
            </span>
            <span className="text-slate-200 font-bold text-[13px]">
              {networkStatus.chainId || 31337}
            </span>
          </div>
          <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Current Block:
            </span>
            <span className="text-emerald-400 font-bold text-[13px]">
              {networkStatus.blockNumber !== undefined
                ? `#${networkStatus.blockNumber}`
                : "N/A"}
            </span>
          </div>
          <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Contract Address:
            </span>
            <span className="text-blue-300 font-bold truncate block select-text text-[11px] mt-0.5">
              {networkStatus.contractAddress ||
                "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
            </span>
          </div>
        </div>
      </div>

      <div className="inline-flex bg-slate-200/50 p-1.5 rounded-full border border-slate-300/40 backdrop-blur-md shadow-xs">
        <button
          onClick={() => setActiveTab("anchors")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeTab === "anchors"
              ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {role === "Administrator" &&
              `Confirmed Inode Anchors (${onChainEvidence.length})`}
            {role === "Investigator" &&
              `Confirmed Case Receipts (${onChainEvidence.length})`}
            {role === "Verifier" &&
              `Smart Contract Proofs (${onChainEvidence.length})`}
            {role === "Auditor" &&
              `Decentralized Immutability Proofs (${onChainEvidence.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
            activeTab === "queue"
              ? "bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>
            {role === "Administrator" &&
              `Persistent Sync Buffer (${queue.length})`}
            {role === "Investigator" &&
              `Pending Block Confirmations (${queue.length})`}
            {role === "Verifier" && `Unanchored Parity Queue (${queue.length})`}
            {role === "Auditor" &&
              `Pre-Consensus Operation Queue (${queue.length})`}
          </span>
          {pendingItems.length > 0 && (
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {pendingItems.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "anchors" && (
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 border-b border-slate-200/60 text-slate-600 font-semibold uppercase tracking-wider text-[10px] backdrop-blur-md">
              <tr>
                <th className="px-5 py-3.5">Evidence ID</th>
                <th className="px-5 py-3.5">Domain-Separated Commitment</th>
                <th className="px-5 py-3.5">Transaction Reference</th>
                <th className="px-5 py-3.5">Block #</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-slate-700 font-mono text-xs">
              {onChainEvidence.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-slate-400 font-sans"
                  >
                    No evidence records have been anchored on-chain yet.
                  </td>
                </tr>
              ) : (
                onChainEvidence.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {e.id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[11px] truncate max-w-xs text-slate-600 select-text">
                        {e.on_chain_commitment || "N/A"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-[11px] text-blue-700 truncate max-w-xs select-text font-semibold">
                        {e.tx_hash || "Submitted"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-800">
                      {e.block_number ? `#${e.block_number}` : "-"}
                    </td>
                    <td className="px-5 py-4 font-sans">
                      <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                        {e.registration_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "queue" && (
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden space-y-4 p-6">
          <div className="text-xs text-slate-500 font-normal">
            Operations queued locally in SQLite database. Guarantees zero data
            loss if network is offline during evidence acquisition.
          </div>

          <div className="divide-y divide-slate-100/80 border border-slate-200/60 rounded-2xl overflow-hidden">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Queue is empty. All operations are up-to-date.
              </div>
            ) : (
              queue.map((q) => (
                <div
                  key={q.id}
                  className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {q.id}
                      </span>
                      <span className="font-semibold text-slate-700">
                        &bull; {q.operation_type}
                      </span>
                      <span className="font-mono text-blue-700">
                        ({q.evidence_id})
                      </span>
                    </div>
                    {q.last_error && (
                      <div className="text-rose-700 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Error: {q.last_error}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Attempts: {q.attempts}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                        q.status === "Confirmed"
                          ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                          : q.status === "Pending"
                            ? "bg-amber-500/10 text-amber-800 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-800 border-rose-500/20"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
