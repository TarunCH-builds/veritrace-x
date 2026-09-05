import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileImage,
  Hash,
  ShieldCheck,
  CheckCircle2,
  Scan,
  Globe,
  Network,
  Blocks,
  Play,
  ArrowRight,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import {
  createCase,
  analyzeFace,
  executeReverseSearch,
  correlateEvidence,
  anchorBlockchain
} from "../lib/api.js";
import { ForensicCase } from "../types.js";

interface NewInvestigationViewProps {
  onNavigate: (view: string, caseId?: string) => void;
}

export const NewInvestigationView: React.FC<NewInvestigationViewProps> = ({ onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [caseTitle, setCaseTitle] = useState("");
  
  // Pre-flight metrics
  const [preflightHash, setPreflightHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Pipeline states
  const [pipelineActive, setPipelineActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [createdCase, setCreatedCase] = useState<ForensicCase | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    { label: "1. Ingest & Cryptographic SHA-256", icon: Hash },
    { label: "2. Face Detection & Biometrics", icon: Scan },
    { label: "3. Genuine Reverse Search", icon: Globe },
    { label: "4. Correlation & Evidence Manifest", icon: Network },
    { label: "5. EVM Blockchain Anchoring", icon: Blocks }
  ];

  // Process selected file
  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setFile(selectedFile);
    setCaseTitle(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      setBase64Data(dataUrl);

      // Compute client-side SHA-256 for instant cryptographic pre-flight
      try {
        const arrayBuf = await selectedFile.arrayBuffer();
        const hashBuf = await crypto.subtle.digest("SHA-256", arrayBuf);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setPreflightHash(hashHex);
      } catch {
        setPreflightHash("Calculating on server...");
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const copyHashToClipboard = () => {
    if (preflightHash) {
      navigator.clipboard.writeText(preflightHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  // Run full automated pipeline
  const runFullPipeline = async () => {
    if (!base64Data || !file) return;

    setPipelineActive(true);
    setErrorMsg(null);
    setStepLogs([]);
    setCurrentStep(1);

    try {
      // Step 1: Ingestion & Hashing
      addLog("Ingesting evidence file and generating cryptographic SHA-256...");
      const newCase = await createCase({
        title: caseTitle || `Investigation ${file.name}`,
        filename: file.name,
        mimeType: file.type,
        base64Data
      });
      setCreatedCase(newCase);
      addLog(`Case ${newCase.id} created. SHA-256: ${newCase.metadata.sha256}`);
      setCurrentStep(2);

      // Step 2: Face Detection & Biometric Embedding
      addLog("Executing facial landmark analysis and biometric vector derivation...");
      const analyzedCase = await analyzeFace(newCase.id);
      addLog(
        `Biometrics: ${analyzedCase.faceData?.facesDetected || 0} face(s) localized with ${(
          (analyzedCase.faceData?.confidence || 0.95) * 100
        ).toFixed(1)}% spatial confidence.`
      );
      setCurrentStep(3);

      // Brief rate-limit buffer to respect API burst quotas
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 3: Genuine Reverse Search
      addLog("Querying external reverse search providers for source occurrences...");
      const searchRes = await executeReverseSearch(newCase.id);
      addLog(
        `Reverse Search: Provider '${searchRes.providerUsed}' returned ${searchRes.case.searchResults.length} source candidate(s).`
      );
      setCurrentStep(4);

      // Step 4: Correlation & Manifest Compilation
      addLog("Synthesizing multi-modal correlation & compiling RFC 8785 canonical manifest...");
      const correlatedCase = await correlateEvidence(newCase.id);
      addLog(`Manifest compiled: ${correlatedCase.manifest?.evidenceId}. Assessment: ${correlatedCase.correlation?.overallAssessment}`);
      setCurrentStep(5);

      // Step 5: EVM Blockchain Anchoring
      addLog("Dispatching cryptographic commitments to the EVM blockchain...");
      const anchored = await anchorBlockchain(newCase.id);
      addLog(`Anchored: Block #${anchored.anchorRecord.blockNumber} (Tx: ${anchored.anchorRecord.transactionHash})`);

      setCurrentStep(6);
      addLog("Investigation pipeline completed successfully! Opening case intelligence dossier...");

      setTimeout(() => {
        onNavigate("case-detail", newCase.id);
      }, 1200);
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      setErrorMsg(err.message || "Pipeline encountered a critical error");
      setPipelineActive(false);
    }
  };

  const addLog = (msg: string) => {
    setStepLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <div id="new-investigation-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-emerald-500"></div>
          Ingest & Anchor Forensic Evidence
        </h1>
        <p className="text-xs text-white/40 mt-1">
          Initiate a verifiable forensic inquiry. Detect faces, discover candidate sources, and anchor cryptographic fingerprints.
        </p>
      </div>

      {/* Main Container */}
      {!file ? (
        /* Dropzone View */
        <div
          id="evidence-dropzone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 backdrop-blur-md ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center mx-auto backdrop-blur-sm">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Drag & drop forensic evidence image
              </h3>
              <p className="text-xs text-white/40">
                Supports high-resolution PNG, JPG, and WEBP files up to 20MB.
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors backdrop-blur-sm"
            >
              Browse Local Files
            </button>

            <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] font-mono text-white/40">
              <span>✓ Instant SHA-256</span>
              <span>✓ Quarantined Ingestion</span>
              <span>✓ Zero Biometrics On-Chain</span>
            </div>
          </div>
        </div>
      ) : (
        /* File Pre-flight & Pipeline Execution */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md">
            {/* Image Preview */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                Evidence Raster Preview
              </span>
              <div className="w-full h-56 rounded bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preflight"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <button
                disabled={pipelineActive}
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setBase64Data(null);
                }}
                className="text-xs font-mono text-white/40 hover:text-rose-400 transition-colors"
              >
                ← Choose a different file
              </button>
            </div>

            {/* Pre-flight Technical Details */}
            <div className="md:col-span-2 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Cryptographic Pre-Flight Check
              </span>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                  Investigation Title
                </label>
                <input
                  type="text"
                  value={caseTitle}
                  disabled={pipelineActive}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20 font-mono backdrop-blur-sm"
                />
              </div>

              {/* Technical Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-sm bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <span className="text-white/40 block text-[10px]">FILENAME</span>
                  <span className="text-white/90 truncate block">{file.name}</span>
                </div>
                <div className="p-3 rounded-sm bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <span className="text-white/40 block text-[10px]">FILE SIZE</span>
                  <span className="text-white/90">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Instant SHA-256 Card */}
              <div className="p-3 rounded bg-black/60 border border-white/10 font-mono">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 uppercase">
                    <Hash className="w-3.5 h-3.5" />
                    Instant Cryptographic SHA-256:
                  </span>
                  <button
                    onClick={copyHashToClipboard}
                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-xs text-emerald-400 break-all bg-black/40 p-2 rounded-sm border border-white/5 select-all">
                  {preflightHash || "Computing digest..."}
                </div>
              </div>

              {/* Launch Action */}
              {!pipelineActive && currentStep === 0 && (
                <div className="pt-2">
                  <button
                    id="btn-run-pipeline"
                    onClick={runFullPipeline}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Full Forensic Pipeline & Anchor to Blockchain</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Tracker */}
          {(pipelineActive || currentStep > 0) && (
            <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-400 animate-spin" />
                  Forensic Pipeline Execution
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  Step {Math.min(5, currentStep)} of 5
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {pipelineSteps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep > stepNum;
                  const isCurrent = currentStep === stepNum;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.label}
                      className={`p-2.5 rounded-sm border text-xs font-mono transition-all ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : isCurrent
                          ? "bg-white/10 border-emerald-400 text-white"
                          : "bg-white/[0.02] border-white/5 text-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-3.5 h-3.5" />
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        ) : null}
                      </div>
                      <div className="line-clamp-1 font-semibold text-[11px]">{step.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Real-time Execution Logs */}
              <div className="p-4 rounded bg-black/70 border border-white/10 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto backdrop-blur-sm">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                  Console Audit Logs
                </div>
                {stepLogs.map((log, idx) => (
                  <div key={idx} className="text-white/80">
                    <span className="text-emerald-400">❯</span> {log}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
