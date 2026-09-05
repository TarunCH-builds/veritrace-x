import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Terminal } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    "Vision Forensics & Facial Landmark Engine",
    "Tamper-Evident Evidence Ingestion Pipeline",
    "External Reverse Search Connector Gateway",
    "Evidence Correlation & Canonical Manifest Kernel",
    "EVM Blockchain Anchor & Consensus Node"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-200">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo Badge */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto shadow-2xl shadow-emerald-500/20">
          <ShieldCheck className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">VERITRACE</h1>
            <span className="text-emerald-400 font-black text-2xl">X</span>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mt-1">
            Evidence you can verify.
          </p>
        </div>

        {/* Boot checklist */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-left space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              SYSTEM INITIALIZING
            </span>
            <span className="text-emerald-400 font-semibold">v2.4.0</span>
          </div>

          {steps.map((s, idx) => {
            const isDone = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={s}
                className={`flex items-center justify-between transition-colors ${
                  isDone
                    ? "text-neutral-200"
                    : isCurrent
                    ? "text-emerald-400 font-semibold"
                    : "text-neutral-600"
                }`}
              >
                <span className="truncate pr-2">{s}</span>
                <span className="shrink-0 font-bold">
                  {isDone ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> READY
                    </span>
                  ) : isCurrent ? (
                    <span className="text-emerald-400 animate-pulse">INIT...</span>
                  ) : (
                    "PENDING"
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skip button */}
        <button
          onClick={onComplete}
          className="text-xs font-mono text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
        >
          Skip initialization sequence →
        </button>
      </div>
    </div>
  );
};
