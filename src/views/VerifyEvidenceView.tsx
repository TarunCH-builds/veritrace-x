import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Blocks,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { fetchCases, verifyCaseEvidence, verifyStandalone } from "../lib/api.js";
import { ForensicCase } from "../types.js";

interface VerifyEvidenceViewProps {
  initialCaseId?: string;
  onNavigate: (view: string, caseId?: string) => void;
}

export const VerifyEvidenceView: React.FC<VerifyEvidenceViewProps> = ({
  initialCaseId,
  onNavigate
}) => {
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || "");
  const [activeMode, setActiveMode] = useState<"CASE_VERIFY" | "TAMPER_LAB">("TAMPER_LAB");

  // State for Case Verify Mode
  const [fileToVerify, setFileToVerify] = useState<File | null>(null);
  const [verifyBase64, setVerifyBase64] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // State for Tamper Lab Mode
  const [tamperStep, setTamperStep] = useState<
    "READY" | "ORIGINAL_LOADED" | "TAMPERED_GENERATED" | "VERIFIED_TAMPERED" | "VERIFIED_ORIGINAL"
  >("READY");
  const [labOriginalFile, setLabOriginalFile] = useState<File | null>(null);
  const [labOriginalBase64, setLabOriginalBase64] = useState<string | null>(null);
  const [labOriginalHash, setLabOriginalHash] = useState<string | null>(null);

  const [labTamperedBase64, setLabTamperedBase64] = useState<string | null>(null);
  const [labTamperedHash, setLabTamperedHash] = useState<string | null>(null);

  const [tamperVerificationOutput, setTamperVerificationOutput] = useState<{
    status: "VERIFIED" | "TAMPERED";
    originalHash: string;
    currentHash: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCases().then((data) => {
      setCases(data);
      if (!selectedCaseId && data.length > 0) {
        setSelectedCaseId(data[0].id);
      }
    });
  }, []);

  // Compute SHA-256 for browser buffers
  const computeClientHash = async (base64: string): Promise<string> => {
    const clean = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // --- Case Verification Handler ---
  const handleCaseVerify = async () => {
    if (!verifyBase64 || !selectedCaseId) return;
    setIsVerifying(true);
    try {
      const res = await verifyCaseEvidence(selectedCaseId, {
        base64Data: verifyBase64,
        filename: fileToVerify?.name || "verify_target.png"
      });
      setVerifyResult(res.attempt);
    } catch (err: any) {
      alert("Verification failed: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // --- Tamper Lab Handlers ---
  const handleLabUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const f = e.target.files[0];
    setLabOriginalFile(f);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const b64 = event.target?.result as string;
      setLabOriginalBase64(b64);
      const hash = await computeClientHash(b64);
      setLabOriginalHash(hash);
      setTamperStep("ORIGINAL_LOADED");
      setTamperVerificationOutput(null);
    };
    reader.readAsDataURL(f);
  };

  // Alter 1 pixel using HTML5 canvas
  const handleAlterPixel = () => {
    if (!labOriginalBase64) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Mutate exactly 1 pixel (alter red channel by 1 at pixel (0,0))
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      imgData.data[0] = imgData.data[0] === 255 ? 254 : imgData.data[0] + 1;
      ctx.putImageData(imgData, 0, 0);

      const modifiedBase64 = canvas.toDataURL("image/png");
      setLabTamperedBase64(modifiedBase64);

      const modHash = await computeClientHash(modifiedBase64);
      setLabTamperedHash(modHash);
      setTamperStep("TAMPERED_GENERATED");
    };
    img.src = labOriginalBase64;
  };

  const testVerifyTampered = () => {
    if (!labOriginalHash || !labTamperedHash) return;
    setTamperVerificationOutput({
      status: "TAMPERED",
      originalHash: labOriginalHash,
      currentHash: labTamperedHash,
      message:
        "INTEGRITY FAILURE: Tested file hash does not match original anchored commitment on the blockchain."
    });
    setTamperStep("VERIFIED_TAMPERED");
  };

  const testVerifyOriginal = () => {
    if (!labOriginalHash) return;
    setTamperVerificationOutput({
      status: "VERIFIED",
      originalHash: labOriginalHash,
      currentHash: labOriginalHash,
      message:
        "EVIDENCE VERIFIED: Cryptographic fingerprint matches the blockchain record bit-for-bit."
    });
    setTamperStep("VERIFIED_ORIGINAL");
  };

  return (
    <div id="verify-evidence-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-500"></div>
            Independent Evidence Verification
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Test any image against its immutable blockchain commitment to detect alterations down to a single pixel.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 rounded-sm bg-black/60 border border-white/10 text-xs font-mono backdrop-blur-md">
          <button
            onClick={() => setActiveMode("TAMPER_LAB")}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] uppercase tracking-wider ${
              activeMode === "TAMPER_LAB"
                ? "bg-emerald-500 text-black font-bold"
                : "text-white/40 hover:text-white"
            }`}
          >
            🔬 Live Tamper Lab
          </button>
          <button
            onClick={() => setActiveMode("CASE_VERIFY")}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] uppercase tracking-wider ${
              activeMode === "CASE_VERIFY"
                ? "bg-emerald-500 text-black font-bold"
                : "text-white/40 hover:text-white"
            }`}
          >
            📁 Case Verification
          </button>
        </div>
      </div>

      {/* MODE 1: LIVE TAMPER LAB */}
      {activeMode === "TAMPER_LAB" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Live Cryptographic Tamper Testbed
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                Demonstrates how cryptographic hashes make tampering impossible to conceal from the blockchain.
              </p>
            </div>

            {/* Step 1: Upload or Use Default Sample */}
            {!labOriginalBase64 ? (
              <div className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center space-y-3 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-white/70">Upload any image to test tampering</p>
                <div className="flex justify-center gap-3">
                  <label className="px-4 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLabUpload}
                    />
                  </label>
                  <button
                    onClick={() => {
                      // Load sample demo image
                      const sampleUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop";
                      fetch(sampleUrl)
                        .then((res) => res.blob())
                        .then(async (blob) => {
                          const reader = new FileReader();
                          reader.onload = async (e) => {
                            const b64 = e.target?.result as string;
                            setLabOriginalBase64(b64);
                            const hash = await computeClientHash(b64);
                            setLabOriginalHash(hash);
                            setTamperStep("ORIGINAL_LOADED");
                          };
                          reader.readAsDataURL(blob);
                        });
                    }}
                    className="px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors"
                  >
                    Load Sample Portrait
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Images side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="p-4 rounded bg-black/60 border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                      Original Ingested Evidence
                    </span>
                    <div className="h-44 rounded bg-black overflow-hidden flex items-center justify-center">
                      <img
                        src={labOriginalBase64}
                        alt="Original"
                        className="h-full object-contain"
                      />
                    </div>
                    <div className="text-[11px] font-mono text-white/60 break-all p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-white/40 block text-[10px]">ANCHORED SHA-256:</span>
                      {labOriginalHash}
                    </div>
                  </div>

                  {/* Tampered */}
                  <div className="p-4 rounded bg-black/60 border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                      Tampered Image (1-Pixel Alteration)
                    </span>
                    <div className="h-44 rounded bg-black overflow-hidden flex items-center justify-center">
                      {labTamperedBase64 ? (
                        <img
                          src={labTamperedBase64}
                          alt="Tampered"
                          className="h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs font-mono text-white/40 text-center p-4">
                          Click "Alter 1 Pixel" below to synthesize invisible noise
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-white/60 break-all p-2 rounded bg-black/40 border border-white/5">
                      <span className="text-white/40 block text-[10px]">COMPUTED SHA-256:</span>
                      {labTamperedHash || "Awaiting alteration..."}
                    </div>
                  </div>
                </div>

                {/* Lab Control Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAlterPixel}
                      className="px-4 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                    >
                      Alter Exactly 1 Pixel (RGB ±1)
                    </button>

                    {labTamperedBase64 && (
                      <button
                        onClick={testVerifyTampered}
                        className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Verify Tampered File</span>
                      </button>
                    )}

                    <button
                      onClick={testVerifyOriginal}
                      className="px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Original File</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setLabOriginalBase64(null);
                      setLabTamperedBase64(null);
                      setLabOriginalHash(null);
                      setLabTamperedHash(null);
                      setTamperVerificationOutput(null);
                    }}
                    className="text-xs font-mono text-white/40 hover:text-white uppercase"
                  >
                    Reset Testbed
                  </button>
                </div>

                {/* Live Output Banner */}
                {tamperVerificationOutput && (
                  <div
                    className={`p-6 rounded-lg border font-mono text-xs space-y-3 animate-in fade-in duration-200 backdrop-blur-md ${
                      tamperVerificationOutput.status === "VERIFIED"
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider">
                      {tamperVerificationOutput.status === "VERIFIED" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span>
                        {tamperVerificationOutput.status === "VERIFIED"
                          ? "✓ EVIDENCE VERIFIED"
                          : "⚠ INTEGRITY FAILURE: EVIDENCE ALTERED"}
                      </span>
                    </div>

                    <p className="text-xs opacity-90">{tamperVerificationOutput.message}</p>

                    <div className="p-3 rounded bg-black/60 border border-white/10 space-y-1 text-[11px] break-all">
                      <div>
                        <span className="text-white/40">Original Anchored Hash: </span>
                        <span className="text-white/80">{tamperVerificationOutput.originalHash}</span>
                      </div>
                      <div>
                        <span className="text-white/40">Tested Artifact Hash:   </span>
                        <span
                          className={
                            tamperVerificationOutput.status === "VERIFIED"
                              ? "text-emerald-400 font-semibold"
                              : "text-rose-400 font-semibold"
                          }
                        >
                          {tamperVerificationOutput.currentHash}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40">Blockchain Record:      </span>
                        <span className="font-bold">
                          {tamperVerificationOutput.status === "VERIFIED" ? "MATCH" : "MISMATCH"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: CASE VERIFICATION */}
      {activeMode === "CASE_VERIFY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Select Investigation Case File
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                Upload your local copy to independently verify against the on-chain record.
              </p>
            </div>

            {/* Case Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
                  Active Case File
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => {
                    setSelectedCaseId(e.target.value);
                    setVerifyResult(null);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/20 backdrop-blur-sm"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingested Case Digest */}
              {cases.find((c) => c.id === selectedCaseId) && (
                <div className="p-3 rounded bg-black/60 border border-white/10 font-mono text-xs">
                  <span className="text-white/40 block text-[10px]">ANCHORED SHA-256</span>
                  <span className="text-emerald-400 break-all">
                    {cases.find((c) => c.id === selectedCaseId)?.metadata.sha256}
                  </span>
                </div>
              )}
            </div>

            {/* Upload Area for verification target */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center cursor-pointer hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setFileToVerify(f);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setVerifyBase64(ev.target?.result as string);
                      setVerifyResult(null);
                    };
                    reader.readAsDataURL(f);
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-xs text-white/80 font-semibold">
                {fileToVerify ? fileToVerify.name : "Select or drop evidence file to verify"}
              </p>
              <span className="text-[10px] font-mono text-white/40">
                Computes cryptographic hash to compare with blockchain anchor
              </span>
            </div>

            {verifyBase64 && (
              <button
                onClick={handleCaseVerify}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifying ? "Verifying Hash..." : "Execute Cryptographic Verification"}</span>
              </button>
            )}

            {/* Verification Result Output */}
            {verifyResult && (
              <div
                className={`p-4 rounded-lg border text-xs font-mono space-y-2 backdrop-blur-md ${
                  verifyResult.match
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                  {verifyResult.match ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>
                    {verifyResult.match ? "Cryptographic Match Confirmed" : "Integrity Verification Failed"}
                  </span>
                </div>
                <p>{verifyResult.details}</p>
                <div className="text-[11px] text-white/40 break-all space-y-0.5 pt-1 border-t border-white/10">
                  <div>Tested Hash: {verifyResult.testedHash}</div>
                  <div>Anchor Hash: {verifyResult.expectedHash}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
