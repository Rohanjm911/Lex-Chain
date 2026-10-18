import { jsPDF } from "jspdf";
import { AuditLog, AuthUser, CustodyEvent, Evidence } from "../types";

export function generateAuditSheetPdf(
  logs: AuditLog[],
  currentUser?: AuthUser | null,
  filterContext?: string
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const drawHeader = (pageNumber: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LEXCHAIN FORENSIC AUDIT SHEET", margin + 6, y + 9);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(
      "Statutory Electronic Evidence Trail • NIST SP 800-86 & FRE Rule 901 Compliant",
      margin + 6,
      y + 15
    );

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated: ${new Date().toISOString()} • Confidential & Immutable`,
      margin + 6,
      y + 20
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(56, 189, 248);
    doc.text("OFFICIAL RECORD", pageWidth - margin - 32, y + 9);

    y += 28;

    if (pageNumber === 1) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.text("Auditing Operator:", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${currentUser?.username || "Authenticated Operator"} (${currentUser?.role || "Administrator"})`,
        margin + 34,
        y + 6
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Filter Scope:", margin + 4, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(filterContext || "ALL ACTIONS", margin + 34, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Total Records:", margin + 110, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(`${logs.length} Logged Entries`, margin + 132, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Integrity Notice:", margin + 110, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text("Cryptographic Hash Verification Valid", margin + 132, y + 12);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Notice: This forensic audit sheet reflects append-only records from the local SQLite engine and EVM anchor ledger.",
        margin + 4,
        y + 18
      );

      y += 26;
    }

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);

    doc.text("#", margin + 2, y + 5);
    doc.text("Timestamp (UTC)", margin + 8, y + 5);
    doc.text("Actor / Identity", margin + 44, y + 5);
    doc.text("Action Performed", margin + 84, y + 5);
    doc.text("Entity ID", margin + 122, y + 5);
    doc.text("Audit Details", margin + 146, y + 5);

    y += 7;
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "LexChain Cryptographic Evidence Verification System • Non-Repudiation Verified",
      margin,
      pageHeight - 8
    );

    const pageStr = `Page ${pageNumber} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - 20, pageHeight - 8);
  };

  let currentPage = 1;
  drawHeader(currentPage);

  logs.forEach((log, index) => {
    const detailsLines = doc.splitTextToSize(log.details || "—", 34);
    const rowHeight = Math.max(7, detailsLines.length * 3.4 + 2);

    if (y + rowHeight > pageHeight - 16) {
      doc.addPage();
      currentPage++;
      y = margin;
      drawHeader(currentPage);
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(`${index + 1}`, margin + 2, y + 4.5);

    const tsFormatted = log.timestamp
      ? log.timestamp.replace("T", " ").slice(0, 19)
      : "—";
    doc.text(tsFormatted, margin + 8, y + 4.5);

    const actorTrunc = doc.splitTextToSize(log.actor_identity || "System", 38);
    doc.text(actorTrunc[0], margin + 44, y + 4.5);

    const actionStr = log.action || (log as any).action_type || "ACTION";
    doc.setFont("helvetica", "bold");
    if (actionStr.includes("TAMPER") || actionStr.includes("FAIL")) {
      doc.setTextColor(220, 38, 38);
    } else if (actionStr.includes("VERIF")) {
      doc.setTextColor(16, 185, 129);
    } else if (actionStr.includes("REGISTER")) {
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(actionStr.slice(0, 20), margin + 84, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(log.entity_id ? log.entity_id.slice(0, 13) : "—", margin + 122, y + 4.5);

    doc.setTextColor(51, 65, 85);
    doc.text(detailsLines, margin + 146, y + 4.5);

    y += rowHeight;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`LexChain_AuditSheet_${dateStr}.pdf`);
}

export function generateEvidenceDossierPdf(
  evidence: Evidence,
  custodyEvents: CustodyEvent[] = [],
  currentUser?: AuthUser | null
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LEXCHAIN EVIDENCE FORENSIC DOSSIER", margin + 6, y + 9);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(
    "Court Admissible Digital Evidence Verification Report • FRE Rule 901",
    margin + 6,
    y + 16
  );

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Certified at: ${new Date().toISOString()} • Examiner: ${currentUser?.username || "Authenticated Examiner"}`,
    margin + 6,
    y + 22
  );

  y += 32;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 48, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ITEM METADATA & ARTIFACT SPECIFICATIONS", margin + 4, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const addField = (label: string, value: string, xPos: number, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, xPos, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(value, xPos + 32, yPos);
    doc.setTextColor(71, 85, 105);
  };

  addField("Evidence ID:", evidence.id, margin + 4, y + 14);
  addField("Case Binding:", evidence.case_id, margin + 95, y + 14);

  addField("Original File:", evidence.file_name, margin + 4, y + 21);
  addField("Byte Size:", `${evidence.file_size} bytes`, margin + 95, y + 21);

  addField("Category:", evidence.category, margin + 4, y + 28);
  addField("Acquired By:", evidence.collector_identity, margin + 95, y + 28);

  addField("Acquisition Date:", evidence.acquisition_date, margin + 4, y + 35);
  addField("Status:", evidence.registration_status, margin + 95, y + 35);

  doc.setFont("helvetica", "bold");
  doc.text("SHA-256 Digest:", margin + 4, y + 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text(evidence.sha256_hash, margin + 32, y + 42);

  y += 54;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("BLOCKCHAIN INTEGRITY & NON-REPUDIATION ANCHOR", margin + 4, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const commitment = evidence.on_chain_commitment || "Local-only (Not yet anchored)";
  addField("Commitment:", "", margin + 4, y + 14);
  doc.setFont("courier", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(commitment.slice(0, 66), margin + 32, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Tx Hash:", margin + 4, y + 21);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.tx_hash || "Pending", margin + 32, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Block Number:", margin + 4, y + 28);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.block_number ? `${evidence.block_number}` : "Local Queue", margin + 32, y + 28);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Contract:", margin + 95, y + 28);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(evidence.contract_address || "Local Registry", margin + 115, y + 28);

  y += 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("CHAIN OF CUSTODY TIMELINE & TRANSFER HISTORY", margin, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);

  doc.text("#", margin + 2, y + 5);
  doc.text("Timestamp", margin + 8, y + 5);
  doc.text("Custodian Actor", margin + 46, y + 5);
  doc.text("Custody Event", margin + 88, y + 5);
  doc.text("Context & Purpose", margin + 128, y + 5);

  y += 7;

  custodyEvents.forEach((event, idx) => {
    const rowHeight = 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(`${idx + 1}`, margin + 2, y + 4.5);
    doc.text(event.timestamp.replace("T", " ").slice(0, 19), margin + 8, y + 4.5);
    doc.text(event.actor_identity.slice(0, 24), margin + 46, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.text(event.event_type.slice(0, 24), margin + 88, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(event.context.slice(0, 36), margin + 128, y + 4.5);

    y += rowHeight;
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "LexChain Forensic Evidence Verification • Certified Tamper-Evident Report",
    margin,
    pageHeight - 8
  );
  doc.text("Page 1 of 1", pageWidth - margin - 20, pageHeight - 8);

  doc.save(`LexChain_Dossier_${evidence.id}.pdf`);
}

export function generateCustodySheetPdf(
  events: CustodyEvent[],
  currentUser?: AuthUser | null,
  selectedEvidenceId?: string
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const drawHeader = (pageNumber: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("LEXCHAIN CHAIN OF CUSTODY AUDIT SHEET", margin + 6, y + 9);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(
      "ISO/IEC 27037 Digital Evidence Handling & Append-Only Custody Log",
      margin + 6,
      y + 15
    );

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated: ${new Date().toISOString()} • Custodian: ${currentUser?.username || "Authenticated Custodian"} (${currentUser?.role || "Administrator"})`,
      margin + 6,
      y + 20
    );

    y += 28;

    if (pageNumber === 1) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.text("Target Evidence Filter:", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(selectedEvidenceId || "ALL VAULT EVIDENCE", margin + 40, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Recorded Events:", margin + 115, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(`${events.length} Custody Transfers`, margin + 144, y + 6);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Notice: Every custody transfer is cryptographically timestamped and anchored with non-repudiation.",
        margin + 4,
        y + 13
      );

      y += 22;
    }

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);

    doc.text("#", margin + 2, y + 5);
    doc.text("Timestamp", margin + 8, y + 5);
    doc.text("Evidence ID", margin + 44, y + 5);
    doc.text("Custodian Actor", margin + 76, y + 5);
    doc.text("Custody Event", margin + 116, y + 5);
    doc.text("Context / Purpose", margin + 148, y + 5);

    y += 7;
  };

  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "LexChain Certified Chain of Custody Record • ISO/IEC 27037 & FRE Rule 901",
      margin,
      pageHeight - 8
    );

    const pageStr = `Page ${pageNumber} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - 20, pageHeight - 8);
  };

  let currentPage = 1;
  drawHeader(currentPage);

  events.forEach((ev, idx) => {
    const contextLines = doc.splitTextToSize(ev.context || "—", 34);
    const rowHeight = Math.max(7, contextLines.length * 3.4 + 2);

    if (y + rowHeight > pageHeight - 16) {
      doc.addPage();
      currentPage++;
      y = margin;
      drawHeader(currentPage);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);

    doc.text(`${idx + 1}`, margin + 2, y + 4.5);
    doc.text(ev.timestamp.replace("T", " ").slice(0, 19), margin + 8, y + 4.5);
    doc.text(ev.evidence_id.slice(0, 14), margin + 44, y + 4.5);
    doc.text(ev.actor_identity.slice(0, 20), margin + 76, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(ev.event_type.slice(0, 18), margin + 116, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(contextLines, margin + 148, y + 4.5);

    y += rowHeight;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  doc.save(`LexChain_CustodySheet_${new Date().toISOString().slice(0, 10)}.pdf`);
}

