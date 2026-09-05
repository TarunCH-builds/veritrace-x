import React, { useState } from "react";
import { Settings, Shield, RefreshCw, Key, Database, Server } from "lucide-react";
import { seedDemoData } from "../lib/api.js";

interface SettingsViewProps {
  onResetComplete: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetComplete }) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (confirm("Reset and re-seed the cryptographic database with canonical demo forensic cases?")) {
      setResetting(true);
      try {
        await seedDemoData();
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          onResetComplete();
        }, 1200);
      } catch {
        alert("Failed to re-seed database.");
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
          <div className="w-1.5 h-4 bg-emerald-500"></div>
          Settings & Forensic Node Configuration
        </h1>
        <p className="text-xs text-white/40 mt-1">
          EVM blockchain endpoints, model parameters, and database management.
        </p>
      </div>

      <div className="space-y-6">
        {/* Node Information */}
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Blockchain RPC & Network Endpoints
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">NETWORK NAME</span>
              <span className="text-white">Sepolia Testnet / Local VeriTrace Authority</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">VERITRACE CONTRACT TARGET</span>
              <span className="text-emerald-400 select-all">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase tracking-wider">TRANSACTION CONFIRMATIONS REQUIRED</span>
              <span className="text-white/80">1 (Instant Finality)</span>
            </div>
          </div>
        </div>

        {/* Database Management & Seed */}
        <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Database & Canonical Seed Data
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Re-seed the evidence store with sample investigations, facial landmarks, reverse search results, and verified on-chain blocks.
          </p>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-emerald-400" : ""}`} />
            <span>{resetting ? "Seeding Canonical Cases..." : "Re-Seed Canonical Forensic Cases"}</span>
          </button>

          {resetSuccess && (
            <p className="text-xs text-emerald-400 font-mono">
              ✓ Database re-seeded successfully! Refreshing view...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
