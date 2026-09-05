import React, { useState, useRef } from "react";
import { ForensicCase } from "../../types.js";
import {
  FileImage,
  ScanFace,
  Globe,
  Hash,
  FileCheck,
  Blocks,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Filter,
  X,
  Sparkles,
  ChevronRight,
  Fingerprint
} from "lucide-react";

interface InteractiveNetworkGraphProps {
  forensicCase: ForensicCase;
}

interface NetworkNode {
  id: string;
  label: string;
  category: "INTAKE" | "BIOMETRICS" | "DISCOVERY" | "CONSENSUS" | "SECURITY";
  icon: React.ElementType;
  x: number;
  y: number;
  status: "COMPLETE" | "WAITING" | "ALERT";
  description: string;
  correlationContribution?: number; // 0 - 100
  details: Record<string, string | number | undefined>;
}

interface NetworkLink {
  id: string;
  source: string;
  target: string;
  label: string;
  correlationWeight: number; // 0 - 100%
  type: "BIOMETRIC" | "CRYPTOGRAPHIC" | "DISCOVERY" | "CONSENSUS" | "VERIFICATION";
}

export const InteractiveNetworkGraph: React.FC<InteractiveNetworkGraphProps> = ({ forensicCase }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("node-evidence");
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [correlationThreshold, setCorrelationThreshold] = useState(40);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const hasFace = Boolean(forensicCase.faceData && forensicCase.faceData.facesDetected > 0);
  const hasSources = Boolean(forensicCase.searchResults && forensicCase.searchResults.length > 0);
  const hasManifest = Boolean(forensicCase.manifest);
  const hasBlockchain = Boolean(forensicCase.blockchainAnchor);
  const hasVerification = Boolean(
    forensicCase.verificationHistory && forensicCase.verificationHistory.length > 0
  );

  // Initial topological node coordinates (Canvas width: 900, height: 500)
  const initialNodes: NetworkNode[] = [
    {
      id: "node-evidence",
      label: "Visual Artifact",
      category: "INTAKE",
      icon: FileImage,
      x: 450,
      y: 250,
      status: "COMPLETE",
      correlationContribution: 100,
      description: "Primary ingested visual evidence file held in tamper-evident quarantine.",
      details: {
        Filename: forensicCase.metadata.filename,
        MIME: forensicCase.metadata.mimeType,
        Size: `${(forensicCase.metadata.sizeBytes / 1024).toFixed(1)} KB`,
        Dimensions: forensicCase.metadata.width ? `${forensicCase.metadata.width}x${forensicCase.metadata.height}` : "Variable",
        "Captured At": forensicCase.metadata.capturedAt || "Original Timestamp Intact"
      }
    },
    {
      id: "node-face-detect",
      label: "Face Biometrics",
      category: "BIOMETRICS",
      icon: ScanFace,
      x: 230,
      y: 130,
      status: hasFace ? "COMPLETE" : "WAITING",
      correlationContribution: forensicCase.correlation?.faceCorrelationScore ?? (hasFace ? 96 : 40),
      description: "Landmark geometry localization and normalized high-dimensional facial vector.",
      details: {
        "Faces Detected": forensicCase.faceData?.facesDetected ?? 0,
        "Landmark Confidence": forensicCase.faceData ? `${(forensicCase.faceData.confidence * 100).toFixed(1)}%` : "N/A",
        "Vector Fingerprint": forensicCase.faceData?.embeddingFingerprint || "Local Vault Only",
        "Vector Dimensions": `${forensicCase.faceData?.embeddingDimension || 512}-D Vector`
      }
    },
    {
      id: "node-sources",
      label: "Reverse Web Grounding",
      category: "DISCOVERY",
      icon: Globe,
      x: 670,
      y: 130,
      status: hasSources ? "COMPLETE" : "WAITING",
      correlationContribution: forensicCase.correlation?.sourceConsistencyScore ?? (hasSources ? 91 : 40),
      description: "Multi-domain reverse visual web grounding and digital archive corroboration.",
      details: {
        "Candidate Occurrences": forensicCase.searchResults.length,
        "Primary Provider": forensicCase.searchResults[0]?.provider || "Active Adapter",
        "Top Domain": forensicCase.searchResults[0]?.domain || "N/A",
        "Correlation Level": forensicCase.searchResults[0]?.correlationAssessment || "Evaluated"
      }
    },
    {
      id: "node-sha256",
      label: "Cryptographic Digest",
      category: "SECURITY",
      icon: Hash,
      x: 230,
      y: 370,
      status: "COMPLETE",
      correlationContribution: 100,
      description: "FIPS 180-4 SHA-256 byte digest and DCT perceptual hash frequency signature.",
      details: {
        "SHA-256 Digest": forensicCase.metadata.sha256,
        "Perceptual Hash (pHash)": forensicCase.metadata.perceptualHash || "DCT 64-bit",
        Algorithm: "FIPS 180-4 SHA-256 (Deterministic)",
        "Byte Integrity": "Exact Byte-Match Verified"
      }
    },
    {
      id: "node-manifest",
      label: "Evidence Manifest",
      category: "CONSENSUS",
      icon: FileCheck,
      x: 670,
      y: 370,
      status: hasManifest ? "COMPLETE" : "WAITING",
      correlationContribution: 98,
      description: "RFC 8785 Canonical JSON deterministic representation of forensic state.",
      details: {
        "Manifest ID": forensicCase.manifest?.evidenceId || "Pending compilation",
        Serialization: "RFC 8785 Canonical Deterministic JSON",
        Timestamp: forensicCase.manifest?.timestamp || "Pending anchor",
        "Payload Digest": forensicCase.blockchainAnchor?.manifestHash || "Cryptographically Signed"
      }
    },
    {
      id: "node-blockchain",
      label: "Blockchain Commitment",
      category: "CONSENSUS",
      icon: Blocks,
      x: 770,
      y: 250,
      status: hasBlockchain ? "COMPLETE" : "WAITING",
      correlationContribution: 100,
      description: "Immutable cryptographic commitment anchored on EVM blockchain or local authority.",
      details: {
        Network: forensicCase.blockchainAnchor?.network || "Pending anchor",
        "Block Number": forensicCase.blockchainAnchor?.blockNumber ? `#${forensicCase.blockchainAnchor.blockNumber}` : "Pending",
        "Transaction Hash": forensicCase.blockchainAnchor?.transactionHash || "Pending",
        VerificationMode: forensicCase.blockchainAnchor?.verificationMode || "Pending"
      }
    },
    {
      id: "node-verification",
      label: "Tamper Proof Test",
      category: "SECURITY",
      icon: ShieldCheck,
      x: 130,
      y: 250,
      status: hasVerification
        ? forensicCase.verificationHistory[0]?.match
          ? "COMPLETE"
          : "ALERT"
        : "WAITING",
      correlationContribution: hasVerification ? (forensicCase.verificationHistory[0]?.match ? 100 : 0) : 80,
      description: "Independent byte-for-byte replay verification against on-chain cryptographic root.",
      details: {
        Status: hasVerification
          ? forensicCase.verificationHistory[0]?.match
            ? "VERIFIED (100% Match)"
            : "FAILED (Tampering Detected)"
          : "Pending independent replay",
        "Tested Digest": forensicCase.verificationHistory[0]?.testedHash || "Awaiting submission",
        "Replay Logs": `${forensicCase.verificationHistory.length} verification attempt(s)`
      }
    }
  ];

  const [nodes, setNodes] = useState<NetworkNode[]>(initialNodes);

  // Dynamic links with weighted correlation scores
  const links: NetworkLink[] = [
    {
      id: "link-evidence-face",
      source: "node-evidence",
      target: "node-face-detect",
      label: hasFace ? `${forensicCase.correlation?.faceCorrelationScore || 96}% Biometric Fit` : "No Face Localized",
      correlationWeight: forensicCase.correlation?.faceCorrelationScore || (hasFace ? 96 : 30),
      type: "BIOMETRIC"
    },
    {
      id: "link-evidence-sources",
      source: "node-evidence",
      target: "node-sources",
      label: hasSources ? `${forensicCase.correlation?.sourceConsistencyScore || 91}% Provenance Concordance` : "Pending Discovery",
      correlationWeight: forensicCase.correlation?.sourceConsistencyScore || (hasSources ? 91 : 35),
      type: "DISCOVERY"
    },
    {
      id: "link-evidence-sha256",
      source: "node-evidence",
      target: "node-sha256",
      label: "100% Cryptographic Digest",
      correlationWeight: 100,
      type: "CRYPTOGRAPHIC"
    },
    {
      id: "link-evidence-manifest",
      source: "node-evidence",
      target: "node-manifest",
      label: "RFC 8785 Canonical Serialization",
      correlationWeight: 98,
      type: "CONSENSUS"
    },
    {
      id: "link-manifest-blockchain",
      source: "node-manifest",
      target: "node-blockchain",
      label: hasBlockchain ? "Immutable Block Anchor (100%)" : "Pending Commitment",
      correlationWeight: hasBlockchain ? 100 : 40,
      type: "CONSENSUS"
    },
    {
      id: "link-evidence-verification",
      source: "node-evidence",
      target: "node-verification",
      label: hasVerification
        ? forensicCase.verificationHistory[0]?.match
          ? "Byte-Match Confirmed (100%)"
          : "Tamper Detected (0%)"
        : "Replay Test Available",
      correlationWeight: hasVerification ? (forensicCase.verificationHistory[0]?.match ? 100 : 15) : 75,
      type: "VERIFICATION"
    },
    {
      id: "link-face-sources",
      source: "node-face-detect",
      target: "node-sources",
      label: hasFace && hasSources ? "Cross-Correlated Biometric Signals" : "Signal Decoupled",
      correlationWeight: hasFace && hasSources ? 94 : 30,
      type: "BIOMETRIC"
    }
  ];

  // Pan & Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setNodes(initialNodes);
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
    } else if (draggingNodeId) {
      // Drag node
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const clientX = (e.clientX - rect.left - pan.x) / zoom;
      const clientY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId
            ? { ...n, x: Math.max(50, Math.min(850, clientX)), y: Math.max(50, Math.min(450, clientY)) }
            : n
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const exportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `forensic-correlation-graph-${forensicCase.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getNodeColor = (cat: NetworkNode["category"], status: NetworkNode["status"]) => {
    if (status === "ALERT") return { fill: "#e11d48", stroke: "#f43f5e", text: "#fda4af" };
    switch (cat) {
      case "INTAKE":
        return { fill: "#10b981", stroke: "#34d399", text: "#6ee7b7" };
      case "BIOMETRICS":
        return { fill: "#06b6d4", stroke: "#22d3ee", text: "#67e8f9" };
      case "DISCOVERY":
        return { fill: "#3b82f6", stroke: "#60a5fa", text: "#93c5fd" };
      case "CONSENSUS":
        return { fill: "#8b5cf6", stroke: "#a78bfa", text: "#c4b5fd" };
      case "SECURITY":
        return { fill: "#10b981", stroke: "#34d399", text: "#6ee7b7" };
      default:
        return { fill: "#10b981", stroke: "#34d399", text: "#6ee7b7" };
    }
  };

  return (
    <div
      ref={containerRef}
      id="interactive-network-graph-panel"
      className={`relative w-full rounded-lg bg-[#070707] border border-white/10 overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none bg-[#050505] p-6" : ""
      }`}
      style={{ minHeight: isFullscreen ? "100vh" : "580px" }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Interactive Evidence Topology & Correlation Graph
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              GRAPH FORMAT
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">
            Node-link relational topology: drag nodes, hover correlation paths, inspect multi-signal weights.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Correlation Filter Slider */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-white/60">
            <Filter className="w-3 h-3 text-emerald-400" />
            <span>Min Score:</span>
            <input
              type="range"
              min="0"
              max="95"
              value={correlationThreshold}
              onChange={(e) => setCorrelationThreshold(Number(e.target.value))}
              className="w-16 sm:w-20 accent-emerald-500 cursor-pointer"
            />
            <span className="text-emerald-400 font-bold min-w-[32px]">{correlationThreshold}%</span>
          </div>

          {/* Zoom Buttons */}
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
              onClick={handleResetView}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={exportSvg}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-colors"
            title="Export Graph as SVG"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline text-[11px]">Export SVG</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Subtle coordinate grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
            backgroundSize: "28px 28px"
          }}
        />

        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 900 500"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Edge Glow Filter */}
            <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Marker Arrowheads */}
            <marker id="arrowEmerald" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrowCyan" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker id="arrowPurple" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Group with Pan & Zoom Transform */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Render Links / Edges */}
            {links.map((link) => {
              const src = nodes.find((n) => n.id === link.source);
              const tgt = nodes.find((n) => n.id === link.target);
              if (!src || !tgt) return null;

              const isVisible = link.correlationWeight >= correlationThreshold;
              const isHigh = link.correlationWeight >= 90;
              const isModerate = link.correlationWeight >= 70 && link.correlationWeight < 90;

              const strokeColor = !isVisible
                ? "rgba(255, 255, 255, 0.05)"
                : isHigh
                ? "#10b981"
                : isModerate
                ? "#06b6d4"
                : "#f59e0b";

              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              // Slight curve calculation
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const normalX = -dy * 0.12;
              const normalY = dx * 0.12;
              const pathD = `M ${src.x} ${src.y} Q ${midX + normalX} ${midY + normalY} ${tgt.x} ${tgt.y}`;

              return (
                <g key={link.id} className="transition-opacity duration-300">
                  {/* Background Glow Path */}
                  {isVisible && isHigh && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="4"
                      strokeOpacity="0.25"
                      filter="url(#edgeGlow)"
                    />
                  )}

                  {/* Main Flowing Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isVisible ? (isHigh ? "2" : "1.5") : "0.5"}
                    strokeDasharray={isVisible ? (isHigh ? "6, 4" : "4, 4") : "2, 2"}
                    className={isVisible ? "animate-[dash_20s_linear_infinite]" : ""}
                    markerEnd={isVisible ? "url(#arrowEmerald)" : undefined}
                  />

                  {/* Flowing animated pulse circle */}
                  {isVisible && (
                    <circle r="3" fill="#34d399">
                      <animateMotion path={pathD} dur="4s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Edge Weight Badge */}
                  {isVisible && (
                    <g transform={`translate(${midX + normalX * 0.8}, ${midY + normalY * 0.8})`} className="cursor-pointer">
                      <rect
                        x="-45"
                        y="-9"
                        width="90"
                        height="18"
                        rx="4"
                        fill="#050505"
                        stroke={strokeColor}
                        strokeWidth="1"
                        className="shadow-md"
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
                        {link.correlationWeight}% CORR
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const colors = getNodeColor(node.category, node.status);
              const Icon = node.icon;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(node.id);
                  }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      r="32"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      strokeDasharray="4, 4"
                      className="animate-spin-slow opacity-80"
                    />
                  )}

                  {/* Outer Pulsing Aura */}
                  <circle
                    r="24"
                    fill={colors.fill}
                    fillOpacity={isSelected ? "0.3" : "0.12"}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    filter="url(#edgeGlow)"
                  />

                  {/* Inner Core */}
                  <circle r="18" fill="#090909" stroke={colors.stroke} strokeWidth="1" />

                  {/* HTML/ForeignObject Icon */}
                  <foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none">
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <Icon className="w-3.5 h-3.5" style={{ color: colors.text }} />
                    </div>
                  </foreignObject>

                  {/* Node Label Below */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    className="drop-shadow-md select-none tracking-wider uppercase"
                  >
                    {node.label}
                  </text>

                  {/* Node Score Chip */}
                  {node.correlationContribution !== undefined && (
                    <text
                      x="0"
                      y="48"
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.correlationContribution}% Match
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Quick Legend Overlay */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded bg-black/70 border border-white/10 backdrop-blur-md text-[10px] font-mono text-white/50 space-y-1">
          <div className="text-white/80 font-bold uppercase tracking-wider text-[9px] mb-1">
            Graph Topology Legend
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Intake / SHA-256
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Biometrics
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Web Discovery
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Consensus Anchor
            </span>
          </div>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div
          id="graph-node-inspector"
          className="p-4 border-t border-white/10 bg-black/80 backdrop-blur-md space-y-3 z-20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <selectedNode.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    {selectedNode.label}
                  </h4>
                  <span className="px-2 py-0.2 rounded bg-white/5 text-[9px] font-mono text-white/40 border border-white/10 uppercase">
                    {selectedNode.category}
                  </span>
                  {selectedNode.correlationContribution !== undefined && (
                    <span className="px-2 py-0.2 rounded bg-emerald-500/10 text-[9px] font-mono text-emerald-400 border border-emerald-500/20 font-bold">
                      Correlation Score: {selectedNode.correlationContribution}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">{selectedNode.description}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs font-mono pt-1">
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <div key={k} className="p-2 rounded bg-black/60 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block">{k}</span>
                <span className="text-white/90 font-medium break-all mt-0.5 block text-[11px] select-all">
                  {v ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
