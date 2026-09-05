import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Calendar,
  User,
  Hash,
  Fingerprint,
  FileText,
  ExternalLink,
  Scale,
  RefreshCw,
  Cpu,
  Lock
} from "lucide-react";
import { StoredEvidenceReport } from "../types.js";
import { verifyReportIntegrity } from "../lib/api.js";
import { CorrelationRadarGraph } from "./correlation/CorrelationRadarGraph.js";
import { generateForensicReportPdf } from "../lib/pdfReport.js";

interface EvidenceReportViewerModalProps {
  report: StoredEvidenceReport | null;
  onClose: () => void;
  onNavigateToCase?: (caseId: string) => void;
}

export const EvidenceReportViewerModal: React.FC<EvidenceReportViewerModalProps> = ({
  report,
  onClose,
  onNavigateToCase
}) => {
  if (!report) return null;

  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    timestamp: string;
    digest: string;
  } | null>(null);

  const handleCopySha = () => {
    navigator.clipboard.writeText(report.evidenceSnapshot.sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopySig = () => {
    navigator.clipboard.writeText(report.reportSignature);
    setCopiedSig(true);
    setTimeout(() => setCopiedSig(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyReportIntegrity(report.id);
      setVerificationResult({
        verified: res.valid,
        timestamp: res.verifiedAt,
        digest: res.calculatedDigest
      });
    } catch (err) {
      console.error(err);
      setVerificationResult({
        verified: false,
        timestamp: new Date().toISOString(),
        digest: "Verification error"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.id}_judicial_evidence_record.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">{report.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {report.archivalStatus.replace("_", " ")}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/5 text-white/60 border border-white/10">
                  {report.retentionCategory.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-white truncate max-w-lg mt-0.5">
                {report.caseTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Judicial Dossier"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadJson}
              title="Download Canonical JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white/80 text-xs">
          {/* Official Judicial Watermark Banner */}
          <div className="p-4 rounded border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-black to-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  CERTIFIED FORENSIC EVIDENCE RECORD // ARCHIVED FOR FUTURE REFERENCE
                </span>
                <p className="text-xs text-white/80 font-medium">
                  Sealed under FIPS 180-4 and RFC 8785 canonical digest standards. Immutable snapshot preserved in vault.
                </p>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold uppercase transition-colors shrink-0"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Tamper-Seal</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Status Banner if checked */}
          {verificationResult && (
            <div
              className={`p-3 rounded border text-xs font-mono flex items-center justify-between ${
                verificationResult.verified
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {verificationResult.verified ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                )}
                <span>
                  {verificationResult.verified
                    ? "INTEGRITY VERIFIED: Canonical report hash matches stored signature exactly. Zero tampering."
                    : "TAMPER ALERT: Calculated report digest does not match archive signature."}
                </span>
              </div>
              <span className="text-[10px] opacity-70">
                {new Date(verificationResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-black/40 border border-white/5 font-mono">
            <div>
              <span className="text-[10px] text-white/40 block uppercase">Associated Case</span>
              <button
                onClick={() => {
                  if (onNavigateToCase) onNavigateToCase(report.caseId);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>{report.caseId}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-white/40 block uppercase">Examiner in Charge</span>
              <span className="text-white font-semibold mt-0.5 block truncate">
                {report.examiner.name}
              </span>
              <span className="text-[10px] text-white/40">{report.examiner.badgeId}</span>
            </div>

            <div>
              <span className="text-[10px] text-white/40 block uppercase">Date Archived</span>
              <span className="text-white mt-0.5 block">
                {new Date(report.generatedAt).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-white/40">
                {new Date(report.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-white/40 block uppercase">Admissibility Rating</span>
              <span className="text-emerald-400 font-bold mt-0.5 block">
                {report.admissibilityRating}
              </span>
              <span className="text-[10px] text-white/40">FIPS 180-4 Compliant</span>
            </div>
          </div>

          {/* Evidence Image & Cryptographic Fingerprint */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Evidence Thumbnail */}
            <div className="p-3 rounded-lg bg-black/50 border border-white/10 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-mono uppercase text-white/40 self-start">
                Archived Visual Evidence
              </span>
              {report.evidenceSnapshot.url ? (
                <div className="h-44 w-full rounded bg-black/60 overflow-hidden flex items-center justify-center border border-white/5">
                  <img
                    src={report.evidenceSnapshot.url}
                    alt={report.evidenceSnapshot.filename}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-44 w-full rounded bg-white/5 flex items-center justify-center font-mono text-[11px] text-white/40">
                  Evidence File Snapshot
                </div>
              )}
              <span className="text-[10px] font-mono text-white/50 truncate max-w-full">
                {report.evidenceSnapshot.filename} ({(report.evidenceSnapshot.fileSizeBytes / 1024).toFixed(1)} KB)
              </span>
            </div>

            {/* Cryptographic Hashes & Signatures */}
            <div className="md:col-span-2 p-4 rounded-lg bg-black/50 border border-white/10 space-y-3 font-mono">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                Cryptographic Evidence Signatures
              </span>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>EVIDENCE SHA-256 DIGEST</span>
                  <button
                    onClick={handleCopySha}
                    className="hover:text-white flex items-center gap-1 text-emerald-400"
                  >
                    {copiedSha ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSha ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-black border border-white/10 text-white font-bold break-all select-all text-[11px]">
                  {report.evidenceSnapshot.sha256}
                </div>
              </div>

              {report.evidenceSnapshot.perceptualHash && (
                <div className="space-y-1">
                  <span className="text-[10px] text-white/40 block">PERCEPTUAL HASH (dHash)</span>
                  <div className="p-2 rounded bg-black border border-white/10 text-white/80 select-all text-[11px]">
                    {report.evidenceSnapshot.perceptualHash}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>REPORT CANONICAL TAMPER-PROOF SIGNATURE</span>
                  <button
                    onClick={handleCopySig}
                    className="hover:text-white flex items-center gap-1 text-emerald-400"
                  >
                    {copiedSig ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSig ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 select-all text-[11px] break-all">
                  {report.reportSignature}
                </div>
              </div>

              {report.blockchainProof && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-white/40">
                    EVM Blockchain Anchor: Block #{report.blockchainProof.blockNumber}
                  </span>
                  <a
                    href={report.blockchainProof.explorerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>View Block Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 5-Pillar Correlation Radar Graph */}
          {report.correlationOverview && (
            <div className="p-4 rounded-lg bg-black/40 border border-white/10 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Evidence Correlation Radar Graph Analysis
              </span>
              <CorrelationRadarGraph correlation={report.correlationOverview} compact={false} />
            </div>
          )}

          {/* Executive Overview & Key Findings */}
          <div className="p-5 rounded-lg bg-black/50 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Executive Forensic Findings & Admissibility
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                {report.summary.verdict.replace("_", " ")} ({report.summary.confidenceScore}%)
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">
              {report.summary.executiveOverview}
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-white/40 block font-bold">
                Certified Key Findings
              </span>
              <ul className="space-y-1.5">
                {report.summary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {report.summary.evidentiaryAdmissibility && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase text-white/40 block font-bold">
                  Custodial Admissibility & Recommended Actions
                </span>
                <p className="text-xs text-white/70">
                  {report.summary.evidentiaryAdmissibility.chainOfCustodyNotes}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {report.summary.evidentiaryAdmissibility.recommendedActions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-black/60 border border-white/5 text-[11px] text-white/80 flex items-start gap-1.5"
                    >
                      <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Examiner Notes & Retention Tags */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded bg-black/40 border border-white/5 font-mono text-[10px]">
            <div className="space-y-1">
              <span className="text-white/40 uppercase block">Archival Storage Location</span>
              <span className="text-white/70 select-all">{report.storageLocation}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {report.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/60 text-[10px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/60 flex items-center justify-between shrink-0 font-mono text-[11px] text-white/40">
          <span>VeriTrace X Evidence Vault // Permanent Record</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 text-white font-medium uppercase tracking-wider transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
