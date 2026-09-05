import React from "react";
import { Lock, ShieldCheck, EyeOff, KeyRound, Server, FileLock } from "lucide-react";

export const PrivacySecurityView: React.FC = () => {
  return (
    <div id="privacy-security-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-emerald-500"></div>
          Biometric Privacy & Cryptographic Security Architecture
        </h1>
        <p className="text-xs text-white/40 mt-1">
          Ethical engineering principles, GDPR/CCPA compliance safeguards, and cryptographic zero-knowledge commitments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Zero Raw Biometrics On-Chain</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Raw facial coordinates, high-dimensional vector embeddings, and personal identifiers are never stored on public blockchains. Only irreversible cryptographic hash commitments (SHA-256) of the canonical evidence manifest are anchored.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Cryptographic Commitments</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            By publishing a cryptographic commitment to a public blockchain, VeriTrace X establishes a mathematical guarantee that the evidence existed in that exact bitwise state at the verified block timestamp.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 text-white/80 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Server-Side Secret Quarantine</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            All AI vision analysis and reverse search API calls are routed strictly through backend microservices. Neither Gemini API keys, SerpApi keys, nor private blockchain signing credentials ever touch client browsers.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <FileLock className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">RFC 8785 Canonical Manifests</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Manifests adhere to RFC 8785 JSON Canonicalization Scheme (JCS). Key ordering and numeric formats are deterministically standardized so any third-party examiner can independently reproduce matching hash digests.
          </p>
        </div>
      </div>
    </div>
  );
};
