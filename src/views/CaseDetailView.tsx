import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Scan,
  Globe,
  Network,
  Blocks,
  FileText,
  Clock,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  Info,
  RefreshCw,
  Fingerprint,
  Hash,
  AlertTriangle,
  Archive,
  FolderDown,
  Eye,
  Lock
} from "lucide-react";
import { fetchCase, verifyCaseEvidence, anchorBlockchain, fetchReports, storeEvidenceReport } from "../lib/api.js";
import { ForensicCase, StoredEvidenceReport } from "../types.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { FaceOverlay } from "../components/FaceOverlay.js";
import { EvidenceGraph } from "../components/EvidenceGraph.js";
import { generateForensicReportPdf } from "../lib/pdfReport.js";
import { EvidenceReportViewerModal } from "../components/EvidenceReportViewerModal.js";

interface CaseDetailViewProps {
  caseId: string;
  onNavigate: (view: string, caseId?: string) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, onNavigate }) => {
  const [forensicCase, setForensicCase] = useState<ForensicCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "biometrics" | "sources" | "correlation" | "blockchain" | "custody" | "report"
  >("overview");

  const [copiedHash, setCopiedHash] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [savedReports, setSavedReports] = useState<StoredEvidenceReport[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedStoredReport, setSelectedStoredReport] = useState<StoredEvidenceReport | null>(null);

  const loadCase = async () => {
    setLoading(true);
    try {
      const [data, reportsData] = await Promise.all([
        fetchCase(caseId),
        fetchReports({ caseId }).catch(() => [])
      ]);
      setForensicCase(data);
      setSavedReports(reportsData);
    } catch (err) {
      console.error("Failed to load case", err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveReport = async () => {
    if (!forensicCase) return;
    setIsArchiving(true);
    try {
      const res = await storeEvidenceReport({
        caseId: forensicCase.id,
        examiner: {
          name: "Chief Investigator",
          badgeId: "VERI-SEAL-091",
          agency: "VeriTrace Evidence Authority"
        },
        retentionCategory: "COURT_DISCOVERY",
        notes: `Archived for future reference and court discovery on ${new Date().toLocaleDateString()}`
      });
      setSavedReports((prev) => [res, ...prev]);
    } catch (err) {
      console.error("Failed to archive report", err);
    } finally {
      setIsArchiving(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  if (loading || !forensicCase) {
    return (
      <div className="p-16 text-center space-y-3 font-mono text-xs text-neutral-400">
        <Scan className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
        <p>Retrieving case {caseId} from cryptographic storage...</p>
      </div>
    );
  }

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "biometrics", label: "Face Forensics", icon: Scan },
    { id: "sources", label: `Sources (${forensicCase.searchResults?.length || 0})`, icon: Globe },
    { id: "correlation", label: "Correlation & Graph", icon: Network },
    { id: "blockchain", label: "Blockchain Anchor", icon: Blocks },
    { id: "custody", label: "Chain of Custody", icon: Clock },
    { id: "report", label: "Forensic Report", icon: Download }
  ] as const;

  return (
    <div id="case-detail-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("vault")}
            className="p-2 text-white/50 hover:text-white rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {forensicCase.id}
              </span>
              <StatusBadge status={forensicCase.status} size="sm" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-xl">
              {forensicCase.title}
            </h1>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate("verify", forensicCase.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 transition-colors backdrop-blur-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Evidence</span>
          </button>

          <button
            onClick={() => generateForensicReportPdf(forensicCase)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Forensic Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-sm text-xs font-medium whitespace-nowrap transition-colors border-b-2 font-mono uppercase tracking-wider ${
                isActive
                  ? "border-emerald-400 text-emerald-400 bg-white/5 font-bold"
                  : "border-transparent text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evidence Image with Face Overlay */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  Visual Evidence Raster
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {forensicCase.metadata.width && forensicCase.metadata.height
                    ? `${forensicCase.metadata.width}x${forensicCase.metadata.height} px`
                    : "High Resolution"}
                </span>
              </div>

              <FaceOverlay
                imageUrl={forensicCase.evidenceFile.url}
                faceData={forensicCase.faceData}
              />
            </div>

            {/* Correlation Summary Card */}
            {forensicCase.correlation && (
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    Evidence Correlation Summary
                  </span>
                  <StatusBadge status={forensicCase.correlation.overallAssessment} size="sm" />
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {forensicCase.correlation.summary}
                </p>
                <div className="p-2.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-white/50 italic">
                  {forensicCase.correlation.scientificDisclaimer}
                </div>
              </div>
            )}
          </div>

          {/* Technical Metadata & Quick Anchors */}
          <div className="space-y-4">
            {/* SHA-256 Card */}
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-white/40">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] uppercase">
                  <Hash className="w-3.5 h-3.5" />
                  SHA-256 Digest
                </span>
                <button
                  onClick={() => copyHash(forensicCase.metadata.sha256)}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 break-all select-all">
                {forensicCase.metadata.sha256}
              </div>
            </div>

            {/* Blockchain Commitment Summary */}
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3 font-mono text-xs">
              <span className="text-white/40 uppercase tracking-wider font-semibold block text-[10px]">
                Blockchain Anchor
              </span>
              {forensicCase.blockchainAnchor ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-white/40">Network:</span>
                    <span className="text-white truncate max-w-[160px]">
                      {forensicCase.blockchainAnchor.network}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-white/40">Block Number:</span>
                    <span className="text-emerald-400 font-bold">
                      #{forensicCase.blockchainAnchor.blockNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span className="text-white/40">Tx Hash:</span>
                    <span className="text-cyan-400 truncate max-w-[160px]">
                      {forensicCase.blockchainAnchor.transactionHash.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => setActiveTab("blockchain")}
                      className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1"
                    >
                      View Blockchain Ledger Proof →
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-white/40">Blockchain anchor not yet confirmed.</p>
              )}
            </div>

            {/* File Ingestion Details */}
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2.5 font-mono text-xs">
              <span className="text-white/40 uppercase tracking-wider font-semibold block text-[10px]">
                Ingestion Audit
              </span>
              <div className="space-y-1.5 text-white/80">
                <div className="flex justify-between">
                  <span className="text-white/40">File Name:</span>
                  <span className="truncate max-w-[150px]">{forensicCase.metadata.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">File Size:</span>
                  <span>{(forensicCase.metadata.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">MIME Type:</span>
                  <span>{forensicCase.metadata.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Perceptual Hash:</span>
                  <span>{forensicCase.metadata.perceptualHash || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Ingested At:</span>
                  <span>{new Date(forensicCase.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: FACE FORENSICS */}
      {activeTab === "biometrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FaceOverlay
                imageUrl={forensicCase.evidenceFile.url}
                faceData={forensicCase.faceData}
              />
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3 font-mono text-xs">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold block text-[10px]">
                  Biometric Landmark Metrics
                </span>

                {forensicCase.faceData && forensicCase.faceData.facesDetected > 0 ? (
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-white/40">Subjects Detected:</span>
                      <span className="text-white font-bold">
                        {forensicCase.faceData.facesDetected}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Spatial Confidence:</span>
                      <span className="text-emerald-400 font-bold">
                        {(forensicCase.faceData.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Vector Dimensions:</span>
                      <span className="text-white">
                        {forensicCase.faceData.embeddingDimension}-D
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Pose Angle:</span>
                      <span className="text-white/80">
                        {forensicCase.faceData.attributes?.poseEstimated || "Frontal"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Occlusion Score:</span>
                      <span className="text-white/80">
                        {forensicCase.faceData.attributes?.occlusionScore || "Unobstructed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Image Sharpness:</span>
                      <span className="text-white/80">
                        {forensicCase.faceData.attributes?.sharpness || "Diagnostic grade"}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <span className="text-[10px] text-white/40 uppercase block mb-1">
                        Derived Embedding Fingerprint:
                      </span>
                      <div className="p-2 rounded bg-black/60 border border-white/10 text-emerald-400 font-mono tracking-wider text-xs select-all">
                        {forensicCase.faceData.embeddingFingerprint}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40">No human faces localized in this evidence file.</p>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-4 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md space-y-2 text-xs">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  Biometric Privacy Safeguard
                </span>
                <p className="text-white/50 leading-relaxed text-[11px]">
                  Raw high-dimensional biometric vectors and personal identity profiles are NEVER committed to public blockchains. Only cryptographic hash commitments are anchored.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SOURCE INTELLIGENCE */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Candidate Sources Discovered ({forensicCase.searchResults.length})
              </h3>
              <p className="text-[11px] text-white/40">
                Discovered through live visual reverse queries and visual web grounding.
              </p>
            </div>

            <div className="text-xs font-mono text-white/40">
              Provider: <span className="text-emerald-400">{forensicCase.searchResults[0]?.provider || "Active Adapter"}</span>
            </div>
          </div>

          {forensicCase.searchResults.length === 0 ? (
            <div className="p-12 rounded-lg bg-white/[0.02] border border-white/5 text-center space-y-2 font-mono text-xs text-white/40 backdrop-blur-md">
              <Globe className="w-6 h-6 mx-auto text-white/20" />
              <p>No external reverse web occurrences discovered for this subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forensicCase.searchResults.map((src) => (
                <div
                  key={src.id}
                  className="p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md space-y-3 flex flex-col justify-between transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400">
                        {src.domain}
                      </span>
                      {src.correlationAssessment && (
                        <StatusBadge status={src.correlationAssessment} size="sm" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-2">{src.title}</h4>

                    {src.snippet && (
                      <p className="text-[11px] text-white/60 line-clamp-3 leading-relaxed">
                        {src.snippet}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span>{src.publishedDate ? `Published: ${src.publishedDate}` : "Active Record"}</span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Open Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: EVIDENCE CORRELATION & GRAPH */}
      {activeTab === "correlation" && (
        <div className="space-y-6">
          <EvidenceGraph forensicCase={forensicCase} />

          {/* Canonical Manifest JSON Inspector */}
          {forensicCase.manifest && (
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    RFC 8785 Canonical Evidence Manifest
                  </h3>
                  <p className="text-[11px] text-white/40">
                    Deterministic cryptographic payload hashed and committed on-chain.
                  </p>
                </div>
                <button
                  onClick={() => copyHash(JSON.stringify(forensicCase.manifest, null, 2))}
                  className="px-2.5 py-1 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Manifest JSON</span>
                </button>
              </div>

              <pre className="p-4 rounded bg-black/70 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 select-all backdrop-blur-sm">
                {JSON.stringify(forensicCase.manifest, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: BLOCKCHAIN ANCHOR */}
      {activeTab === "blockchain" && (
        <div className="space-y-6">
          {forensicCase.blockchainAnchor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* On-Chain Record Details */}
              <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Blocks className="w-4 h-4 text-emerald-400" />
                    On-Chain Commitment Record
                  </span>
                  <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                    {forensicCase.blockchainAnchor.verificationMode}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-white/40 block text-[10px]">NETWORK / CHAIN ID</span>
                    <span className="text-white font-semibold">
                      {forensicCase.blockchainAnchor.network} (ID: {forensicCase.blockchainAnchor.chainId})
                    </span>
                  </div>

                  <div>
                    <span className="text-white/40 block text-[10px]">TRANSACTION HASH</span>
                    <span className="text-emerald-400 break-all select-all">
                      {forensicCase.blockchainAnchor.transactionHash}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-white/40 block text-[10px]">BLOCK NUMBER</span>
                      <span className="text-white font-bold">
                        #{forensicCase.blockchainAnchor.blockNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px]">TIMESTAMP</span>
                      <span className="text-white/80">
                        {new Date(forensicCase.blockchainAnchor.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-white/40 block text-[10px]">SMART CONTRACT ADDRESS</span>
                    <span className="text-white/80 break-all select-all">
                      {forensicCase.blockchainAnchor.contractAddress}
                    </span>
                  </div>

                  <div>
                    <span className="text-white/40 block text-[10px]">SUBMITTER (GATEWAY WALLET)</span>
                    <span className="text-white/80 break-all select-all">
                      {forensicCase.blockchainAnchor.submitterAddress}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <a
                    href={forensicCase.blockchainAnchor.explorerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider transition-colors backdrop-blur-sm"
                  >
                    <span>View in Block Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Explanatory Panel: Why Blockchain? */}
              <div className="p-6 rounded-lg bg-white/[0.02] border border-white/10 backdrop-blur-md space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Why Anchoring on Blockchain?
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Digital images and forensic metadata can be subtly altered without leaving visible traces. By anchoring the cryptographic SHA-256 hash to a public, immutable ledger at the exact moment of ingestion:
                </p>

                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong>Tamper-Evident:</strong> Even a single pixel modification changes the SHA-256 digest completely, failing blockchain verification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span><strong>Independent Verification:</strong> Any external auditor or courtroom can verify the file without needing to trust VeriTrace X servers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span><strong>Zero Biometric Exposure:</strong> Biometric vectors are never published on-chain, strictly preserving user privacy.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 font-mono text-xs">
              Blockchain anchor pending. Run pipeline or anchor now.
            </div>
          )}
        </div>
      )}

      {/* Tab 6: CHAIN OF CUSTODY */}
      {activeTab === "custody" && (
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Immutable Chain of Custody Timeline
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Chronological log of forensic operations, cryptographic hashes, and responsible actors.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {forensicCase.timeline.map((event, idx) => (
              <div key={event.id} className="relative space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-black" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{event.title}</span>
                  <span className="px-1.5 py-0.2 rounded-sm bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                    {event.stage}
                  </span>
                </div>
                <p className="text-xs text-white/60">{event.description}</p>
                <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 pt-1">
                  <span>Actor: {event.actor}</span>
                  <span>Time: {new Date(event.timestamp).toLocaleString()}</span>
                  {event.hashSnapshot && (
                    <span className="text-emerald-400">Hash: {event.hashSnapshot.slice(0, 16)}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: FORENSIC REPORT */}
      {activeTab === "report" && (
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                  FORENSIC ARCHIVE
                </span>
                {savedReports.length > 0 && (
                  <span className="px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-bold">
                    STORED IN VAULT ({savedReports.length})
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Official Forensic Intelligence Dossier</h3>
              <p className="text-[11px] text-white/40">Standardized PDF report format and immutable cryptographic vault storage for future proceedings.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleArchiveReport}
                disabled={isArchiving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {isArchiving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4 text-emerald-400" />
                )}
                <span>Store in Vault for Future</span>
              </button>

              <button
                onClick={() => generateForensicReportPdf(forensicCase)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Stored Reports in Vault for Future Reference */}
          {savedReports.length > 0 && (
            <div className="p-4 rounded bg-black/40 border border-emerald-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Lock className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Archived Evidences Dossiers in Persistent Vault
                  </span>
                </div>
                <button
                  onClick={() => onNavigate("reports")}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Vault Archive</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {savedReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded bg-black/60 border border-white/10 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{r.id}</span>
                        <span className="text-[10px] text-white/50">{new Date(r.generatedAt).toLocaleString()}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {r.retentionCategory.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block mt-0.5">
                        Seal: {r.reportSignature.slice(0, 24)}... (FIPS 180-4)
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedStoredReport(r)}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-semibold text-[10px] uppercase flex items-center gap-1 border border-white/10"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>View Dossier</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 rounded bg-white text-neutral-900 space-y-4 font-sans shadow-xl">
            <div className="border-b-2 border-neutral-900 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black tracking-tight text-neutral-900">VERITRACE X EVIDENCE DOSSIER</h2>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Cryptographically Anchored Record</p>
              </div>
              <span className="text-xs font-mono text-neutral-500">{forensicCase.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block">CASE TITLE</span>
                <span className="font-bold">{forensicCase.title}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">INGESTION SHA-256</span>
                <span className="font-bold break-all">{forensicCase.metadata.sha256.slice(0, 32)}...</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-100 rounded text-xs">
              <span className="font-bold block mb-1">CORRELATION STATEMENT:</span>
              <p>{forensicCase.correlation?.summary || "Comprehensive analysis completed."}</p>
            </div>

            <div className="text-[11px] text-neutral-500 italic pt-2 border-t border-neutral-200">
              {forensicCase.correlation?.scientificDisclaimer}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Report Viewer Modal */}
      {selectedStoredReport && (
        <EvidenceReportViewerModal
          report={selectedStoredReport}
          onClose={() => setSelectedStoredReport(null)}
          onNavigateToCase={(targetId) => onNavigate("case-detail", targetId)}
        />
      )}
    </div>
  );
};
