import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardView } from "../components/views/DashboardView";
import { Sidebar } from "../components/layout/Sidebar";
import { EvidenceVaultView } from "../components/views/EvidenceVaultView";
import { Header } from "../components/layout/Header";
import { CustodyEvent, DashboardStats, Evidence } from "../types";
import { jsPDF } from "jspdf";
import {
  generateAuditSheetPdf,
  generateEvidenceDossierPdf,
  generateCustodySheetPdf,
} from "../services/pdfExport";

const mockStats: DashboardStats = {
  total_evidence: 42,
  local_only: 12,
  registered_on_chain: 28,
  pending_registration: 2,
  failed_integrity_checks: 1,
  active_cases: 5,
  total_custody_events: 120,
};

const mockRecentEvents: CustodyEvent[] = [
  {
    id: "CUST-001",
    evidence_id: "EVD-2026-001",
    actor_identity: "Senior Investigator Chen",
    event_type: "Evidence Verified",
    timestamp: "2026-10-17T12:00:00Z",
    context: "Cryptographic SHA-256 match confirmed during audit.",
    anchored_on_chain: true,
  },
];

const mockEvidenceList: Evidence[] = [
  {
    id: "EVD-2026-001",
    case_id: "CASE-2026-001",
    file_name: "ledger_dump.bin",
    file_size: 1048576,
    file_type: "bin",
    sha256_hash:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    stored_rel_path: "files/EVD-2026-001/ledger_dump.bin",
    description: "Memory dump of financial transaction buffer",
    category: "Memory Dump",
    acquisition_date: "2026-10-17T08:00:00Z",
    collector_identity: "Senior Investigator Chen",
    acquisition_notes: "Physical RAM capture using hardware write-blocker",
    registration_status: "Registered On-Chain",
    created_at: "2026-10-17T08:00:00Z",
    updated_at: "2026-10-17T08:00:00Z",
  },
  {
    id: "EVD-2026-002",
    case_id: "CASE-2026-002",
    file_name: "intercept.pcap",
    file_size: 2048,
    file_type: "pcap",
    sha256_hash:
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    stored_rel_path: "files/EVD-2026-002/intercept.pcap",
    description: "Network capture of unauthorized connection attempt",
    category: "Network Capture",
    acquisition_date: "2026-10-17T09:00:00Z",
    collector_identity: "Forensic Analyst Vance",
    acquisition_notes: "Span port capture",
    registration_status: "Local Only",
    created_at: "2026-10-17T09:00:00Z",
    updated_at: "2026-10-17T09:00:00Z",
  },
];

const mockCases: Case[] = [
  {
    id: "CASE-2026-001",
    title: "Financial Ledger Intrusion",
    description: "Unauthorized transactions",
    status: "Active",
    lead_investigator: "Senior Investigator Chen",
    created_at: "2026-10-17T08:00:00Z",
    updated_at: "2026-10-17T08:00:00Z",
    evidence_count: 3,
  },
];

describe("DashboardView Component", () => {
  it("renders live database statistics correctly", () => {
    render(
      <DashboardView
        stats={mockStats}
        recentEvents={mockRecentEvents}
        onNavigate={vi.fn()}
        vaultPath="C:\\Users\\Test\\Documents\\LexChain_Vault"
      />,
    );

    expect(screen.getAllByText("42")[0]).toBeInTheDocument();
    expect(screen.getAllByText("28")[0]).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/LexChain_Vault/)).toBeInTheDocument();
    expect(screen.getByText("Evidence Verified")).toBeInTheDocument();
  });

  it("renders Investigator specific dashboard with active cases and intake protocols", () => {
    render(
      <DashboardView
        stats={mockStats}
        recentEvents={mockRecentEvents}
        onNavigate={vi.fn()}
        vaultPath="C:\\Users\\Test\\Documents\\LexChain_Vault"
        currentUser={{
          id: "USR-002",
          username: "investigator",
          display_name: "Lead Investigator Chen",
          role: "Investigator",
        }}
        cases={mockCases}
        evidenceList={mockEvidenceList}
      />,
    );

    expect(screen.getByText("Investigator Workstation")).toBeInTheDocument();
    expect(screen.getByText("Acquire & Hash Evidence")).toBeInTheDocument();
    expect(
      screen.getByText("ISO/IEC 27037 Crime Scene Intake Protocol"),
    ).toBeInTheDocument();
    expect(screen.getByText("Financial Ledger Intrusion")).toBeInTheDocument();
  });

  it("renders Verifier specific dashboard with 3-way parity matrix scanner", () => {
    render(
      <DashboardView
        stats={mockStats}
        recentEvents={mockRecentEvents}
        onNavigate={vi.fn()}
        vaultPath="C:\\Users\\Test\\Documents\\LexChain_Vault"
        currentUser={{
          id: "USR-003",
          username: "verifier",
          display_name: "Forensic Verifier Vance",
          role: "Verifier",
        }}
        evidenceList={mockEvidenceList}
      />,
    );

    expect(screen.getByText("Verifier Workstation")).toBeInTheDocument();
    expect(screen.getByText("Run 3-Way Parity Audit")).toBeInTheDocument();
    expect(
      screen.getByText("Live Cryptographic Parity Matrix Scanner"),
    ).toBeInTheDocument();
    expect(screen.getByText("ledger_dump.bin")).toBeInTheDocument();
  });

  it("renders Auditor specific dashboard with FRE 901 compliance and DAG continuity", () => {
    render(
      <DashboardView
        stats={mockStats}
        recentEvents={mockRecentEvents}
        onNavigate={vi.fn()}
        vaultPath="C:\\Users\\Test\\Documents\\LexChain_Vault"
        currentUser={{
          id: "USR-004",
          username: "auditor",
          display_name: "Senior Auditor Adams",
          role: "Auditor",
        }}
        evidenceList={mockEvidenceList}
      />,
    );

    expect(screen.getByText("Auditor Workstation")).toBeInTheDocument();
    expect(screen.getByText("Audit Custody DAG")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Judicial Admissibility & Statutory Compliance Standards",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/FRE Rule 901/)[0]).toBeInTheDocument();
  });
});

