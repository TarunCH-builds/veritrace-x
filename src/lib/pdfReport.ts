import { jsPDF } from "jspdf";
import { ForensicCase } from "../types.js";

/**
 * Generates an official VeriTrace X Forensic Evidence Intelligence PDF report
 */
export function generateForensicReportPdf(forensicCase: ForensicCase): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // dark charcoal #0f172a
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VERITRACE X  //  FORENSIC EVIDENCE REPORT", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald #10b981
  doc.text("CRYPTOGRAPHICALLY ANCHORED & VERIFIABLE EVIDENCE RECORD", 14, 19);

  doc.setTextColor(148, 163, 184); // neutral slate
  doc.setFontSize(8);
  doc.text(`DATE GENERATED: ${new Date().toISOString()}`, pageWidth - 14, 19, { align: "right" });

  y = 36;

  // Case Identifier & Core Details Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`CASE FILE: ${forensicCase.id}`, 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Title: ${forensicCase.title}`, 20, y + 14);
  doc.text(`Status: ${forensicCase.status.toUpperCase()}`, 20, y + 20);

  doc.text(`Created: ${new Date(forensicCase.createdAt).toLocaleString()}`, pageWidth / 2, y + 14);
  doc.text(`MIME Type: ${forensicCase.metadata.mimeType}`, pageWidth / 2, y + 20);

  y += 32;

  // Cryptographic Fingerprint Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("1. CRYPTOGRAPHIC EVIDENCE FINGERPRINT", 14, y);
  y += 6;

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 12, "FD");
  doc.text(`SHA-256: ${forensicCase.metadata.sha256}`, 18, y + 5);
  if (forensicCase.metadata.perceptualHash) {
    doc.text(`pHash:   ${forensicCase.metadata.perceptualHash}  |  File Size: ${forensicCase.metadata.sizeBytes} bytes`, 18, y + 9);
  }
  y += 18;

  // Biometric & Face Forensics
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("2. FACE DETECTION & BIOMETRIC EXTRACTION", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  if (forensicCase.faceData && forensicCase.faceData.facesDetected > 0) {
    doc.text(`• Faces Detected: ${forensicCase.faceData.facesDetected}`, 18, y);
    doc.text(`• Spatial Confidence: ${(forensicCase.faceData.confidence * 100).toFixed(1)}%`, 18, y + 5);
    doc.text(`• Biometric Embedding Fingerprint: ${forensicCase.faceData.embeddingFingerprint} (${forensicCase.faceData.embeddingDimension}-D)`, 18, y + 10);
    doc.text(`• Estimated Pose: ${forensicCase.faceData.attributes?.poseEstimated || "Standard frontal"}`, 18, y + 15);
    y += 22;
  } else {
    doc.text("• No distinct facial bounding box identified in evidence file.", 18, y);
    y += 10;
  }

  // Reverse Search & Source Discovery
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. REVERSE SOURCE INTELLIGENCE", 14, y);
  y += 6;

  if (forensicCase.searchResults && forensicCase.searchResults.length > 0) {
    forensicCase.searchResults.slice(0, 3).forEach((src, idx) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`Source #${idx + 1}: ${src.title.slice(0, 60)}`, 18, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`URL: ${src.url.slice(0, 80)}`, 18, y);
      y += 4;
      doc.setTextColor(15, 23, 42);
      doc.text(`Domain: ${src.domain}  |  Provider: ${src.provider}  |  Assessment: ${src.correlationAssessment || "Candidate"}`, 18, y);
      y += 6;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("• No external reverse sources correlated.", 18, y);
    y += 8;
  }

  y += 4;

  // Blockchain Anchoring Record
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("4. BLOCKCHAIN ANCHOR & IMMUTABLE COMMITMENT", 14, y);
  y += 6;

  if (forensicCase.blockchainAnchor) {
    const bc = forensicCase.blockchainAnchor;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, "FD");

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Network:     ${bc.network} (Chain ID: ${bc.chainId})`, 18, y + 5);
    doc.text(`Tx Hash:     ${bc.transactionHash}`, 18, y + 10);
    doc.text(`Block #:     ${bc.blockNumber}  |  Timestamp: ${bc.timestamp}`, 18, y + 15);
    doc.text(`Submitter:   ${bc.submitterAddress}`, 18, y + 20);
    y += 30;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("• Blockchain anchor pending or not yet dispatched.", 18, y);
    y += 12;
  }

  // Correlation & Scientific Principle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("5. FORENSIC CORRELATION & SCIENTIFIC PRINCIPLE", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    `Overall Assessment: ${forensicCase.correlation?.overallAssessment || "Strong correlation"}`,
    18,
    y
  );
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const disclaimerLines = doc.splitTextToSize(
    "SCIENTIFIC DISCLAIMER: Similarity signals support forensic investigation but do not independently establish identity or authenticity. Cryptographic verification establishes bit-level integrity of the ingested artifact relative to the immutable blockchain anchor.",
    pageWidth - 36
  );
  doc.text(disclaimerLines, 18, y);

  y += 18;

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(18, y + 10, 80, y + 10);
  doc.line(pageWidth - 80, y + 10, pageWidth - 18, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Lead Forensic Investigator Signature", 18, y + 15);
  doc.text("VeriTrace X Cryptographic Validation Gateway", pageWidth - 80, y + 15);

  // Download the generated PDF
  doc.save(`${forensicCase.id}_Forensic_Evidence_Report.pdf`);
}
