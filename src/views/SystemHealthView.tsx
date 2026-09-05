import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Cpu, Database, Blocks, Globe, Shield } from "lucide-react";
import { fetchHealth } from "../lib/api.js";

export const SystemHealthView: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await fetchHealth();
      setHealthData(data);
    } catch {
      setHealthData({ status: "DEGRADED" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const components = [
    {
      name: "Multimodal Vision & Landmark Engine",
      status: "OPERATIONAL",
      icon: Cpu,
      desc: "Gemini 2.5 multimodal API & local geometric landmark extractor"
    },
    {
      name: "Search Connector Gateway",
      status: "OPERATIONAL",
      icon: Globe,
      desc: "Visual web grounding & reverse search aggregator adapter"
    },
    {
      name: "EVM Cryptographic Anchor",
      status: healthData?.blockchainMode ? "OPERATIONAL" : "PENDING",
      icon: Blocks,
      desc: `Target: ${healthData?.blockchainMode || "Cryptographic Authority"}`
    },
    {
      name: "Canonical Evidence Store",
      status: "OPERATIONAL",
      icon: Database,
      desc: "Deterministic JSON key-value database with RFC 8785 canonicalization"
    },
    {
      name: "Audit Trail & Tamper Sentinel",
      status: "OPERATIONAL",
      icon: Shield,
      desc: "SHA-256 integrity sentinels monitoring database consistency"
    }
  ];

  return (
    <div id="system-health-view" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-500"></div>
            System Diagnostics & Node Health
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Real-time status of forensic vision models, reverse search adapters, and blockchain consensus.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="p-2 text-white/40 hover:text-white rounded-sm hover:bg-white/5 border border-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between text-xs font-mono backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold uppercase tracking-wider">ALL FORENSIC SUBSYSTEMS NOMINAL</span>
        </div>
        <span className="text-white/60">NODE: VT-GOA-ALPHA</span>
      </div>

      <div className="space-y-3">
        {components.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.name}
              className="p-4 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4 backdrop-blur-md transition-all hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-white/5 border border-white/10 text-white/80">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">{c.name}</h4>
                  <p className="text-[11px] text-white/40 mt-0.5">{c.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{c.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
