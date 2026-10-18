import React from "react";
import { RefreshCw, Radio } from "lucide-react";
import { NetworkStatus } from "../../services/blockchain";

interface HeaderProps {
  title: string;
  subtitle: string;
  networkStatus: NetworkStatus;
  onRefreshNetwork: () => void;
  onSyncQueue?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  networkStatus,
  onRefreshNetwork,
  onSyncQueue,
  isSyncing = false,
}) => {
  return (
    <header className="h-16 bg-[#02040A]/95 backdrop-blur-2xl border-b border-cyan-500/20 px-7 flex items-center justify-between select-none shrink-0 sticky top-0 z-20 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      <div className="space-y-0.5">
        <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-[11px] text-slate-400 font-normal tracking-normal line-clamp-1">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md transition-all ${
            networkStatus.connected
              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(0,255,136,0.25)]"
              : "bg-red-950/70 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(255,0,85,0.25)]"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                networkStatus.connected ? "bg-emerald-400" : "bg-red-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                networkStatus.connected ? "bg-emerald-500" : "bg-red-500"
              }`}
            ></span>
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-tight">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>
              {networkStatus.connected
                ? `${networkStatus.networkName || "EVM"} (Chain ${networkStatus.chainId}) - Block #${networkStatus.blockNumber}`
                : "Blockchain Node Offline (Local Mode Active)"}
            </span>
          </div>
          <button
            onClick={onRefreshNetwork}
            title="Refresh network connection"
            className="hover:text-cyan-300 text-slate-400 hover:scale-110 active:scale-95 transition-all ml-0.5 p-0.5 rounded-full hover:bg-cyan-500/10"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {onSyncQueue && (
          <button
            onClick={onSyncQueue}
            disabled={isSyncing || !networkStatus.connected}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all duration-200 ${
              networkStatus.connected
                ? "bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 shadow-[0_0_25px_rgba(0,242,254,0.4)] disabled:opacity-50"
                : "bg-slate-900/80 text-slate-600 border border-slate-800/80 cursor-not-allowed"
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Syncing..." : "Process Queue"}</span>
          </button>
        )}
      </div>
    </header>
  );
};
