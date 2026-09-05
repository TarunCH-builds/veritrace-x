import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Activity,
  Terminal,
  Layers
} from "lucide-react";
import { fetchSystemHealth, resetDemoDb } from "../lib/api.js";
import { SystemHealthStatus } from "../types.js";

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCommandPalette,
  onNavigate,
  activeView
}) => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchSystemHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  const handleResetDemo = async () => {
    if (confirm("Reset forensic evidence database to verified demo baseline?")) {
      setResetting(true);
      try {
        await resetDemoDb();
        window.location.reload();
      } catch (err) {
        alert("Failed to reset database");
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header
      id="veritrace-topbar"
      className="sticky top-0 z-40 h-14 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between"
    >
      {/* Brand / Title */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-black font-bold text-lg shadow-[0_0_12px_rgba(16,185,129,0.35)] group-hover:bg-emerald-400 transition-all">
            V
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest uppercase">
                VERITRACE
              </span>
              <span className="text-xs font-mono text-white font-extrabold tracking-widest">
                X
              </span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">
              Evidence Intelligence
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-xs font-mono text-white/40">FORENSIC SUITE</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-tighter">
            System Operational
          </span>
        </div>
      </div>

      {/* Center Search / Command Palette trigger */}
      <button
        id="cmd-palette-trigger"
        onClick={onOpenCommandPalette}
        className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-sm bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 hover:bg-white/10 transition-colors w-64 md:w-80 justify-between backdrop-blur-md"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-white/40" />
          <span className="truncate">Search cases, hashes, commands...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono text-white/60">
          ⌘K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        <button
          id="btn-reset-demo"
          onClick={handleResetDemo}
          disabled={resetting}
          title="Reset database to verified baseline"
          className="p-1.5 text-white/40 hover:text-white rounded border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-emerald-400" : ""}`} />
        </button>

        <button
          id="btn-verify-topbar"
          onClick={() => onNavigate("verify")}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-xs font-mono text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors backdrop-blur-sm"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verify Evidence</span>
        </button>

        <button
          id="btn-new-case-topbar"
          onClick={() => onNavigate("new")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-sm transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] tracking-wide"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="uppercase tracking-wider">New Investigation</span>
        </button>
      </div>
    </header>
  );
};
