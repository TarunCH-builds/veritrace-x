import React, { useState } from "react";
import { ForensicCase } from "../types.js";
import {
  FileImage,
  ScanFace,
  Fingerprint,
  Globe,
  Network,
  Hash,
  FileCheck,
  Blocks,
  ShieldCheck,
  ChevronRight,
  Info,
  X,
  Radar,
  GitGraph,
  Layers,
  Sparkles
} from "lucide-react";
import { InteractiveNetworkGraph } from "./correlation/InteractiveNetworkGraph.js";
import { CorrelationRadarGraph } from "./correlation/CorrelationRadarGraph.js";

interface EvidenceGraphProps {
  forensicCase: ForensicCase;
}

interface GraphNode {
  id: string;
  label: string;
  category: "INTAKE" | "BIOMETRICS" | "DISCOVERY" | "CONSENSUS" | "SECURITY";
  icon: React.ElementType;
  status: "COMPLETE" | "IN_PROGRESS" | "WAITING" | "ALERT";
  description: string;
  details: Record<string, string | number | undefined>;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ forensicCase }) => {
  const [viewMode, setViewMode] = useState<"TOPOLOGY_GRAPH" | "CORRELATION_RADAR" | "PIPELINE_STAGES">("TOPOLOGY_GRAPH");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const hasFace = Boolean(forensicCase.faceData && forensicCase.faceData.facesDetected > 0);
  const hasSources = Boolean(forensicCase.searchResults && forensicCase.searchResults.length > 0);
  const hasManifest = Boolean(forensicCase.manifest);
  const hasBlockchain = Boolean(forensicCase.blockchainAnchor);
  const hasVerification = Boolean(
    forensicCase.verificationHistory && forensicCase.verificationHistory.length > 0
  );

  const nodes: GraphNode[] = [
    {
      id: "node-evidence",
      label: "Original Evidence",
      category: "INTAKE",
      icon: FileImage,
      status: "COMPLETE",
      description: "Primary ingested visual artifact in quarantine.",
      details: {
        Filename: forensicCase.metadata.filename,
        MIME: forensicCase.metadata.mimeType,
        Size: `${(forensicCase.metadata.sizeBytes / 1024).toFixed(1)} KB`,
        Dimensions: forensicCase.metadata.width ? `${forensicCase.metadata.width}x${forensicCase.metadata.height}` : "Variable"
      }
    },
    {
      id: "node-face-detect",
      label: "Face Detection",
      category: "BIOMETRICS",
      icon: ScanFace,
      status: hasFace ? "COMPLETE" : "WAITING",
      description: "Landmark localization and spatial bounding box estimation.",
      details: {
        "Faces Detected": forensicCase.faceData?.facesDetected ?? 0,
        Confidence: forensicCase.faceData ? `${(forensicCase.faceData.confidence * 100).toFixed(1)}%` : "Not evaluated",
        Pose: forensicCase.faceData?.attributes?.poseEstimated || "Unchecked"
      }
    },
    {
      id: "node-face-embed",
      label: "Biometric Embedding",
      category: "BIOMETRICS",
      icon: Fingerprint,
      status: hasFace ? "COMPLETE" : "WAITING",
      description: "Normalized geometric feature embedding vector (withheld on-chain).",
      details: {
        Fingerprint: forensicCase.faceData?.embeddingFingerprint || "Pending",
        Dimensions: `${forensicCase.faceData?.embeddingDimension || 512}-D`,
        Storage: "Local Vault Only (Non-Public)"
      }
    },
    {
      id: "node-sources",
      label: "Candidate Sources",
      category: "DISCOVERY",
      icon: Globe,
      status: hasSources ? "COMPLETE" : "WAITING",
      description: "Discovered public occurrences, articles, or archives.",
      details: {
        "Candidates Discovered": forensicCase.searchResults.length,
        "Primary Provider": forensicCase.searchResults[0]?.provider || "Active Adapter",
        "Top Domain": forensicCase.searchResults[0]?.domain || "N/A"
      }
    },
    {
      id: "node-sha256",
      label: "SHA-256 Hash",
      category: "SECURITY",
      icon: Hash,
      status: "COMPLETE",
      description: "Cryptographic digest generated directly on raw binary bytes.",
      details: {
        "Digest (Hex)": forensicCase.metadata.sha256,
        PerceptualHash: forensicCase.metadata.perceptualHash || "Calculated",
        Algorithm: "FIPS 180-4 SHA-256"
      }
    },
    {
      id: "node-manifest",
      label: "Evidence Manifest",
      category: "CONSENSUS",
      icon: FileCheck,
      status: hasManifest ? "COMPLETE" : "WAITING",
      description: "RFC 8785 canonical deterministic JSON metadata manifest.",
      details: {
        "Manifest ID": forensicCase.manifest?.evidenceId || "Pending compilation",
        Timestamp: forensicCase.manifest?.timestamp || "Pending",
        Serialization: "RFC 8785 Canonical JSON"
      }
    },
    {
      id: "node-correlation",
      label: "Correlation Engine",
      category: "DISCOVERY",
      icon: Network,
      status: forensicCase.correlation ? "COMPLETE" : "WAITING",
      description: "Multilateral signal alignment (biometric, visual, provenance).",
      details: {
        Assessment: forensicCase.correlation?.overallAssessment || "Pending",
        "Face Similarity": forensicCase.correlation?.faceCorrelationScore ? `${forensicCase.correlation.faceCorrelationScore}%` : "N/A",
        "Source Consistency": forensicCase.correlation?.sourceConsistencyScore ? `${forensicCase.correlation.sourceConsistencyScore}%` : "N/A"
      }
    },
    {
      id: "node-blockchain",
      label: "Blockchain Anchor",
      category: "CONSENSUS",
      icon: Blocks,
      status: hasBlockchain ? "COMPLETE" : "WAITING",
      description: "Cryptographic commitment anchored on EVM testnet or local authority.",
      details: {
        Network: forensicCase.blockchainAnchor?.network || "Pending anchor",
        "Block #": forensicCase.blockchainAnchor?.blockNumber || "Pending",
        "Tx Hash": forensicCase.blockchainAnchor?.transactionHash || "Pending",
        Mode: forensicCase.blockchainAnchor?.verificationMode || "Pending"
      }
    },
    {
      id: "node-verification",
      label: "Independent Verification",
      category: "SECURITY",
      icon: ShieldCheck,
      status: hasVerification
        ? forensicCase.verificationHistory[0]?.match
          ? "COMPLETE"
          : "ALERT"
        : "WAITING",
      description: "Byte-for-byte comparison of tested file against blockchain anchor.",
      details: {
        "Verification Status": hasVerification
          ? forensicCase.verificationHistory[0]?.match
            ? "VERIFIED (Match)"
            : "INTEGRITY FAILURE (Tampered)"
          : "Pending test",
        "Tested Hash": forensicCase.verificationHistory[0]?.testedHash || "N/A",
        "Attempts Logged": forensicCase.verificationHistory?.length || 0
      }
    }
  ];

  return (
    <div id="evidence-graph-panel" className="relative w-full rounded-lg bg-white/[0.03] border border-white/10 p-4 sm:p-6 overflow-hidden backdrop-blur-md space-y-6">
      {/* Background Technical Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Header and View Mode Switcher */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
              <Network className="w-4 h-4 text-emerald-400" />
              Evidence Correlation & Relational Graph
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              GRAPH FORMAT ACTIVE
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            Cryptographic alignment: Biometric landmarks, web groundings, SHA-256 digests, and on-chain commitments.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 p-1 rounded-sm bg-black/60 border border-white/10 font-mono text-xs">
          <button
            onClick={() => setViewMode("TOPOLOGY_GRAPH")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all text-xs font-semibold ${
              viewMode === "TOPOLOGY_GRAPH"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>

          <button
            onClick={() => setViewMode("CORRELATION_RADAR")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all text-xs font-semibold ${
              viewMode === "CORRELATION_RADAR"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Correlation Radar</span>
          </button>

          <button
            onClick={() => setViewMode("PIPELINE_STAGES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-all text-xs font-semibold ${
              viewMode === "PIPELINE_STAGES"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline Stages</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Interactive Network Topology Graph (True Graph Format) */}
      {viewMode === "TOPOLOGY_GRAPH" && (
        <div className="relative z-10 space-y-4">
          <InteractiveNetworkGraph forensicCase={forensicCase} />

          {/* Complementary Radar Mini-Card */}
          <div className="pt-2">
            <CorrelationRadarGraph
              correlation={forensicCase.correlation}
              faceData={forensicCase.faceData}
              metadata={forensicCase.metadata}
              sourcesCount={forensicCase.searchResults?.length || 0}
              compact={true}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: Correlation Multi-Signal Radar Graph & Matrix */}
      {viewMode === "CORRELATION_RADAR" && (
        <div className="relative z-10 space-y-4">
          <CorrelationRadarGraph
            correlation={forensicCase.correlation}
            faceData={forensicCase.faceData}
            metadata={forensicCase.metadata}
            sourcesCount={forensicCase.searchResults?.length || 0}
            compact={false}
          />
        </div>
      )}

      {/* VIEW 3: Visual Topological Pipeline Stages */}
      {viewMode === "PIPELINE_STAGES" && (
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-2">
            {/* Branch 1: Biometrics & Discovery */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Biometrics & Discovery Pipeline
              </div>

              {[nodes[0], nodes[1], nodes[2], nodes[3]].map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onClick={() => setSelectedNode(node)}
                />
              ))}
            </div>

            {/* Branch 2: Correlation & Manifest */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Correlation & Canonical Manifest
              </div>

              {[nodes[6], nodes[4], nodes[5]].map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onClick={() => setSelectedNode(node)}
                />
              ))}
            </div>

            {/* Branch 3: Blockchain & Verification */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Blockchain Anchoring & Trust
              </div>

              {[nodes[7], nodes[8]].map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode?.id === node.id}
                  onClick={() => setSelectedNode(node)}
                />
              ))}
            </div>
          </div>

          {/* Node Inspector Modal/Drawer for Pipeline Mode */}
          {selectedNode && (
            <div
              id="node-inspector-drawer"
              className="relative z-20 mt-6 p-4 rounded-lg bg-black/70 border border-emerald-500/30 backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <selectedNode.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">{selectedNode.label}</h4>
                    <p className="text-[11px] text-white/40">{selectedNode.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-white/40 hover:text-white rounded-sm hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                {Object.entries(selectedNode.details).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded bg-black/60 border border-white/10">
                    <span className="text-white/40 block text-[10px] uppercase tracking-wider">{key}</span>
                    <span className="text-white/90 font-medium break-all mt-0.5 block">{val ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NodeCardProps {
  node: GraphNode;
  isSelected: boolean;
  onClick: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onClick }) => {
  const Icon = node.icon;

  const isComplete = node.status === "COMPLETE";
  const isAlert = node.status === "ALERT";

  return (
    <div
      onClick={onClick}
      className={`group relative p-3.5 rounded-lg border cursor-pointer transition-all duration-200 backdrop-blur-sm ${
        isSelected
          ? "bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          : isComplete
          ? "bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20"
          : isAlert
          ? "bg-rose-500/10 border-rose-500/30 hover:border-rose-500"
          : "bg-white/[0.01] border-white/5 opacity-60 hover:opacity-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-sm ${
              isComplete
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : isAlert
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-white/5 text-white/40 border border-white/10"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-emerald-300 transition-colors">
              {node.label}
            </h5>
            <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">{node.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isComplete
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : isAlert
                ? "bg-rose-400 animate-ping"
                : "bg-white/20"
            }`}
          />
          <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};
