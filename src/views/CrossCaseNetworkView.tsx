import React, { useState, useEffect, useRef } from "react";
import {
  GitGraph,
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Share2,
  ScanFace,
  FileImage,
  Globe,
  Hash,
  Blocks,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Info,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Radar
} from "lucide-react";
import { fetchCases } from "../lib/api.js";
import { ForensicCase } from "../types.js";
import { CorrelationRadarGraph } from "../components/correlation/CorrelationRadarGraph.js";

interface CrossCaseNetworkViewProps {
  onNavigate: (view: string, caseId?: string) => void;
}

interface GraphCaseNode {
  id: string;
  caseId: string;
  label: string;
  thumbnailUrl?: string;
  status: string;
  sha256: string;
  pHash?: string;
  facesCount: number;
  sourcesCount: number;
  blockNumber?: number;
  x: number;
  y: number;
}

interface CrossCaseLink {
  id: string;
  source: string;
  target: string;
  type: "BIOMETRIC" | "PHASH_DERIVATIVE" | "SHARED_DOMAIN" | "BLOCK_NEIGHBOR";
  score: number; // 0 - 100
  label: string;
}

export const CrossCaseNetworkView: React.FC<CrossCaseNetworkViewProps> = ({ onNavigate }) => {
  const [cases, setCases] = useState<ForensicCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"GLOBAL_GRAPH" | "PAIRWISE_COMPARISON">("GLOBAL_GRAPH");

  // Filter & interaction state
  const [searchQuery, setSearchQuery] = useState("");
  const [minCorrelation, setMinCorrelation] = useState(50);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Pairwise selection
  const [selectedCaseA, setSelectedCaseA] = useState<string>("");
  const [selectedCaseB, setSelectedCaseB] = useState<string>("");

  // Canvas pan & zoom
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await fetchCases();
      setCases(data);
      if (data.length >= 2) {
        setSelectedCaseA(data[0].id);
        setSelectedCaseB(data[1].id);
      } else if (data.length === 1) {
        setSelectedCaseA(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch cases for network graph", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute pHash similarity (Hamming distance approximation)
  const computePHashSimilarity = (hashA?: string, hashB?: string): number => {
    if (!hashA || !hashB) return 0;
    if (hashA === hashB) return 100;
    let matchingChars = 0;
    const len = Math.min(hashA.length, hashB.length);
    for (let i = 0; i < len; i++) {
      if (hashA[i] === hashB[i]) matchingChars++;
    }
    return Math.round((matchingChars / len) * 100);
  };

  // Helper to compute shared domain score
  const computeSharedDomainScore = (caseA: ForensicCase, caseB: ForensicCase): { score: number; domain?: string } => {
    const domainsA = new Set(caseA.searchResults?.map((s) => s.domain).filter(Boolean));
    const domainsB = new Set(caseB.searchResults?.map((s) => s.domain).filter(Boolean));
    if (domainsA.size === 0 || domainsB.size === 0) return { score: 0 };

    for (const d of domainsA) {
      if (domainsB.has(d)) {
        return { score: 88, domain: d };
      }
    }
    return { score: 0 };
  };

  // Helper to compute facial similarity between two cases
  const computeFaceSimilarity = (caseA: ForensicCase, caseB: ForensicCase): number => {
    const hasA = caseA.faceData && caseA.faceData.facesDetected > 0;
    const hasB = caseB.faceData && caseB.faceData.facesDetected > 0;
    if (!hasA || !hasB) return 0;

    // Compare embedding fingerprints or confidence proximity
    if (
      caseA.faceData?.embeddingFingerprint &&
      caseA.faceData?.embeddingFingerprint === caseB.faceData?.embeddingFingerprint
    ) {
      return 98;
    }
    const diff = Math.abs((caseA.faceData?.confidence || 0) - (caseB.faceData?.confidence || 0));
    return Math.max(60, Math.round(92 - diff * 25));
  };

  // Build Graph Nodes positioned organically in a circular/grid arrangement
  const graphNodes: GraphCaseNode[] = cases.map((c, idx) => {
    const total = cases.length;
    const angle = (idx / Math.max(1, total)) * (Math.PI * 2);
    const radius = total > 4 ? 220 : 160;
    const centerX = 500;
    const centerY = 300;

    return {
      id: `node-${c.id}`,
      caseId: c.id,
      label: c.title,
      thumbnailUrl: c.evidenceFile.url,
      status: c.status,
      sha256: c.metadata.sha256,
      pHash: c.metadata.perceptualHash,
      facesCount: c.faceData?.facesDetected ?? 0,
      sourcesCount: c.searchResults?.length ?? 0,
      blockNumber: c.blockchainAnchor?.blockNumber,
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle))
    };
  });

  // Generate inter-case links based on biometric, pHash, shared domain, or blockchain relationships
  const graphLinks: CrossCaseLink[] = [];
  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      const caseA = cases[i];
      const caseB = cases[j];

      // 1. Biometric relationship
      const faceScore = computeFaceSimilarity(caseA, caseB);
      if (faceScore >= 70) {
        graphLinks.push({
          id: `link-face-${caseA.id}-${caseB.id}`,
          source: `node-${caseA.id}`,
          target: `node-${caseB.id}`,
          type: "BIOMETRIC",
          score: faceScore,
          label: `${faceScore}% Biometric Concordance`
        });
      }

      // 2. Perceptual Hash Derivative relationship
      const pHashScore = computePHashSimilarity(caseA.metadata.perceptualHash, caseB.metadata.perceptualHash);
      if (pHashScore >= 65) {
        graphLinks.push({
          id: `link-phash-${caseA.id}-${caseB.id}`,
          source: `node-${caseA.id}`,
          target: `node-${caseB.id}`,
          type: "PHASH_DERIVATIVE",
          score: pHashScore,
          label: `${pHashScore}% pHash Derivative Fit`
        });
      }

      // 3. Shared Domain
      const domainResult = computeSharedDomainScore(caseA, caseB);
      if (domainResult.score > 0) {
        graphLinks.push({
          id: `link-domain-${caseA.id}-${caseB.id}`,
          source: `node-${caseA.id}`,
          target: `node-${caseB.id}`,
          type: "SHARED_DOMAIN",
          score: domainResult.score,
          label: `Shared Source: ${domainResult.domain}`
        });
      }

      // 4. Same Blockchain Anchor Block
      if (
        caseA.blockchainAnchor?.blockNumber &&
        caseA.blockchainAnchor.blockNumber === caseB.blockchainAnchor?.blockNumber
      ) {
        graphLinks.push({
          id: `link-block-${caseA.id}-${caseB.id}`,
          source: `node-${caseA.id}`,
          target: `node-${caseB.id}`,
          type: "BLOCK_NEIGHBOR",
          score: 100,
          label: `Anchor Block #${caseA.blockchainAnchor.blockNumber}`
        });
      }
    }
  }

  // Filter links based on current user controls
  const filteredLinks = graphLinks.filter((l) => {
    if (l.score < minCorrelation) return false;
    if (filterType !== "ALL" && l.type !== filterType) return false;
    return true;
  });

  // Filter nodes if search query provided
  const visibleNodes = graphNodes.filter((n) => {
    if (!searchQuery) return true;
    return (
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.caseId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pan & Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2));
  const handleReset = () => {
    setZoom(0.9);
    setPan({ x: 40, y: 30 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const exportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `veritrace-cross-case-correlation-graph.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pairwise case instances
  const caseObjA = cases.find((c) => c.id === selectedCaseA);
  const caseObjB = cases.find((c) => c.id === selectedCaseB);

  // Pairwise metrics
  const pairwiseFaceScore = caseObjA && caseObjB ? computeFaceSimilarity(caseObjA, caseObjB) : 0;
  const pairwisePHashScore = caseObjA && caseObjB ? computePHashSimilarity(caseObjA.metadata.perceptualHash, caseObjB.metadata.perceptualHash) : 0;
  const pairwiseByteMatch = caseObjA && caseObjB && caseObjA.metadata.sha256 === caseObjB.metadata.sha256;
  const pairwiseDomainMatch = caseObjA && caseObjB ? computeSharedDomainScore(caseObjA, caseObjB) : { score: 0 };

  const pairwiseComposite = Math.round(
    pairwiseFaceScore * 0.35 +
    pairwisePHashScore * 0.35 +
    (pairwiseByteMatch ? 100 : 0) * 0.15 +
    pairwiseDomainMatch.score * 0.15
  );

  const selectedNodeData = graphNodes.find((n) => n.id === selectedNodeId);

  return (
    <div id="cross-case-network-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GitGraph className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-mono uppercase">
                Cross-Case Correlation & Forensic Network Explorer
              </h1>
              <p className="text-xs text-white/40 mt-0.5">
                Relational graph format mapping multi-case biometric overlaps, perceptual derivatives, and on-chain proofs.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded bg-black/60 border border-white/10 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab("GLOBAL_GRAPH")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-semibold ${
              activeSubTab === "GLOBAL_GRAPH"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Vault Correlation Graph</span>
          </button>

          <button
            onClick={() => setActiveSubTab("PAIRWISE_COMPARISON")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-xs font-semibold ${
              activeSubTab === "PAIRWISE_COMPARISON"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Pairwise Matrix & Dual Graph</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: GLOBAL CORRELATION GRAPH */}
      {activeSubTab === "GLOBAL_GRAPH" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs backdrop-blur-md">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search case or node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-white/40 focus:outline-none w-full"
              />
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/40 text-[11px]">Link Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white/80 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Correlations</option>
                <option value="BIOMETRIC">Biometric Concordance</option>
                <option value="PHASH_DERIVATIVE">pHash Derivatives</option>
                <option value="SHARED_DOMAIN">Shared Domains</option>
                <option value="BLOCK_NEIGHBOR">Blockchain Block</option>
              </select>
            </div>

            {/* Minimum Correlation Slider */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10 text-white/60">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>Min Corr:</span>
              <input
                type="range"
                min="0"
                max="95"
                value={minCorrelation}
                onChange={(e) => setMinCorrelation(Number(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <span className="text-emerald-400 font-bold min-w-[32px]">{minCorrelation}%</span>
            </div>

            {/* Zoom / Reset / Export */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded border border-white/10 bg-black/50 overflow-hidden">
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
                  title="Reset View"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={exportSvg}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs transition-colors"
                title="Export as SVG"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export Graph</span>
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Graph Canvas */}
          <div
            className={`relative w-full rounded-lg bg-[#060606] border border-white/10 overflow-hidden flex flex-col transition-all duration-300 ${
              isFullscreen ? "fixed inset-0 z-50 rounded-none bg-[#050505] p-6" : ""
            }`}
            style={{ height: isFullscreen ? "100vh" : "560px" }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Ambient Background Grid */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
                backgroundSize: "32px 32px"
              }}
            />

            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid meet"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <defs>
                <filter id="globalGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <marker id="arrowGreen" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker id="arrowCyan" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Links */}
                {filteredLinks.map((link) => {
                  const src = visibleNodes.find((n) => n.id === link.source);
                  const tgt = visibleNodes.find((n) => n.id === link.target);
                  if (!src || !tgt) return null;

                  const isHigh = link.score >= 90;
                  const isModerate = link.score >= 75;
                  const strokeColor =
                    link.type === "BIOMETRIC"
                      ? "#10b981"
                      : link.type === "PHASH_DERIVATIVE"
                      ? "#06b6d4"
                      : link.type === "SHARED_DOMAIN"
                      ? "#f59e0b"
                      : "#8b5cf6";

                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;
                  const pathD = `M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`;

                  return (
                    <g key={link.id} className="transition-opacity">
                      {/* Glow path */}
                      {isHigh && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.5"
                          strokeOpacity="0.25"
                          filter="url(#globalGlow)"
                        />
                      )}

                      {/* Main connection line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHigh ? "2" : "1.5"}
                        strokeDasharray={isHigh ? "6, 4" : "3, 3"}
                        markerEnd={isHigh ? "url(#arrowGreen)" : undefined}
                      />

                      {/* Flowing animated pulse circle */}
                      <circle r="2.5" fill="#34d399">
                        <animateMotion path={pathD} dur="3.5s" repeatCount="indefinite" />
                      </circle>

                      {/* Label badge on midpoint */}
                      <g transform={`translate(${midX}, ${midY})`} className="cursor-pointer">
                        <rect
                          x="-50"
                          y="-9"
                          width="100"
                          height="18"
                          rx="4"
                          fill="#050505"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={strokeColor}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {link.score}% {link.type.split("_")[0]}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      {/* Highlight ring if selected */}
                      {isSelected && (
                        <circle
                          r="36"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="2"
                          strokeDasharray="4, 4"
                          className="animate-spin-slow opacity-90"
                        />
                      )}

                      {/* Node Aura */}
                      <circle
                        r="28"
                        fill="#10b981"
                        fillOpacity={isSelected ? "0.3" : "0.12"}
                        stroke="#10b981"
                        strokeWidth={isSelected ? "2" : "1.5"}
                        filter="url(#globalGlow)"
                      />

                      {/* Base Circle */}
                      <circle r="22" fill="#080808" stroke="#10b981" strokeWidth="1.2" />

                      {/* Icon */}
                      <foreignObject x="-12" y="-12" width="24" height="24" className="pointer-events-none">
                        <div className="w-full h-full flex items-center justify-center text-emerald-400">
                          <FileImage className="w-4 h-4" />
                        </div>
                      </foreignObject>

                      {/* Label */}
                      <text
                        x="0"
                        y="42"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="select-none uppercase drop-shadow-md"
                      >
                        {node.caseId}
                      </text>
                      <text
                        x="0"
                        y="54"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.4)"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {node.label.slice(0, 18)}...
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend & Stats Overlay */}
            <div className="absolute bottom-3 left-3 p-3 rounded bg-black/80 border border-white/10 backdrop-blur-md font-mono text-[10px] text-white/60 space-y-1.5 z-20">
              <span className="font-bold text-white text-[11px] block uppercase tracking-wider">
                Forensic Edge Types
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Biometric Identity
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> pHash Derivative
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Shared Web Domain
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Ledger Block Neighbor
                </span>
              </div>
            </div>
          </div>

          {/* Selected Node Details Drawer */}
          {selectedNodeData && (
            <div className="p-4 rounded-lg bg-black/60 border border-emerald-500/30 backdrop-blur-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold uppercase">{selectedNodeData.label}</h4>
                    <span className="text-emerald-400 text-[11px]">{selectedNodeData.caseId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate("case-detail", selectedNodeData.caseId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-[11px] transition-colors"
                  >
                    <span>Inspect Case</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="px-2 py-1 text-white/40 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  <span className="text-white/40 block text-[9px]">Faces Localized:</span>
                  <span className="text-white font-bold">{selectedNodeData.facesCount} Face(s)</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  <span className="text-white/40 block text-[9px]">Web Sources:</span>
                  <span className="text-white font-bold">{selectedNodeData.sourcesCount} Occurrence(s)</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  <span className="text-white/40 block text-[9px]">Perceptual Hash:</span>
                  <span className="text-cyan-300 font-mono truncate block">{selectedNodeData.pHash || "N/A"}</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-white/5">
                  <span className="text-white/40 block text-[9px]">Anchor Block:</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {selectedNodeData.blockNumber ? `#${selectedNodeData.blockNumber}` : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: PAIRWISE CASE CORRELATION MATRIX & DUAL GRAPH */}
      {activeSubTab === "PAIRWISE_COMPARISON" && (
        <div className="space-y-6 font-mono">
          {/* Pair Selection Header */}
          <div className="p-4 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full flex items-center gap-3">
              <div className="w-full">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  Primary Evidence (Case A)
                </span>
                <select
                  value={selectedCaseA}
                  onChange={(e) => setSelectedCaseA(e.target.value)}
                  className="w-full p-2 rounded bg-black/70 border border-white/15 text-white text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-center p-2 rounded-full bg-white/5 border border-white/10 text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>

            <div className="flex-1 w-full flex items-center gap-3">
              <div className="w-full">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                  Comparative Target (Case B)
                </span>
                <select
                  value={selectedCaseB}
                  onChange={(e) => setSelectedCaseB(e.target.value)}
                  className="w-full p-2 rounded bg-black/70 border border-white/15 text-white text-xs focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pairwise Analysis Display */}
          {caseObjA && caseObjB ? (
            <div className="space-y-6">
              {/* Composite Correlation Verdict Banner */}
              <div className="p-4 rounded-lg bg-black/40 border border-emerald-500/30 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    {pairwiseComposite}%
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                      Pairwise Cross-Case Forensic Correlation Index
                    </h3>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {pairwiseComposite >= 85
                        ? "High probability of identical visual subject or shared digital lineage."
                        : pairwiseComposite >= 60
                        ? "Moderate correlation detected: shared low-frequency spatial structure or biometric proximity."
                        : "Independent artifacts: divergent biometrics, unique cryptographic hashes, distinct domains."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                    {pairwiseComposite >= 85
                      ? "PROBATIVE OVERLAP"
                      : pairwiseComposite >= 60
                      ? "MODERATE LINK"
                      : "INDEPENDENT"}
                  </span>
                </div>
              </div>

              {/* Pairwise Visual Graph & Radar Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Dual Node Correlation Graph */}
                <div className="p-4 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <GitGraph className="w-3.5 h-3.5 text-emerald-400" />
                      Pairwise Relational Topology Graph
                    </span>
                    <span className="text-[10px] text-white/40">Directed Cross-Links</span>
                  </div>

                  <div className="relative h-64 w-full flex items-center justify-between px-8 bg-[#070707] rounded border border-white/5 overflow-hidden">
                    {/* Node A */}
                    <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                      <div className="w-16 h-16 rounded border-2 border-emerald-400 overflow-hidden bg-black/80 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        {caseObjA.evidenceFile.url ? (
                          <img
                            src={caseObjA.evidenceFile.url}
                            alt="Case A"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileImage className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase">{caseObjA.id}</span>
                      <span className="text-[9px] text-emerald-400">Primary Artifact</span>
                    </div>

                    {/* Central Connecting Flow Lines with Metric Badges */}
                    <div className="flex-1 px-4 flex flex-col items-center justify-center space-y-2">
                      {/* Biometric Link */}
                      <div className="w-full flex items-center justify-between text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="flex items-center gap-1">
                          <ScanFace className="w-3 h-3" /> Biometrics:
                        </span>
                        <span className="font-bold">{pairwiseFaceScore}%</span>
                      </div>

                      {/* pHash Link */}
                      <div className="w-full flex items-center justify-between text-[10px] px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> pHash Concordance:
                        </span>
                        <span className="font-bold">{pairwisePHashScore}%</span>
                      </div>

                      {/* SHA-256 Byte Match Link */}
                      <div className="w-full flex items-center justify-between text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/70">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Byte Identity:
                        </span>
                        <span className={pairwiseByteMatch ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {pairwiseByteMatch ? "EXACT MATCH (100%)" : "DISTINCT BYTES"}
                        </span>
                      </div>
                    </div>

                    {/* Node B */}
                    <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                      <div className="w-16 h-16 rounded border-2 border-cyan-400 overflow-hidden bg-black/80 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        {caseObjB.evidenceFile.url ? (
                          <img
                            src={caseObjB.evidenceFile.url}
                            alt="Case B"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileImage className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase">{caseObjB.id}</span>
                      <span className="text-[9px] text-cyan-400">Target Artifact</span>
                    </div>
                  </div>
                </div>

                {/* Right: Comparative Multi-Signal Radar Graph */}
                <div className="p-4 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                      <Radar className="w-3.5 h-3.5 text-emerald-400" />
                      5-Pillar Comparative Signal Analysis
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Case A Profile</span>
                  </div>

                  <CorrelationRadarGraph
                    correlation={caseObjA.correlation}
                    faceData={caseObjA.faceData}
                    metadata={caseObjA.metadata}
                    sourcesCount={caseObjA.searchResults?.length || 0}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40">
              Select two cases above to inspect their pairwise correlation graph.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
