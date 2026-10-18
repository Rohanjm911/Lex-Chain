import { useState, useEffect, useCallback } from "react";
import { Sidebar, NavSection } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { DashboardView } from "./components/views/DashboardView";
import { EvidenceVaultView } from "./components/views/EvidenceVaultView";
import { ImportEvidenceView } from "./components/views/ImportEvidenceView";
import { VerifyEvidenceView } from "./components/views/VerifyEvidenceView";
import { CaseManagementView } from "./components/views/CaseManagementView";
import { ChainOfCustodyView } from "./components/views/ChainOfCustodyView";
import { BlockchainRecordsView } from "./components/views/BlockchainRecordsView";
import { AuditLogsView } from "./components/views/AuditLogsView";
import { SettingsView } from "./components/views/SettingsView";
import { EvidenceDetailModal } from "./components/views/EvidenceDetailModal";

import {
  AuditLog,
  AuthUser,
  BlockchainQueueItem,
  Case,
  CustodyEvent,
  DashboardStats,
  Evidence,
  UserRole,
} from "./types";
import { api } from "./services/api";
import { blockchainService, NetworkStatus } from "./services/blockchain";

export function App() {
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [vaultPath, setVaultPath] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    total_evidence: 0,
    local_only: 0,
    registered_on_chain: 0,
    pending_registration: 0,
    failed_integrity_checks: 0,
    active_cases: 0,
    total_custody_events: 0,
  });

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);
  const [queue, setQueue] = useState<BlockchainQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: false,
  });
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  const [modalEvidence, setModalEvidence] = useState<Evidence | null>(null);
  const [preselectedVerifyId, setPreselectedVerifyId] = useState<string | null>(
    null,
  );
  const [preselectedCaseId, setPreselectedCaseId] = useState<string | null>(
    null,
  );

  const refreshData = useCallback(async () => {
    try {
      const [
        fetchedStats,
        fetchedEvidence,
        fetchedCases,
        fetchedEvents,
        fetchedQueue,
        fetchedLogs,
        user,
        vPath,
      ] = await Promise.all([
        api.getDashboardStats().catch(() => stats),
        api.getEvidenceList().catch(() => []),
        api.getCases().catch(() => []),
        api.getCustodyEvents().catch(() => []),
        api.getBlockchainQueue().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getCurrentUser().catch(() => null),
        api.getVaultPath().catch(() => ""),
      ]);

      setStats(fetchedStats);
      setEvidenceList(fetchedEvidence);
      setCases(fetchedCases);
      setCustodyEvents(fetchedEvents);
      setQueue(fetchedQueue);
      setAuditLogs(fetchedLogs);
      if (user) setCurrentUser(user);
      if (vPath) setVaultPath(vPath);
    } catch (err) {
      console.error("Failed to load LexChain application state:", err);
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    await blockchainService.loadSettings();
    const status = await blockchainService.checkConnection();
    setNetworkStatus(status);
  }, []);

  useEffect(() => {
    refreshData();
    checkNetwork();

    const timer = setInterval(() => {
      checkNetwork();
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshData, checkNetwork]);

  const handleSyncQueue = async () => {
    setIsSyncingQueue(true);
    try {
      await blockchainService.processPendingQueue();
      await refreshData();
      await checkNetwork();
    } catch (e) {
      console.error("Queue sync error:", e);
    } finally {
      setIsSyncingQueue(false);
    }
  };

  const handleSwitchRole = async (role: UserRole) => {
    try {
      const updated = await api.switchActiveRole(role);
      setCurrentUser(updated);
      await refreshData();
    } catch (err) {
      alert("Role switch failed: " + err);
    }
  };

  const handleNavigateToVerify = (evidenceId: string) => {
    setPreselectedVerifyId(evidenceId);
    setActiveSection("verify");
  };

  const handleNavigateImportForCase = (caseId: string) => {
    setPreselectedCaseId(caseId);
    setActiveSection("import");
  };

  const roleSectionMeta: Record<
    UserRole,
    Record<NavSection, { title: string; subtitle: string }>
  > = {
    Administrator: {
      dashboard: {
        title: "Administrator Forensic Infrastructure & Node Telemetry",
        subtitle:
          "Full-spectrum system infrastructure oversight, node telemetry, vault security, and offline queue administration.",
      },
      vault: {
        title: "Administrator Evidence Vault & Inode Storage",
        subtitle:
          "Sector-level bitstream storage boundaries, Win32 read-only ACL protection, and filesystem quotas.",
      },
      import: {
        title: "Administrator Batch System Ingestion",
        subtitle:
          "High-throughput streaming ingestion with low-level 64KB chunk buffer control and SHA-256 validation.",
      },
      verify: {
        title: "Administrator Node Integrity & Database Audit",
        subtitle:
          "Authoritative root recalculation of filesystem files against SQLite indices and RPC block state.",
      },
      cases: {
        title: "Administrator Storage Quotas & Case Permissions",
        subtitle:
          "Case directory quotas, access permissions, and cryptographic retention locks.",
      },
      custody: {
        title: "Administrator EVM Gas & Transaction Ledger",
        subtitle:
          "Cryptographic transaction reconciliation, gas parameters, and immutable block receipts.",
      },
      blockchain: {
        title: "Administrator RPC Endpoint & Offline Queue Admin",
        subtitle:
          "Hardhat EVM node administration, EvidenceRegistry.sol commitments, and persistent sync buffers.",
      },
      audit: {
        title: "Administrator Privileged SysOps & Security Logs",
        subtitle:
          "Append-only security log monitoring privileged workstation operator actions and database operations.",
      },
      settings: {
        title: "Administrator Node & Security Configuration",
        subtitle:
          "Filesystem storage bounds, JSON-RPC provider endpoints, and smart contract bindings.",
      },
    },
    Investigator: {
      dashboard: {
        title: "Investigator Field Operations & Intake Hub",
        subtitle:
          "Active crime scene cases, streaming evidence ingestion, and physical/digital chain of custody transfers.",
      },
      vault: {
        title: "Investigator Evidence Lockers & Seized Media",
        subtitle:
          "Acquired bitstream files, physical bag/tag labels, seizing officer identities, and case associations.",
      },
      import: {
        title: "Investigator Crime Scene Ingestion Wizard",
        subtitle:
          "ISO/IEC 27037 compliant field intake with hardware write-blocker verification and forensic SHA-256 calculation.",
      },
      verify: {
        title: "Investigator Field Hash Verification",
        subtitle:
          "Rapid hash recalculation to confirm evidence integrity before transfer to forensic laboratory.",
      },
      cases: {
        title: "Investigator Active Case Dossiers & Incident Files",
        subtitle:
          "Crime scene dossiers, lead investigator assignments, and categorized evidence binders.",
      },
      custody: {
        title: "Investigator Physical Custody Handoffs & Transfers",
        subtitle:
          "Transfer physical and digital media with recorded receiving officer, transfer rationale, and timestamp.",
      },
      blockchain: {
        title: "Investigator On-Chain Case Receipts & Receipts Explorer",
        subtitle:
          "EVM block timestamp certificates proving evidence existed at seizure time.",
      },
      audit: {
        title: "Investigator Evidence Activity Trail",
        subtitle:
          "Chronological record of evidence collection, custody updates, and investigation activities.",
      },
      settings: {
        title: "Investigator Officer Credentials & Station Profile",
        subtitle:
          "Officer badge ID, field intake preferences, and local cryptographic parameters.",
      },
    },
    Verifier: {
      dashboard: {
        title: "Verifier Cryptographic Parity & Tamper Detection Hub",
        subtitle:
          "Independent 3-way cryptographic parity matrix auditing, raw hash recalculation, and tamper detection.",
      },
      vault: {
        title: "Verifier Bitstream Digest Vault & Parity Index",
        subtitle:
          "Authoritative SHA-256 bitstream digests and collision verification records.",
      },
      import: {
        title: "Verifier Dual-Hash Ingestion Lab",
        subtitle:
          "Multi-algorithm digest computation (SHA-256 + Blake3) with precomputed checksum comparison.",
      },
      verify: {
        title: "Verifier 3-Way Parity Matrix Audit",
        subtitle:
          "Live assertion matrix: Physical Filesystem Copy == SQLite Reference Record == Ethereum Smart Contract.",
      },
      cases: {
        title: "Verifier Tamper Discrepancy & Case Assessment",
        subtitle:
          "Dossier-level parity ratios, active tamper alerts, and hash collision evaluations.",
      },
      custody: {
        title: "Verifier Transfer Parity Ledger",
        subtitle:
          "Cryptographic verification of evidence bitstreams at each step in the chain of custody.",
      },
      blockchain: {
        title: "Verifier Smart Contract Anchors & Merkle Proofs",
        subtitle:
          "EvidenceRegistry.sol getter assertions verifying zero byte deviation and consensus validity.",
      },
      audit: {
        title: "Verifier Cryptographic Check Attributions",
        subtitle:
          "Cryptographic verification logs, parity check outcomes, and discrepancy audit records.",
      },
      settings: {
        title: "Verifier Verification Algorithms & Hash Suites",
        subtitle:
          "FIPS 180-4 cryptographic parameters, stream buffer size, and multi-hash configurations.",
      },
    },
    Auditor: {
      dashboard: {
        title: "Auditor Court Admissibility & Legal Compliance Hub",
        subtitle:
          "Chain of custody DAG continuity review, judicial court admissibility compliance, and audit log analysis.",
      },
      vault: {
        title: "Auditor Court Vault Holdings & Admissibility Registry",
        subtitle:
          "Federal Rules of Evidence Rule 901 qualified evidence exhibits and certified bitstream holdings.",
      },
      import: {
        title: "Auditor Warrant Compliance Intake & Legal Review",
        subtitle:
          "Search warrant verification, legal authority basis confirmation, and statutory intake validation.",
      },
      verify: {
        title: "Auditor FRE 901 Statutory Certification & Integrity Audit",
        subtitle:
          "FRE Rule 901(b)(9) self-authenticating digital process verification and trial readiness checks.",
      },
      cases: {
        title: "Auditor Judicial Case Dockets & Legal Holds",
        subtitle:
          "Court dockets, legal hold statuses, jurisdiction assignments, and chain completeness indices.",
      },
      custody: {
        title: "Auditor Continuity DAG & Admissibility Gap Analysis",
        subtitle:
          "Unbroken custody DAG examination with zero missing links for court trial presentation.",
      },
      blockchain: {
        title: "Auditor Decentralized Immutability Proofs & Blockchain Anchors",
        subtitle:
          "Mathematical proof of evidence existence and non-tampering backed by Ethereum block depth.",
      },
      audit: {
        title: "Auditor Statutory Compliance & Regulatory Audit Trail",
        subtitle:
          "NIST SP 800-86 compliant tamper-evident audit logs with verifiable operator identity.",
      },
      settings: {
        title: "Auditor Compliance Policies & Court Jurisdiction Config",
        subtitle:
          "Federal court admissibility rules, retention schedules, and statutory compliance frameworks.",
      },
    },
  };

  const getSectionMeta = (sec: NavSection) => {
    const role: UserRole = currentUser?.role || "Administrator";
    return roleSectionMeta[role]?.[sec] || roleSectionMeta.Administrator[sec];
  };

  const pendingCount = queue.filter(
    (q) => q.status === "Pending" || q.status === "Failed",
  ).length;

  return (
    <div className="flex h-screen w-screen bg-[#02040A] text-slate-100 overflow-hidden font-sans antialiased">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec !== "verify") setPreselectedVerifyId(null);
          if (sec !== "import") setPreselectedCaseId(null);
        }}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        pendingCount={pendingCount}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={getSectionMeta(activeSection).title}
          subtitle={getSectionMeta(activeSection).subtitle}
          networkStatus={networkStatus}
          onRefreshNetwork={checkNetwork}
          onSyncQueue={handleSyncQueue}
          isSyncing={isSyncingQueue}
        />

        <main className="flex-1 overflow-hidden relative">
          {activeSection === "dashboard" && (
            <DashboardView
              stats={stats}
              recentEvents={custodyEvents}
              onNavigate={(sec) => {
                setActiveSection(sec);
                if (sec !== "verify") setPreselectedVerifyId(null);
                if (sec !== "import") setPreselectedCaseId(null);
              }}
              vaultPath={vaultPath}
              currentUser={currentUser}
              onSwitchRole={handleSwitchRole}
              evidenceList={evidenceList}
              cases={cases}
              queue={queue}
              auditLogs={auditLogs}
              networkStatus={networkStatus}
              onSyncQueue={handleSyncQueue}
              isSyncingQueue={isSyncingQueue}
            />
          )}

          {activeSection === "vault" && (
            <EvidenceVaultView
              evidenceList={evidenceList}
              onSelectEvidence={(ev) => setModalEvidence(ev)}
              onVerifyEvidence={handleNavigateToVerify}
              currentUser={currentUser}
            />
          )}

          {activeSection === "import" && (
            <ImportEvidenceView
              cases={cases}
              preselectedCaseId={preselectedCaseId}
              onSuccess={(evId) => {
                refreshData();
                handleNavigateToVerify(evId);
              }}
              onCancel={() => setActiveSection("vault")}
              currentUser={currentUser}
            />
          )}

          {activeSection === "verify" && (
            <VerifyEvidenceView
              evidenceList={evidenceList}
              preselectedEvidenceId={preselectedVerifyId}
              onViewDetails={(ev) => setModalEvidence(ev)}
              currentUser={currentUser}
            />
          )}

          {activeSection === "cases" && (
            <CaseManagementView
              cases={cases}
              evidenceList={evidenceList}
              onRefreshCases={refreshData}
              onSelectEvidence={(ev) => setModalEvidence(ev)}
              onNavigateImportForCase={handleNavigateImportForCase}
              currentUser={currentUser}
            />
          )}

          {activeSection === "custody" && (
            <ChainOfCustodyView
              events={custodyEvents}
              evidenceList={evidenceList}
              onRefreshEvents={refreshData}
              currentUser={currentUser}
            />
          )}

          {activeSection === "blockchain" && (
            <BlockchainRecordsView
              evidenceList={evidenceList}
              queue={queue}
              networkStatus={networkStatus}
              onRefresh={() => {
                checkNetwork();
                refreshData();
              }}
              onProcessQueue={handleSyncQueue}
              isProcessing={isSyncingQueue}
              currentUser={currentUser}
            />
          )}

          {activeSection === "audit" && (
            <AuditLogsView logs={auditLogs} currentUser={currentUser} />
          )}

          {activeSection === "settings" && (
            <SettingsView
              currentUser={currentUser}
              vaultPath={vaultPath}
              onSwitchRole={handleSwitchRole}
              onRefreshSettings={() => {
                checkNetwork();
                refreshData();
              }}
            />
          )}
        </main>
      </div>

      {modalEvidence && (
        <EvidenceDetailModal
          evidence={modalEvidence}
          onClose={() => setModalEvidence(null)}
          onVerify={(evId) => {
            setModalEvidence(null);
            handleNavigateToVerify(evId);
          }}
        />
      )}
    </div>
  );
}

export default App;
