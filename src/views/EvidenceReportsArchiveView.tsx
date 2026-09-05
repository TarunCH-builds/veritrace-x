import React, { useState, useEffect } from "react";
import {
  Archive,
  Download,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  FileCheck2,
  Calendar,
  Lock,
  Layers,
  Scale,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Plus,
  Copy,
  Check,
  Building2,
  Clock
} from "lucide-react";
import { StoredEvidenceReport, ForensicCase } from "../types.js";
import {
  fetchReports,
  storeAllEvidenceReports,
  verifyReportIntegrity,
  deleteReport,
  fetchCases,
  storeEvidenceReport
} from "../lib/api.js";
import { EvidenceReportViewerModal } from "../components/EvidenceReportViewerModal.js";
import { generateForensicReportPdf } from "../lib/pdfReport.js";

interface EvidenceReportsArchiveViewProps {
  onNavigate: (view: string, caseId?: string) => void;
}

export const EvidenceReportsArchiveView: React.FC<EvidenceReportsArchiveViewProps> = ({
  onNavigate
}) => {
  const [reports, setReports] = useState<StoredEvidenceReport[]>([]);
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // State for modals & actions
  const [selectedReport, setSelectedReport] = useState<StoredEvidenceReport | null>(null);
  const [isStoringAll, setIsStoringAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [integrityResults, setIntegrityResults] = useState<Record<string, { valid: boolean; time: string }>>({});

  // Single Case Store Dialog
  const [isStoreSingleOpen, setIsStoreSingleOpen] = useState(false);
  const [targetCaseId, setTargetCaseId] = useState("");
  const [examinerName, setExaminerName] = useState("Chief Examiner Alex Vance");
  const [examinerBadge, setExaminerBadge] = useState("VERI-SEAL-091");
  const [retentionCategory, setRetentionCategory] = useState<"COURT_DISCOVERY" | "COLD_CASE" | "STATUTORY_AUDIT" | "RESEARCH_REFERENCE">("COURT_DISCOVERY");
  const [notes, setNotes] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, casesData] = await Promise.all([
        fetchReports({
          search: searchQuery,
          status: selectedStatus,
          category: selectedCategory
        }),
        fetchCases()
      ]);
      setReports(reportsData);
      setCases(casesData);
      if (casesData.length > 0 && !targetCaseId) {
        setTargetCaseId(casesData[0].id);
      }
    } catch (err) {
      console.error("Failed to load archive reports", err);
      showToast("Failed to load evidence reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedStatus, selectedCategory]);

  // Handler: Store All Current Evidence Reports for Future Use
  const handleStoreAll = async () => {
    setIsStoringAll(true);
    try {
      const res = await storeAllEvidenceReports({
        name: examinerName,
        badgeId: examinerBadge,
        agency: "National Digital Forensics & Evidence Directorate"
      });
      showToast(`Success: Sealed & stored ${res.storedCount} evidence reports into persistent vault for future reference!`);
      loadData();
    } catch (err: any) {
      console.error("Store all failed", err);
      showToast(err.message || "Failed to store all reports", "error");
    } finally {
      setIsStoringAll(false);
    }
  };

  // Handler: Store Single Case Report
  const handleStoreSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCaseId) return;

    try {
      await storeEvidenceReport({
        caseId: targetCaseId,
        examiner: {
          name: examinerName,
          badgeId: examinerBadge,
          agency: "VeriTrace Digital Forensics Bureau"
        },
        retentionCategory,
        notes,
        tags: ["Manual Archival", retentionCategory.replace("_", " ")]
      });
      setIsStoreSingleOpen(false);
      showToast(`Evidence report archived for case ${targetCaseId}!`);
      loadData();
    } catch (err: any) {
      console.error("Failed to store case report", err);
      showToast(err.message || "Failed to store report", "error");
    }
  };

  // Handler: Verify Tamper Integrity
  const handleVerifyIntegrity = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingId(id);
    try {
      const res = await verifyReportIntegrity(id);
      setIntegrityResults((prev) => ({
        ...prev,
        [id]: { valid: res.valid, time: new Date().toLocaleTimeString() }
      }));
      if (res.valid) {
        showToast(`Report ${id} integrity VERIFIED: zero tampering detected.`);
      } else {
        showToast(`WARNING: Report ${id} signature mismatch!`, "error");
      }
    } catch (err: any) {
      showToast(err.message || "Integrity verification failed", "error");
    } finally {
      setVerifyingId(null);
    }
  };

  // Handler: Delete Report
  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete archived report ${id}?`)) return;

    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast(`Report ${id} removed from archive.`);
    } catch (err) {
      showToast("Failed to delete report", "error");
    }
  };

  // Handler: Download Master Archive JSON
  const handleExportMasterArchive = () => {
    window.location.href = "/api/reports/export/master-archive";
  };

  // Metrics summary
  const sealedCount = reports.filter((r) => r.archivalStatus === "SEALED_JUDICIAL").length;
  const courtDiscoveryCount = reports.filter((r) => r.retentionCategory === "COURT_DISCOVERY").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-2xl flex items-center gap-2.5 text-xs font-medium border animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
              : "bg-red-950 border-red-500/50 text-red-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner & Core Action */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold tracking-widest uppercase">
              PERSISTENT EVIDENCE REPOSITORY
            </span>
            <span className="text-[11px] font-mono text-white/40">FIPS 180-4 COMPLIANT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Archive className="w-6 h-6 text-emerald-400" />
            <span>Evidence Reports Archive &amp; Future Reference Vault</span>
          </h1>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Store, catalog, and cryptographically seal full evidentiary dossiers across all investigations. Archived reports remain permanently verifiable and accessible for future courtroom presentation, cold-case retrieval, and regulatory discovery.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-store-all-reports"
            onClick={handleStoreAll}
            disabled={isStoringAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all shrink-0"
          >
            {isStoringAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Archiving All Evidences...</span>
              </>
            ) : (
              <>
                <FolderDown className="w-4 h-4" />
                <span>Store All Evidence Reports for Future Use</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsStoreSingleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-sm bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider border border-white/10 hover:border-white/20 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Archive Specific Case</span>
          </button>

          <button
            onClick={handleExportMasterArchive}
            title="Download complete evidence vault archive in JSON"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-sm bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider border border-white/10 hover:border-white/20 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Master Archive</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            STORED EVIDENCE REPORTS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{reports.length}</span>
            <span className="text-[10px] text-emerald-400 font-mono">Archived</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            SEALED JUDICIAL DOSSIERS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{sealedCount}</span>
            <span className="text-[10px] text-white/50 font-mono">FIPS 180-4</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            COURT DISCOVERY READY
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{courtDiscoveryCount}</span>
            <span className="text-[10px] text-emerald-400 font-mono">Admissible</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
            INTEGRITY STATUS
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-white font-mono">100% UNTAMPERED</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by Case ID, title, SHA-256 hash, or examiner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-black/50 border border-white/10 focus:border-emerald-500 text-xs text-white placeholder-white/40 focus:outline-none transition-colors font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-white/40">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none font-mono"
          >
            <option value="ALL">All Categories</option>
            <option value="COURT_DISCOVERY">Court Discovery</option>
            <option value="COLD_CASE">Cold Case</option>
            <option value="STATUTORY_AUDIT">Statutory Audit</option>
            <option value="RESEARCH_REFERENCE">Research Reference</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="SEALED_JUDICIAL">Sealed Judicial</option>
            <option value="ARCHIVED_ACTIVE">Archived Active</option>
            <option value="PERMANENT_COLD_STORAGE">Permanent Cold Storage</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-16 text-center text-white/40 font-mono text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading Evidence Reports Vault...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 rounded-lg bg-white/[0.02] border border-white/10 text-center space-y-4">
          <Archive className="w-10 h-10 text-white/20 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              No Evidence Reports Found in Vault
            </h3>
            <p className="text-xs text-white/40 max-w-md mx-auto mt-1">
              Store current evidence reports using the button below to preserve comprehensive forensic dossiers for future legal and audit reference.
            </p>
          </div>
          <button
            onClick={handleStoreAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <FolderDown className="w-4 h-4" />
            <span>Store All Evidence Reports Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const integrity = integrityResults[report.id];
            const isVerifying = verifyingId === report.id;

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="group p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3"
              >
                {/* Top Row: IDs, Dates, Badges */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                      {report.id}
                    </span>
                    <span className="text-xs font-mono text-white/40">Ref: {report.caseId}</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-white/60 uppercase">
                      {report.retentionCategory.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/30" />
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      FIPS 180-4 Sealed
                    </span>
                  </div>
                </div>

                {/* Middle Row: Case Title and Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {report.caseTitle}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-1 max-w-3xl">
                      {report.summary.executiveOverview}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">
                      {report.summary.confidenceScore}% Confidence
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-black/50 border border-white/10 text-[10px] text-white/70">
                      {report.admissibilityRating}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Fingerprint snippet and Action Buttons */}
                <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-3 text-[11px] text-white/40">
                    <span>
                      SHA-256: <strong className="text-white/70">{report.evidenceSnapshot.sha256.slice(0, 16)}...</strong>
                    </span>
                    <span>
                      Examiner: <strong className="text-white/70">{report.examiner.name}</strong>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Live integrity state if checked */}
                    {integrity && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold ${
                          integrity.valid ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {integrity.valid ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{integrity.valid ? "Verified Clean" : "Tamper Detected"}</span>
                      </span>
                    )}

                    <button
                      onClick={(e) => handleVerifyIntegrity(report.id, e)}
                      disabled={isVerifying}
                      title="Verify SHA-256 tamper seal against archive signature"
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                    >
                      {isVerifying ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Verify Seal</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find matching case if available to generate PDF
                        const matchingCase = cases.find((c) => c.id === report.caseId);
                        if (matchingCase) {
                          generateForensicReportPdf(matchingCase);
                        } else {
                          setSelectedReport(report);
                        }
                      }}
                      title="Download Official PDF Report"
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Dossier</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteReport(report.id, e)}
                      title="Delete Report"
                      className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: View Stored Evidence Report */}
      {selectedReport && (
        <EvidenceReportViewerModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onNavigateToCase={(caseId) => onNavigate("case-detail", caseId)}
        />
      )}

      {/* Modal: Store Single Case Report */}
      {isStoreSingleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-lg p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Archive Evidence Report to Vault
                </h3>
              </div>
              <button
                onClick={() => setIsStoreSingleOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStoreSingle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/60 uppercase block">
                  Select Target Investigation Case
                </label>
                <select
                  value={targetCaseId}
                  onChange={(e) => setTargetCaseId(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black border border-white/10 text-xs text-white focus:outline-none font-mono"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/60 uppercase block">
                    Examiner Name
                  </label>
                  <input
                    type="text"
                    value={examinerName}
                    onChange={(e) => setExaminerName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-black border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/60 uppercase block">
                    Examiner Badge / ID
                  </label>
                  <input
                    type="text"
                    value={examinerBadge}
                    onChange={(e) => setExaminerBadge(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-black border border-white/10 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/60 uppercase block">
                  Retention &amp; Discovery Category
                </label>
                <select
                  value={retentionCategory}
                  onChange={(e) => setRetentionCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-black border border-white/10 text-xs text-white font-mono"
                >
                  <option value="COURT_DISCOVERY">Court Discovery (Hearing Ready)</option>
                  <option value="COLD_CASE">Cold Case (Long-Term Vault)</option>
                  <option value="STATUTORY_AUDIT">Statutory Audit (Regulatory Compliance)</option>
                  <option value="RESEARCH_REFERENCE">Research Reference (Precedent Study)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-white/60 uppercase block">
                  Examiner Archival Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for future legal proceedings, chain of custody logs, or evidence handling details..."
                  className="w-full p-2.5 rounded bg-black border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsStoreSingleOpen(false)}
                  className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider"
                >
                  Archive Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
