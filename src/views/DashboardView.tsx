import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
  Activity,
  Blocks,
  Globe,
  Fingerprint,
  RefreshCw,
  Trash2,
  GitGraph,
  Archive
} from "lucide-react";
import { fetchMetrics, fetchCases, deleteCase } from "../lib/api.js";
import { DashboardMetrics, ForensicCase } from "../types.js";
import { StatusBadge } from "../components/StatusBadge.js";

interface DashboardViewProps {
  onNavigate: (view: string, caseId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([fetchMetrics(), fetchCases()]);
      setMetrics(m);
      setCases(c);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`Delete case ${id}?`)) {
      try {
        await deleteCase(id);
        loadData();
      } catch (err) {
        alert("Failed to delete case");
      }
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.metadata.sha256.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Command Banner */}
      <div className="relative rounded-lg bg-[#0d0d0d] border border-white/10 p-6 md:p-8 overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
            backgroundSize: "24px 24px"
          }}
        />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold tracking-tight uppercase">Hacker House Goa — Task #3: Face ID + Blockchain</span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            From image to <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">verifiable evidence</span>.
          </h1>

          <p className="text-xs md:text-sm text-white/60 leading-relaxed max-w-2xl">
            Detect visual signals, discover genuine real-world online sources, correlate evidence, and
            anchor cryptographic fingerprints to the blockchain for independent, tamper-evident verification.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-btn-new"
              onClick={() => onNavigate("new")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Start Investigation</span>
            </button>

            <button
              id="hero-btn-verify"
              onClick={() => onNavigate("verify")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Evidence Integrity</span>
            </button>

            <button
              id="hero-btn-network"
              onClick={() => onNavigate("network")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <GitGraph className="w-3.5 h-3.5 text-cyan-400" />
              <span>Correlation Graph</span>
            </button>

            <button
              id="hero-btn-reports"
              onClick={() => onNavigate("reports")}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reports Vault</span>
            </button>

            <button
              id="hero-btn-refresh"
              onClick={loadData}
              className="p-2 rounded-sm bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition-all backdrop-blur-sm"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <MetricCard
          label="Active Inquiries"
          value={metrics?.activeInvestigations ?? 0}
          icon={Activity}
          accent="emerald"
        />
        <MetricCard
          label="Evidence Items"
          value={metrics?.evidenceItems ?? 0}
          icon={FileText}
          accent="neutral"
        />
        <MetricCard
          label="Discovered Sources"
          value={metrics?.sourcesDiscovered ?? 0}
          icon={Globe}
          accent="cyan"
        />
        <MetricCard
          label="Blockchain Anchors"
          value={metrics?.blockchainAnchors ?? 0}
          icon={Blocks}
          accent="purple"
        />
        <MetricCard
          label="Verified Records"
          value={metrics?.verifiedRecords ?? 0}
          icon={ShieldCheck}
          accent="emerald"
        />
        <MetricCard
          label="Integrity Alerts"
          value={metrics?.integrityFailures ?? 0}
          icon={ShieldAlert}
          accent="rose"
        />
      </div>

      {/* Core Evidence Pipeline Architecture Banner */}
      <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
          Pipeline Sequence:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 text-white/70">
          <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            DETECT
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            ENCODE
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/80 text-[11px]">
            DISCOVER
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/80 text-[11px]">
            CORRELATE
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-white/80 text-[11px]">
            ANCHOR
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            VERIFY
          </span>
        </div>
        <span className="text-white/30 text-[10px] uppercase tracking-wider">Autonomous Cryptographic Flow</span>
      </div>

      {/* Recent Investigations List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <div className="w-1 h-3 bg-emerald-500"></div>
              Recent Forensic Investigations
            </h2>
            <p className="text-[11px] text-white/40 mt-1">Active records registered in the cryptographic ledger.</p>
          </div>

          {/* Filter / Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Filter cases or SHA-256..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-sm pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 font-mono backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Cases Table / Cards */}
        {filteredCases.length === 0 ? (
          <div className="p-12 rounded-lg bg-white/[0.02] border border-white/5 text-center space-y-3 backdrop-blur-md">
            <FileText className="w-8 h-8 text-white/20 mx-auto" />
            <p className="text-xs text-white/40">No matching forensic cases found.</p>
            <button
              onClick={() => onNavigate("new")}
              className="px-4 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider"
            >
              Start New Investigation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((c) => (
              <CaseCard
                key={c.id}
                forensicCase={c}
                onClick={() => onNavigate("case-detail", c.id)}
                onDelete={(e) => handleDelete(e, c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: "emerald" | "cyan" | "purple" | "rose" | "neutral";
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, accent }) => {
  const accentColors = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    neutral: "text-white/60 bg-white/5 border-white/10"
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-md transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider line-clamp-1">
          {label}
        </span>
        <div className={`p-1.5 rounded-sm border ${accentColors[accent]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-3 flex justify-between items-end">
        <span className="text-2xl font-light font-mono text-white tracking-tight">{value}</span>
        <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-tighter">Live metrics</span>
      </div>
    </div>
  );
};

interface CaseCardProps {
  forensicCase: ForensicCase;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ forensicCase, onClick, onDelete }) => {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 p-4 cursor-pointer backdrop-blur-md transition-all duration-200 flex flex-col justify-between space-y-4"
    >
      <div className="flex items-start gap-3">
        {/* Evidence Thumbnail */}
        <div className="w-16 h-16 rounded bg-[#0a0a0a] border border-white/10 overflow-hidden shrink-0">
          <img
            src={forensicCase.evidenceFile.url}
            alt={forensicCase.id}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">{forensicCase.id}</span>
            <StatusBadge status={forensicCase.status} size="sm" />
          </div>
          <h3 className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
            {forensicCase.title}
          </h3>
          <p className="text-[11px] font-mono text-white/40 truncate">
            SHA: {forensicCase.metadata.sha256.slice(0, 16)}...
          </p>
        </div>
      </div>

      {/* Forensic Signal Badges */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-white/50">
        <div className="flex items-center gap-1.5">
          <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            {forensicCase.faceData?.facesDetected
              ? `${forensicCase.faceData.facesDetected} Subject(s)`
              : "No Face"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">
            {forensicCase.searchResults?.length
              ? `${forensicCase.searchResults.length} Discovered`
              : "0 Sources"}
          </span>
        </div>
      </div>

      {/* Bottom info & actions */}
      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 border-t border-white/5">
        <span>{new Date(forensicCase.createdAt).toLocaleDateString()}</span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            title="Delete case"
            className="p-1 hover:text-rose-400 rounded transition-colors text-white/30 hover:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold uppercase tracking-wider text-[9px]">
            Inspect <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