describe("Sidebar Navigation & Role Switcher", () => {
  it("renders primary navigation items and allows role switching", () => {
    const onSwitchRole = vi.fn();
    const onSelectSection = vi.fn();

    render(
      <Sidebar
        activeSection="dashboard"
        onSelectSection={onSelectSection}
        currentUser={{
          id: "USR-001",
          username: "admin",
          display_name: "System Administrator",
          role: "Administrator",
        }}
        onSwitchRole={onSwitchRole}
      />,
    );

    expect(screen.getByText("LEXCHAIN")).toBeInTheDocument();
    expect(screen.getByText("Evidence Vault")).toBeInTheDocument();
    expect(screen.getByText("Verify Integrity")).toBeInTheDocument();

    const roleSelect = screen.getByRole("combobox");
    expect(roleSelect).toHaveValue("Administrator");

    fireEvent.change(roleSelect, { target: { value: "Investigator" } });
    expect(onSwitchRole).toHaveBeenCalledWith("Investigator");
  });
});

describe("EvidenceVaultView Component", () => {
  it("filters evidence list based on search query and displays role parameters", () => {
    const onSelect = vi.fn();
    const onVerify = vi.fn();

    const { rerender } = render(
      <EvidenceVaultView
        evidenceList={mockEvidenceList}
        onSelectEvidence={onSelect}
        onVerifyEvidence={onVerify}
        currentUser={{
          id: "USR-001",
          username: "admin",
          display_name: "Admin User",
          role: "Administrator",
        }}
      />,
    );

    expect(screen.getByText("ledger_dump.bin")).toBeInTheDocument();
    expect(screen.getByText("intercept.pcap")).toBeInTheDocument();
    expect(
      screen.getByText("Administrator Vault Scope & Parameters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("STORAGE ROOT: /vault/evidence"),
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by/i);
    fireEvent.change(searchInput, { target: { value: "ledger" } });

    expect(screen.getByText("ledger_dump.bin")).toBeInTheDocument();
    expect(screen.queryByText("intercept.pcap")).not.toBeInTheDocument();

    rerender(
      <EvidenceVaultView
        evidenceList={mockEvidenceList}
        onSelectEvidence={onSelect}
        onVerifyEvidence={onVerify}
        currentUser={{
          id: "USR-002",
          username: "investigator",
          display_name: "Lead Investigator Chen",
          role: "Investigator",
        }}
      />,
    );

    expect(
      screen.getByText("Investigator Vault Scope & Parameters"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("INTAKE DISCIPLINE: ISO/IEC 27037"),
    ).toBeInTheDocument();
  });
});

describe("Header Component", () => {
  it("displays EVM connected state when blockchain is reachable", () => {
    render(
      <Header
        title="Test Dashboard"
        subtitle="Test Subtitle"
        networkStatus={{
          connected: true,
          chainId: 31337,
          networkName: "Hardhat Local EVM",
          blockNumber: 42,
        }}
        onRefreshNetwork={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(/Hardhat Local EVM \(Chain 31337\) - Block #42/i),
    ).toBeInTheDocument();
  });

  it("displays Local-First offline banner when blockchain node is unreachable", () => {
    render(
      <Header
        title="Test Dashboard"
        subtitle="Test Subtitle"
        networkStatus={{
          connected: false,
        }}
        onRefreshNetwork={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Blockchain Node Offline (Local Mode Active)"),
    ).toBeInTheDocument();
  });
});

describe("PDF Generation Services", () => {
  beforeEach(() => {
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates evidence forensic dossier PDF without errors", () => {
    expect(() =>
      generateEvidenceDossierPdf(mockEvidenceList[0], mockRecentEvents, {
        id: "USR-001",
        username: "admin",
        display_name: "Admin User",
        role: "Administrator",
      })
    ).not.toThrow();
  });

  it("generates audit sheet PDF without errors", () => {
    const mockLogs = [
      {
        id: "LOG-001",
        timestamp: "2026-10-17T12:00:00Z",
        actor_identity: "admin",
        action: "EVIDENCE_INGESTION",
        details: "Ingested evidence EVD-2026-001",
        severity: "INFO" as const,
      },
    ];
    expect(() =>
      generateAuditSheetPdf(mockLogs, {
        id: "USR-001",
        username: "admin",
        display_name: "Admin User",
        role: "Administrator",
      })
    ).not.toThrow();
  });

  it("generates chain of custody sheet PDF without errors", () => {
    expect(() =>
      generateCustodySheetPdf(mockRecentEvents, {
        id: "USR-001",
        username: "admin",
        display_name: "Admin User",
        role: "Administrator",
      })
    ).not.toThrow();
  });
});


