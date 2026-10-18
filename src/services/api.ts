import { invoke } from "@tauri-apps/api/core";
import {
  AuditLog,
  AuthUser,
  BlockchainQueueItem,
  Case,
  CustodyEvent,
  DashboardStats,
  Evidence,
  HashResult,
  RegisterEvidencePayload,
  VerificationRecord,
  VerifyEvidenceResult,
} from "../types";

export const api = {
  calculateFileHash: async (path: string): Promise<HashResult> => {
    return await invoke<HashResult>("calculate_file_hash", { path });
  },

  getVaultPath: async (): Promise<string> => {
    return await invoke<string>("get_vault_path");
  },

  registerEvidence: async (
    payload: RegisterEvidencePayload,
  ): Promise<Evidence> => {
    return await invoke<Evidence>("register_evidence", { payload });
  },

  getEvidenceList: async (): Promise<Evidence[]> => {
    return await invoke<Evidence[]>("get_evidence_list");
  },

  getEvidenceDetails: async (evidenceId: string): Promise<Evidence> => {
    return await invoke<Evidence>("get_evidence_details", { evidenceId });
  },

  verifyEvidence: async (evidenceId: string): Promise<VerifyEvidenceResult> => {
    return await invoke<VerifyEvidenceResult>("verify_evidence", {
      evidenceId,
    });
  },

  simulateTamperForTesting: async (evidenceId: string): Promise<string> => {
    return await invoke<string>("simulate_tamper_for_testing", { evidenceId });
  },

  getCases: async (): Promise<Case[]> => {
    return await invoke<Case[]>("get_cases");
  },

  createCase: async (
    id: string,
    title: string,
    description: string,
    leadInvestigator: string,
  ): Promise<Case> => {
    return await invoke<Case>("create_case", {
      id,
      title,
      description,
      leadInvestigator,
    });
  },

  getCustodyEvents: async (evidenceId?: string): Promise<CustodyEvent[]> => {
    return await invoke<CustodyEvent[]>("get_custody_events", {
      evidenceId: evidenceId || null,
    });
  },

  addCustodyEvent: async (
    evidenceId: string,
    eventType: string,
    context: string,
    previousCustodyRef?: string,
  ): Promise<CustodyEvent> => {
    return await invoke<CustodyEvent>("add_custody_event", {
      evidenceId,
      eventType,
      context,
      previousCustodyRef: previousCustodyRef || null,
    });
  },

  getVerificationRecords: async (
    evidenceId?: string,
  ): Promise<VerificationRecord[]> => {
    return await invoke<VerificationRecord[]>("get_verification_records", {
      evidenceId: evidenceId || null,
    });
  },

  getBlockchainQueue: async (): Promise<BlockchainQueueItem[]> => {
    return await invoke<BlockchainQueueItem[]>("get_blockchain_queue");
  },

  updateBlockchainRegistrationResult: async (
    queueId: string,
    evidenceId: string,
    status: string,
    txHash?: string,
    blockNumber?: number,
    networkId?: string,
    contractAddress?: string,
    errorMessage?: string,
  ): Promise<void> => {
    return await invoke<void>("update_blockchain_registration_result", {
      queueId,
      evidenceId,
      status,
      txHash: txHash || null,
      blockNumber: blockNumber || null,
      networkId: networkId || null,
      contractAddress: contractAddress || null,
      errorMessage: errorMessage || null,
    });
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    return await invoke<DashboardStats>("get_dashboard_stats");
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    return await invoke<AuditLog[]>("get_audit_logs");
  },

  getAppSettings: async (): Promise<Record<string, string>> => {
    return await invoke<Record<string, string>>("get_app_settings");
  },

  updateAppSetting: async (key: string, value: string): Promise<void> => {
    return await invoke<void>("update_app_setting", { key, value });
  },

  getCurrentUser: async (): Promise<AuthUser | null> => {
    return await invoke<AuthUser | null>("get_current_user");
  },

  switchActiveRole: async (roleName: string): Promise<AuthUser> => {
    return await invoke<AuthUser>("switch_active_role", { roleName });
  },
};
