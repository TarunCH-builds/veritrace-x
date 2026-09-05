import React from "react";
import { CaseStatus, CorrelationLevel } from "../types.js";

interface StatusBadgeProps {
  status: CaseStatus | CorrelationLevel | string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const s = String(status).toLowerCase();
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  if (s.includes("verified") || s.includes("strong") || s.includes("confirmed") || s.includes("success")) {
    return (
      <span
        id={`badge-${s}`}
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm ${px}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {status}
      </span>
    );
  }

  if (s.includes("anchored")) {
    return (
      <span
        id={`badge-${s}`}
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm ${px}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {status}
      </span>
    );
  }

  if (s.includes("tampered") || s.includes("failed") || s.includes("failure")) {
    return (
      <span
        id={`badge-${s}`}
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 backdrop-blur-sm ${px}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        {status}
      </span>
    );
  }

  if (s.includes("moderate") || s.includes("processing") || s.includes("pending")) {
    return (
      <span
        id={`badge-${s}`}
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-sm ${px}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        {status}
      </span>
    );
  }

  return (
    <span
      id={`badge-${s}`}
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm bg-white/5 text-white/70 border border-white/10 backdrop-blur-sm ${px}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      {status}
    </span>
  );
};
