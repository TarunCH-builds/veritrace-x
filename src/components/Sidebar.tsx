import React from "react";
import {
  LayoutDashboard,
  PlusCircle,
  FolderLock,
  ShieldAlert,
  FlaskConical,
  Blocks,
  FileCheck2,
  Lock,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitGraph
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapse
}) => {
  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard, category: "INVESTIGATE" },
    { id: "new", label: "New Investigation", icon: PlusCircle, category: "INVESTIGATE" },
    { id: "vault", label: "Evidence Vault", icon: FolderLock, category: "INVESTIGATE" },
    { id: "reports", label: "Reports Archive", icon: FileCheck2, category: "INVESTIGATE" },
    { id: "network", label: "Correlation Network", icon: GitGraph, category: "INVESTIGATE" },
    { id: "verify", label: "Verify & Tamper Lab", icon: ShieldAlert, category: "VERIFY" },
    { id: "lab", label: "Forensic Workbench", icon: FlaskConical, category: "VERIFY" },
    { id: "ledger", label: "Blockchain Ledger", icon: Blocks, category: "BLOCKCHAIN" },
    { id: "privacy", label: "Privacy & Ethics", icon: Lock, category: "SYSTEM" },
    { id: "health", label: "System Diagnostics", icon: Activity, category: "SYSTEM" },
    { id: "settings", label: "Settings & RPC", icon: Settings, category: "SYSTEM" }
  ];

  const categories = ["INVESTIGATE", "VERIFY", "BLOCKCHAIN", "SYSTEM"];

  return (
    <aside
      id="veritrace-sidebar"
      className={`fixed left-0 top-14 bottom-0 z-30 bg-black/40 backdrop-blur-xl border-r border-white/5 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="py-4 px-3 space-y-6 overflow-y-auto">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-mono tracking-widest text-white/40 uppercase font-bold mb-2 flex items-center gap-1.5">
                  <div className="w-1 h-2 bg-emerald-500/60 rounded-full"></div>
                  <span>{cat}</span>
                </div>
              )}

              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.12)] backdrop-blur-sm"
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-white/40"}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer / Toggle & Operator Profile */}
      <div className="p-3 border-t border-white/5 bg-black/20 space-y-2 backdrop-blur-sm">
        <button
          id="btn-sidebar-collapse"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-sm text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {!collapsed && (
          <div className="p-2.5 rounded bg-white/[0.03] border border-white/10 text-[11px] font-mono text-white/60">
            <div className="flex items-center justify-between text-white/80">
              <span className="font-bold text-white tracking-wider text-[10px] uppercase">OPERATOR</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                AUTH
              </span>
            </div>
            <p className="truncate text-white/50 mt-1">Lead Forensic Special Agent</p>
            <p className="text-[10px] text-white/30">Node: #VT-GOA-03</p>
          </div>
        )}
      </div>
    </aside>
  );
};
