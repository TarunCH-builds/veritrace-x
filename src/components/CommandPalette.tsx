import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  FolderLock,
  ShieldCheck,
  FlaskConical,
  Blocks,
  Activity,
  Settings,
  X,
  ArrowRight,
  GitGraph,
  Archive
} from "lucide-react";
import { fetchCases } from "../lib/api.js";
import { ForensicCase } from "../types.js";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, caseId?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<ForensicCase[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCases().then(setCases).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCases = cases.filter(
    (c) =>
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.metadata.sha256.toLowerCase().includes(query.toLowerCase())
  );

  const quickActions = [
    { label: "New Evidence Investigation", icon: PlusCircle, view: "new" },
    { label: "Evidence Reports Archive & Vault", icon: Archive, view: "reports" },
    { label: "Correlation Graph Network", icon: GitGraph, view: "network" },
    { label: "Verify File Integrity", icon: ShieldCheck, view: "verify" },
    { label: "Forensic Hash & Comparison Lab", icon: FlaskConical, view: "lab" },
    { label: "EVM Blockchain Ledger", icon: Blocks, view: "ledger" },
    { label: "System Health Diagnostics", icon: Activity, view: "health" },
    { label: "Settings & API Keys", icon: Settings, view: "settings" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="command-palette-modal"
        className="w-full max-w-xl rounded-lg bg-black/80 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden text-white"
      >
        <div className="relative flex items-center px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-4 h-4 text-emerald-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a case ID, SHA-256 hash, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-xs placeholder-white/30 focus:outline-none text-white font-mono"
          />
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white rounded-sm hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-4 text-xs font-mono">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              Commands
            </div>
            <div className="space-y-0.5">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.view}
                    onClick={() => {
                      onNavigate(act.view);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-sm hover:bg-white/5 text-white/70 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span>{act.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cases Search Results */}
          {filteredCases.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                Forensic Cases ({filteredCases.length})
              </div>
              <div className="space-y-0.5">
                {filteredCases.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate("case-detail", c.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-sm hover:bg-white/5 text-white/70 hover:text-white transition-colors text-left"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-400">{c.id}</span>
                        <span className="text-white truncate">{c.title}</span>
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        SHA-256: {c.metadata.sha256}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/30 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <span>Navigation: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">ESC</kbd> to exit</span>
          <span className="text-emerald-400 font-bold uppercase tracking-wider">VeriTrace X Core Command</span>
        </div>
      </div>
    </div>
  );
};
