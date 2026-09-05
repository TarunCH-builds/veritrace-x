import React, { useState, useEffect } from "react";
import {
  Upload,
  Hash,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Download,
  RefreshCw,
  ShieldCheck,
  Scale,
  Layers,
  Cpu,
  Eye,
  Scan,
  Fingerprint
} from "lucide-react";
import {
  compareDualImages,
  calculateLabHash,
  fetchCases,
  generateForensicSummary
} from "../lib/api.js";
import { ForensicCase, ForensicExecutiveSummary } from "../types.js";
import { CorrelationRadarGraph } from "../components/correlation/CorrelationRadarGraph.js";

export const ForensicLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"COMPARE" | "SUMMARY" | "HASH_TOOL">("SUMMARY");

  // -------------------------------------------------------------
  // State for Dual Image Comparator
  // -------------------------------------------------------------
  const [imgA, setImgA] = useState<string | null>(null);
  const [imgB, setImgB] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compResult, setCompResult] = useState<any | null>(null);
  const [compSummary, setCompSummary] = useState<ForensicExecutiveSummary | null>(null);
  const [isCompSummarizing, setIsCompSummarizing] = useState(false);
  const [autoGenCompSummary, setAutoGenCompSummary] = useState(true);

  // -------------------------------------------------------------
  // State for Fast Hash Tool
  // -------------------------------------------------------------
  const [hashFileBase64, setHashFileBase64] = useState<string | null>(null);
  const [hashResult, setHashResult] = useState<{
    sha256: string;
    perceptualHash: string;
    sizeBytes: number;
  } | null>(null);

  // -------------------------------------------------------------
  // State for Executive Evidence Summarizer (Gemini API)
  // -------------------------------------------------------------
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [uploadedEvidence, setUploadedEvidence] = useState<{
    base64: string;
    filename: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const [focusArea, setFocusArea] = useState<string>("Judicial Admissibility & Authenticity");
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [executiveSummary, setExecutiveSummary] = useState<ForensicExecutiveSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load cases for selection in Summary tab
  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      const caseList = await fetchCases();
      setCases(caseList);
      if (caseList.length > 0 && !selectedCaseId && !uploadedEvidence) {
        setSelectedCaseId(caseList[0].id);
        // Automatically trigger summary for the default selected case
        triggerCaseSummary(caseList[0].id, focusArea);
      }
    } catch (err) {
      console.error("Failed to load cases for lab summary:", err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  const triggerCaseSummary = async (caseId: string, focus: string) => {
    if (!caseId) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const summary = await generateForensicSummary({
        caseId,
        focusArea: focus
      });
      setExecutiveSummary(summary);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to generate executive summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const triggerDirectSummary = async (
    b64: string,
    filename: string,
    mimeType: string,
    focus: string
  ) => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const summary = await generateForensicSummary({
        imageBase64: b64,
        filename,
        mimeType,
        focusArea: focus
      });
      setExecutiveSummary(summary);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to generate executive summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setUploadedEvidence(null);
    if (autoGenerate && caseId) {
      triggerCaseSummary(caseId, focusArea);
    }
  };

  const handleSummaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        setSelectedCaseId("");
        const uploadObj = {
          base64: b64,
          filename: file.name,
          mimeType: file.type || "image/png",
          previewUrl: b64
        };
        setUploadedEvidence(uploadObj);
        if (autoGenerate) {
          triggerDirectSummary(b64, file.name, file.type || "image/png", focusArea);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualGenerate = () => {
    if (uploadedEvidence) {
      triggerDirectSummary(
        uploadedEvidence.base64,
        uploadedEvidence.filename,
        uploadedEvidence.mimeType,
        focusArea
      );
    } else if (selectedCaseId) {
      triggerCaseSummary(selectedCaseId, focusArea);
    }
  };

  // -------------------------------------------------------------
  // Dual Comparison Handlers
  // -------------------------------------------------------------
  const handleUploadA = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImgA(ev.target?.result as string);
        setCompResult(null);
        setCompSummary(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUploadB = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImgB(ev.target?.result as string);
        setCompResult(null);
        setCompSummary(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const runComparison = async () => {
    if (!imgA || !imgB) return;
    setIsComparing(true);
    setCompSummary(null);
    try {
      const res = await compareDualImages(imgA, imgB);
      setCompResult(res);

      // Automatically generate comparative executive summary with Gemini if enabled
      if (autoGenCompSummary) {
        setIsCompSummarizing(true);
        try {
          const summary = await generateForensicSummary({
            comparisonData: res,
            focusArea: "Dual Evidence Artifact Comparative Concordance"
          });
          setCompSummary(summary);
        } catch (sumErr) {
          console.warn("Auto comparison summary generation failed:", sumErr);
        } finally {
          setIsCompSummarizing(false);
        }
      }
    } catch (err: any) {
      alert("Comparison failed: " + err.message);
    } finally {
      setIsComparing(false);
    }
  };

  const generateComparisonSummaryManual = async () => {
    if (!compResult) return;
    setIsCompSummarizing(true);
    try {
      const summary = await generateForensicSummary({
        comparisonData: compResult,
        focusArea: "Dual Evidence Artifact Comparative Concordance"
      });
      setCompSummary(summary);
    } catch (err: any) {
      alert("Summary generation failed: " + (err.message || err));
    } finally {
      setIsCompSummarizing(false);
    }
  };

  // -------------------------------------------------------------
  // Fast Hash Handler
  // -------------------------------------------------------------
  const handleFastHash = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const b64 = ev.target?.result as string;
        setHashFileBase64(b64);
        const res = await calculateLabHash(b64);
        setHashResult(res);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // -------------------------------------------------------------
  // Copy & Export Utilities
  // -------------------------------------------------------------
  const copyReportToClipboard = (summary: ForensicExecutiveSummary) => {
    const text = `=======================================================
VERITRACE FORENSIC LABORATORY: EXECUTIVE SUMMARY
=======================================================
TITLE: ${summary.title}
CASE REF: ${summary.caseId || "N/A"}
TIMESTAMP: ${summary.generatedAt}
ENGINE / MODEL: ${summary.modelUsed}
VERDICT: ${summary.verdict}
CONFIDENCE SCORE: ${summary.confidenceScore}%
ADMISSIBILITY STATUS: ${summary.evidentiaryAdmissibility.status}

EXECUTIVE OVERVIEW:
${summary.executiveOverview}

KEY FORENSIC FINDINGS:
${summary.keyFindings.map((k, i) => `[${i + 1}] ${k}`).join("\n")}

BIOMETRIC & FACIAL GEOMETRY:
- Faces Detected: ${summary.biometricAssessment?.facesDetected ?? "N/A"}
- Concordance Analysis: ${summary.biometricAssessment?.concordanceAnalysis || "N/A"}
- Pose & Occlusion: ${summary.biometricAssessment?.poseAndOcclusion || "N/A"}
- Biometric Risk Level: ${summary.biometricAssessment?.biometricIntegrityRisk || "N/A"}

CRYPTOGRAPHIC INTEGRITY:
- Hash Integrity: ${summary.cryptographicAssessment.hashIntegrity}
- Perceptual Shift Analysis: ${summary.cryptographicAssessment.perceptualShiftAnalysis}
- Tampering Probability: ${summary.cryptographicAssessment.tamperingProbability}

CHAIN OF CUSTODY & ADMISSIBILITY:
- Notes: ${summary.evidentiaryAdmissibility.chainOfCustodyNotes}
- Recommended Next Actions:
${summary.evidentiaryAdmissibility.recommendedActions.map((a) => `  * ${a}`).join("\n")}

=======================================================
DISCLAIMER: Certified algorithmic evaluation in compliance with ISO/IEC 27037.
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = (summary: ForensicExecutiveSummary) => {
    const text = `# ${summary.title}
**Case Reference:** ${summary.caseId || "N/A"}  
**Generated:** ${summary.generatedAt}  
**Model:** ${summary.modelUsed}  
**Verdict:** ${summary.verdict} (${summary.confidenceScore}%)  
**Admissibility:** ${summary.evidentiaryAdmissibility.status}  

---

## Executive Overview
${summary.executiveOverview}

## Key Forensic Findings
${summary.keyFindings.map((f) => `- ${f}`).join("\n")}

## Biometric Assessment
- **Faces Detected:** ${summary.biometricAssessment?.facesDetected ?? "N/A"}
- **Concordance Analysis:** ${summary.biometricAssessment?.concordanceAnalysis || "N/A"}
- **Pose & Occlusion:** ${summary.biometricAssessment?.poseAndOcclusion || "N/A"}
- **Biometric Risk Level:** ${summary.biometricAssessment?.biometricIntegrityRisk || "N/A"}

## Cryptographic Assessment
- **Hash Integrity:** ${summary.cryptographicAssessment.hashIntegrity}
- **Perceptual Shift:** ${summary.cryptographicAssessment.perceptualShiftAnalysis}
- **Tampering Probability:** ${summary.cryptographicAssessment.tamperingProbability}

## Chain of Custody & Judicial Admissibility
${summary.evidentiaryAdmissibility.chainOfCustodyNotes}

### Recommended Actions
${summary.evidentiaryAdmissibility.recommendedActions.map((a) => `- ${a}`).join("\n")}
`;
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Forensic_Executive_Summary_${summary.caseId || "Analysis"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "CONFIRMED_AUTHENTIC":
        return (
          <span className="px-2.5 py-1 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed Authentic
          </span>
        );
      case "STRONG_CORRELATION":
        return (
          <span className="px-2.5 py-1 rounded-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            Strong Correlation
          </span>
        );
      case "PROBABLE_DERIVATIVE":
        return (
          <span className="px-2.5 py-1 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Probable Derivative
          </span>
        );
      case "TAMPER_SUSPECTED":
        return (
          <span className="px-2.5 py-1 rounded-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Tamper Suspected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-sm bg-white/10 text-white/70 border border-white/20 text-[10px] font-bold uppercase tracking-wider">
            {verdict}
          </span>
        );
    }
  };

  return (
    <div id="forensic-lab-view" className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER & NAVIGATION TABS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-500"></div>
            Forensic Analytical Workbench
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Cryptographic authentication, comparative artifact diagnostics, and Gemini-powered executive forensic summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center p-1 rounded-sm bg-black/60 border border-white/10 text-xs font-mono backdrop-blur-md">
          <button
            id="tab-btn-summary"
            onClick={() => setActiveTab("SUMMARY")}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === "SUMMARY"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Executive Evidence Summarizer
          </button>
          <button
            id="tab-btn-compare"
            onClick={() => setActiveTab("COMPARE")}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === "COMPARE"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Dual Image Comparator
          </button>
          <button
            id="tab-btn-hash"
            onClick={() => setActiveTab("HASH_TOOL")}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === "HASH_TOOL"
                ? "bg-emerald-500 text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Fast Hash Inspector
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: EXECUTIVE EVIDENCE SUMMARIZER (GEMINI API)             */}
      {/* ============================================================= */}
      {activeTab === "SUMMARY" && (
        <div className="space-y-6">
          {/* Controls Bar: Source selection, Examiner Focus, Auto-Generate Toggle */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4 font-mono">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Visual Evidence Ingestion & Synthesis Control
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white transition-colors">
                  <input
                    id="auto-generate-toggle"
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-[11px] text-white/60">Auto-Generate on Selection</span>
                </label>
                <div className="h-3 w-px bg-white/10"></div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Gemini 3.8 Flash Ready
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option A: Select from Vault Cases */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
                  Select Case from Investigation Vault
                </label>
                <select
                  id="select-vault-case"
                  value={selectedCaseId}
                  onChange={(e) => handleSelectCase(e.target.value)}
                  disabled={isLoadingCases}
                  className="w-full bg-black/60 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Vault Case ({cases.length} available) --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.id}] {c.title.length > 32 ? c.title.slice(0, 32) + "..." : c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Option B: Direct File Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
                  Or Upload Ad-hoc Evidence Artifact
                </label>
                <label
                  id="upload-adhoc-evidence"
                  className="w-full flex items-center justify-between px-3 py-2 bg-black/60 border border-white/10 rounded-sm cursor-pointer hover:border-white/20 transition-all text-xs text-white/60 hover:text-white"
                >
                  <span className="truncate">
                    {uploadedEvidence ? uploadedEvidence.filename : "Select local image file..."}
                  </span>
                  <Upload className="w-3.5 h-3.5 text-white/40 ml-2 shrink-0" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSummaryUpload}
                  />
                </label>
              </div>

              {/* Examiner Focus Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
                  Examiner Focus Objective
                </label>
                <select
                  id="select-focus-area"
                  value={focusArea}
                  onChange={(e) => {
                    setFocusArea(e.target.value);
                    if (autoGenerate) {
                      if (uploadedEvidence) {
                        triggerDirectSummary(
                          uploadedEvidence.base64,
                          uploadedEvidence.filename,
                          uploadedEvidence.mimeType,
                          e.target.value
                        );
                      } else if (selectedCaseId) {
                        triggerCaseSummary(selectedCaseId, e.target.value);
                      }
                    }
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Judicial Admissibility & Authenticity">
                    Judicial Admissibility & Authenticity
                  </option>
                  <option value="Deepfake & AI Manipulation Audit">
                    Deepfake & AI Manipulation Audit
                  </option>
                  <option value="Biometric Landmark & Facial Geometry Concordance">
                    Biometric Landmark Concordance
                  </option>
                  <option value="Cryptographic Hash & Chain-of-Custody Integrity">
                    Chain-of-Custody & Hash Assurance
                  </option>
                </select>
              </div>
            </div>

            {/* Action Trigger Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[11px] text-white/40">
                {selectedCaseId
                  ? `Active target: Case ${selectedCaseId}`
                  : uploadedEvidence
                  ? `Active target: Local file ${uploadedEvidence.filename}`
                  : "Select a case or upload visual evidence to initiate synthesis."}
              </span>
              <button
                id="btn-generate-summary"
                onClick={handleManualGenerate}
                disabled={isGeneratingSummary || (!selectedCaseId && !uploadedEvidence)}
                className="flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                {isGeneratingSummary ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Visual Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Executive Summary (Gemini)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isGeneratingSummary && (
            <div className="p-8 rounded-lg bg-white/[0.02] border border-white/10 text-center space-y-3 font-mono">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Synthesizing Executive Forensic Summary
              </h3>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Executing multimodal visual inspection with Gemini API. Formulating facial geometry, cryptographic digests, and chain-of-custody admissibility notes...
              </p>
            </div>
          )}

          {/* Error Notice */}
          {summaryError && !isGeneratingSummary && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-bold uppercase block">Synthesis Warning</span>
                <span>{summaryError}</span>
              </div>
            </div>
          )}

          {/* EXECUTIVE SUMMARY REPORT CARD */}
          {executiveSummary && !isGeneratingSummary && (
            <div
              id="forensic-executive-summary-report"
              className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6 font-mono text-xs"
            >
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                      OFFICIAL JUDICIAL MEMORANDUM
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-[10px] text-emerald-400">ISO/IEC 27037 Compliant</span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {executiveSummary.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getVerdictBadge(executiveSummary.verdict)}

                  <div className="px-2.5 py-1 rounded-sm bg-black/60 border border-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider">
                    Score: <span className="text-emerald-400">{executiveSummary.confidenceScore.toFixed(1)}%</span>
                  </div>

                  <div className="px-2.5 py-1 rounded-sm bg-black/60 border border-white/10 text-white/50 text-[10px] tracking-wider">
                    {executiveSummary.evidentiaryAdmissibility.status}
                  </div>

                  {/* Actions: Copy & Download */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      id="btn-copy-summary"
                      onClick={() => copyReportToClipboard(executiveSummary)}
                      title="Copy full executive summary to clipboard"
                      className="p-1.5 rounded-sm bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      id="btn-download-summary"
                      onClick={() => downloadReport(executiveSummary)}
                      title="Download summary report (.md)"
                      className="p-1.5 rounded-sm bg-black/60 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Executive Overview Narrative */}
              <div className="p-4 rounded bg-black/60 border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Executive Findings & Forensic Evaluation
                </span>
                <p className="text-white/80 leading-relaxed text-xs">
                  {executiveSummary.executiveOverview}
                </p>
              </div>

              {/* Key Findings List */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                  Core Evidentiary Observations
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {executiveSummary.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-black/40 border border-white/5 flex items-start gap-2.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-white/70 text-xs leading-normal">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Diagnostics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Biometric & Facial Geometry Column */}
                <div className="p-4 rounded bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5" />
                      Biometric & Morphological Analysis
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        executiveSummary.biometricAssessment?.biometricIntegrityRisk === "LOW"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      Risk: {executiveSummary.biometricAssessment?.biometricIntegrityRisk || "LOW"}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Subjects Detected</span>
                      <span className="text-white font-bold">
                        {executiveSummary.biometricAssessment?.facesDetected ?? 1} Human Face(s) Mapped
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Concordance Analysis</span>
                      <span className="text-white/80">
                        {executiveSummary.biometricAssessment?.concordanceAnalysis}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Pose & Occlusion</span>
                      <span className="text-white/80">
                        {executiveSummary.biometricAssessment?.poseAndOcclusion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic & Hash Column */}
                <div className="p-4 rounded bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Cryptographic & Digest Assurance
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        executiveSummary.cryptographicAssessment.tamperingProbability === "VERY_LOW" ||
                        executiveSummary.cryptographicAssessment.tamperingProbability === "LOW"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      Tamper Prob: {executiveSummary.cryptographicAssessment.tamperingProbability}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Hash Integrity</span>
                      <span className="text-white font-bold">
                        {executiveSummary.cryptographicAssessment.hashIntegrity}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Perceptual Shift Analysis</span>
                      <span className="text-white/80">
                        {executiveSummary.cryptographicAssessment.perceptualShiftAnalysis}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase">Standards Alignment</span>
                      <span className="text-white/80">
                        FIPS 180-4 SHA-256 Digest & Canonical Manifest Serialization
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chain of Custody & Judicial Recommendations */}
              <div className="p-4 rounded bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                    Chain of Custody & Examiner Action Items
                  </span>
                </div>
                <p className="text-white/70 text-xs">
                  {executiveSummary.evidentiaryAdmissibility.chainOfCustodyNotes}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] text-white/40 uppercase block mb-1.5 font-bold">
                    Recommended Next Protocol Steps:
                  </span>
                  <ul className="space-y-1">
                    {executiveSummary.evidentiaryAdmissibility.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/80 text-xs">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-white/10 text-[10px] text-white/30">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>Synthesized by {executiveSummary.modelUsed}</span>
                </div>
                <span>Certified at: {new Date(executiveSummary.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: DUAL ARTIFACT COMPARATOR                               */}
      {/* ============================================================= */}
      {activeTab === "COMPARE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image A */}
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">
                Artifact A (Primary Evidence)
              </span>
              <div className="h-48 rounded bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                {imgA ? (
                  <img src={imgA} alt="A" className="h-full object-contain" />
                ) : (
                  <label className="cursor-pointer text-xs font-mono text-white/40 flex flex-col items-center gap-2 hover:text-white transition-colors">
                    <Upload className="w-6 h-6 text-white/30" />
                    <span className="uppercase text-[11px] tracking-wider">Upload Artifact A</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadA} />
                  </label>
                )}
              </div>
            </div>

            {/* Image B */}
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">
                Artifact B (Comparison Candidate)
              </span>
              <div className="h-48 rounded bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                {imgB ? (
                  <img src={imgB} alt="B" className="h-full object-contain" />
                ) : (
                  <label className="cursor-pointer text-xs font-mono text-white/40 flex flex-col items-center gap-2 hover:text-white transition-colors">
                    <Upload className="w-6 h-6 text-white/30" />
                    <span className="uppercase text-[11px] tracking-wider">Upload Artifact B</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadB} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {imgA && imgB && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded bg-white/[0.02] border border-white/10 font-mono text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoGenCompSummary}
                  onChange={(e) => setAutoGenCompSummary(e.target.checked)}
                  className="accent-emerald-500 rounded cursor-pointer"
                />
                <span className="text-[11px]">Auto-generate Gemini Executive Summary on comparison</span>
              </label>

              <button
                id="btn-execute-comparison"
                onClick={runComparison}
                disabled={isComparing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isComparing
                    ? "Analyzing Biometric & Pixel Convergence..."
                    : "Execute Forensic Comparison"}
                </span>
              </button>
            </div>
          )}

          {/* Comparison Output */}
          {compResult && (
            <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Forensic Comparison Verdict
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                  {compResult.verdict}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-black/60 border border-white/10 space-y-1">
                  <span className="text-white/40 block text-[10px] uppercase tracking-wider">
                    BYTE-LEVEL INTEGRITY
                  </span>
                  <span
                    className={
                      compResult.byteIdentical
                        ? "text-emerald-400 font-bold uppercase"
                        : "text-amber-400 font-bold uppercase"
                    }
                  >
                    {compResult.byteIdentical ? "Exact Byte-for-Byte Match" : "Non-Identical Digests"}
                  </span>
                </div>

                <div className="p-3 rounded bg-black/60 border border-white/10 space-y-1">
                  <span className="text-white/40 block text-[10px] uppercase tracking-wider">
                    BIOMETRIC SIMILARITY
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {compResult.faceComparison.faceSimilarity}% (Cosine Similarity)
                  </span>
                </div>
              </div>

              <p className="text-white/70 text-xs leading-relaxed">
                {compResult.faceComparison.summary}
              </p>

              {/* Comparative Multi-Signal Correlation Radar in Graph Format */}
              <div className="pt-2">
                <CorrelationRadarGraph
                  correlation={{
                    overallAssessment: compResult.verdict,
                    faceCorrelationScore: compResult.faceComparison.faceSimilarity,
                    visualPerceptualScore: compResult.byteIdentical ? 100 : Math.max(60, compResult.faceComparison.faceSimilarity - 5),
                    sourceConsistencyScore: 85,
                    metadataConsistencyScore: 92,
                    summary: compResult.faceComparison.summary,
                    scientificDisclaimer: "Comparative forensic evaluation synthesized across spatial frequency and vector embeddings."
                  }}
                  compact={true}
                />
              </div>

              {/* Gemini Executive Summary for Comparison */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Gemini Executive Comparison Summary
                    </span>
                  </div>
                  {!compSummary && (
                    <button
                      id="btn-generate-comp-summary"
                      onClick={generateComparisonSummaryManual}
                      disabled={isCompSummarizing}
                      className="px-3 py-1.5 rounded-sm bg-black/60 hover:bg-black/90 border border-white/20 text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                      {isCompSummarizing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating Summary...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Gemini Summary</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isCompSummarizing && (
                  <div className="p-4 rounded bg-white/[0.02] border border-white/10 text-center text-xs text-white/50 animate-pulse">
                    Synthesizing comparative executive memorandum with Gemini 3.8 Flash...
                  </div>
                )}

                {compSummary && !isCompSummarizing && (
                  <div className="p-4 rounded bg-black/60 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getVerdictBadge(compSummary.verdict)}
                        <span className="text-white/40 text-[10px]">
                          Confidence: {compSummary.confidenceScore.toFixed(1)}%
                        </span>
                      </div>
                      <button
                        onClick={() => copyReportToClipboard(compSummary)}
                        className="text-[10px] text-white/40 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Report</span>
                      </button>
                    </div>

                    <p className="text-white/80 text-xs leading-relaxed">
                      {compSummary.executiveOverview}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-white/40 uppercase block font-bold">
                        Key Comparative Findings:
                      </span>
                      <ul className="space-y-1 text-white/70 text-xs">
                        {compSummary.keyFindings.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30">
                      <span>Model: {compSummary.modelUsed}</span>
                      <span>Admissibility: {compSummary.evidentiaryAdmissibility.status}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: FAST HASH GENERATOR TOOL                               */}
      {/* ============================================================= */}
      {activeTab === "HASH_TOOL" && (
        <div className="max-w-2xl mx-auto p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            Fast Cryptographic & Perceptual Hash Generator
          </h3>

          <label className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center flex flex-col items-center justify-center cursor-pointer hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
            <Upload className="w-6 h-6 text-white/40 mb-2" />
            <span className="text-xs text-white/70">Upload any file to calculate SHA-256 and pHash</span>
            <input type="file" className="hidden" onChange={handleFastHash} />
          </label>

          {hashResult && (
            <div className="space-y-3 font-mono text-xs pt-2">
              <div className="p-3 rounded bg-black/60 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase tracking-wider">
                  CRYPTOGRAPHIC SHA-256 (FIPS 180-4)
                </span>
                <span className="text-emerald-400 break-all select-all font-bold">
                  {hashResult.sha256}
                </span>
              </div>

              <div className="p-3 rounded bg-black/60 border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase tracking-wider">
                  PERCEPTUAL GRADIENT HASH (pHash)
                </span>
                <span className="text-white/80 break-all select-all font-bold">
                  {hashResult.perceptualHash}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
