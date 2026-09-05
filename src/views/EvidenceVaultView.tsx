import React, { useState, useEffect } from "react";
import {
  FolderLock,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  ShieldCheck,
  Globe
} from "lucide-react";
import { fetchCases, deleteCase } from "../lib/api.js";
import { ForensicCase } from "../types.js";
import { StatusBadge } from "../components/StatusBadge.js";

interface EvidenceVaultViewProps {
  onNavigate: (view: string, caseId?: string) => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCases(search, statusFilter);
      setCases(data);
    } catch (err) {
      console.error("Failed to load vault cases", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`Permanently remove forensic inquiry ${id}?`)) {
      try {
        await deleteCase(id);
        loadData();
      } catch {
        alert("Failed to delete case");
      }
    }
  };

  return (
    <div id="evidence-vault-view" className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2.5">
            <div className="w-1.5 h-4 bg-emerald-500"></div>
            Forensic Evidence Vault
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Searchable repository of all verified forensic inquiries, cryptographic commitments, and source discoveries.
          </p>
        </div>

        <button
          onClick={() => onNavigate("new")}
          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by Case ID, Title, or SHA-256..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-white/20 backdrop-blur-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-white/20 backdrop-blur-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="ingested">Ingested</option>
            <option value="processing">Processing</option>
            <option value="analyzed">Analyzed</option>
            <option value="anchored">Anchored</option>
            <option value="verified">Verified</option>
            <option value="tampered">Tampered</option>
          </select>
        </div>
      </div>

      {/* Table of Cases */}
      <div className="rounded-lg bg-white/[0.03] border border-white/10 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-white/5 border-b border-white/10 text-white/50 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-3.5 font-semibold">CASE / TITLE</th>
              <th className="p-3.5 font-semibold">STATUS</th>
              <th className="p-3.5 font-semibold hidden md:table-cell">SHA-256 HASH</th>
              <th className="p-3.5 font-semibold hidden sm:table-cell">BIOMETRICS</th>
              <th className="p-3.5 font-semibold hidden lg:table-cell">SOURCES</th>
              <th className="p-3.5 font-semibold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-white/40">
                  No cases found matching your search criteria.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onNavigate("case-detail", c.id)}
                  className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-black/60 border border-white/10 overflow-hidden shrink-0">
                        <img
                          src={c.evidenceFile.url}
                          alt={c.id}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-emerald-400">{c.id}</div>
                        <div className="text-white truncate max-w-xs">{c.title}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <StatusBadge status={c.status} size="sm" />
                  </td>

                  <td className="p-3.5 hidden md:table-cell text-white/40 truncate max-w-[180px]">
                    {c.metadata.sha256.slice(0, 16)}...
                  </td>

                  <td className="p-3.5 hidden sm:table-cell text-white/70">
                    {c.faceData?.facesDetected ? (
                      <span className="text-emerald-400">{c.faceData.facesDetected} Subject(s)</span>
                    ) : (
                      <span className="text-white/30">None</span>
                    )}
                  </td>

                  <td className="p-3.5 hidden lg:table-cell text-white/70">
                    {c.searchResults?.length ? `${c.searchResults.length} Discovered` : "0 Sources"}
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        className="p-1.5 text-white/40 hover:text-rose-400 rounded transition-colors"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-emerald-400 hover:text-emerald-300 p-1">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
