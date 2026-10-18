import { useState, useEffect } from "react";
import {
  Settings,
  HardDrive,
  Blocks,
  Save,
  CheckCircle2,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { api } from "../../services/api";
import { AuthUser, UserRole } from "../../types";

interface SettingsViewProps {
  currentUser: AuthUser | null;
  vaultPath: string;
  onSwitchRole: (role: UserRole) => void;
  onRefreshSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  vaultPath,
  onSwitchRole,
  onRefreshSettings,
}) => {
  const [rpcUrl, setRpcUrl] = useState("http://127.0.0.1:8545");
  const [chainId, setChainId] = useState("31337");
  const [contractAddress, setContractAddress] = useState(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  );
  const [networkName, setNetworkName] = useState("Hardhat Local EVM");
  const [autoAnchor, setAutoAnchor] = useState(true);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.getAppSettings();
      if (s.rpc_url) setRpcUrl(s.rpc_url);
      if (s.chain_id) setChainId(s.chain_id);
      if (s.contract_address) setContractAddress(s.contract_address);
      if (s.network_name) setNetworkName(s.network_name);
      if (s.auto_anchor !== undefined) setAutoAnchor(s.auto_anchor === "true");
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await api.updateAppSetting("rpc_url", rpcUrl.trim());
      await api.updateAppSetting("chain_id", chainId.trim());
      await api.updateAppSetting("contract_address", contractAddress.trim());
      await api.updateAppSetting("network_name", networkName.trim());
      await api.updateAppSetting("auto_anchor", autoAnchor ? "true" : "false");

      setSaveSuccess(true);
      onRefreshSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(
        typeof err === "string"
          ? err
          : err.message || "Failed to update settings.",
      );
    }
  };

  return (
    <div className="p-8 space-y-6 max-h-full overflow-y-auto max-w-4xl bg-[#F5F5F7]">
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <Settings className="w-4 h-4" />
          </div>
          Workstation Configuration & Security Preferences
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Configure local filesystem storage boundaries, EVM blockchain
          connectivity, and operator roles.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-950 flex items-center gap-2.5 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Configuration saved successfully and applied to active session.
          </span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-950 flex items-center gap-2.5 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            <HardDrive className="w-4 h-4 text-slate-600" />
            Evidence Storage & Vault Directory
          </div>

          <div className="text-xs space-y-2">
            <label className="block text-slate-700 font-medium">
              Controlled Application-Managed Vault Root Path
            </label>
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3.5 font-mono text-slate-800 text-xs select-text">
              {vaultPath || "C:\\Users\\...\\Documents\\LexChain_Vault"}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Preserved raw files are stored outside the application
              installation folder in read-only mode with strict directory
              traversal sanitization.
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            <Blocks className="w-4 h-4 text-blue-600" />
            EVM Blockchain Network & Contract Configuration
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                JSON-RPC Endpoint URL *
              </label>
              <input
                type="text"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                placeholder="http://127.0.0.1:8545"
                className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl font-mono text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Chain ID *
              </label>
              <input
                type="text"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                placeholder="31337"
                className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl font-mono text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">
                EvidenceRegistry Smart Contract Address *
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x5FbDB2315678afecb367f032d93F642f64180aa3"
                className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl font-mono text-slate-900 font-bold bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Network Display Name
              </label>
              <input
                type="text"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300/80 rounded-xl text-slate-900 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoAnchor}
                  onChange={(e) => setAutoAnchor(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium text-slate-800">
                  Auto-process queue when network is connected
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-slate-600" />
            Active Operator Role & Authorization
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
              <span className="text-slate-400 font-medium text-[11px]">
                Current Operator:
              </span>
              <div className="font-semibold text-slate-900 mt-1 text-[13px]">
                {currentUser?.display_name || "System Operator"}{" "}
                <span className="text-slate-500 font-normal">
                  ({currentUser?.username})
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/50">
              <label className="block text-slate-700 font-medium mb-1.5">
                Role (Select to test role-based constraints):
              </label>
              <select
                value={currentUser?.role || "Administrator"}
                onChange={(e) => onSwitchRole(e.target.value as UserRole)}
                className="border border-slate-300/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="Administrator">
                  Administrator (Full Access)
                </option>
                <option value="Investigator">
                  Investigator (Acquire, Case, Verify)
                </option>
                <option value="Verifier">Verifier (Verification Only)</option>
                <option value="Auditor">
                  Auditor (Audit & Custody Inspection)
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
