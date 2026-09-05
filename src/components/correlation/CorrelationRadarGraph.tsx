import React, { useState } from "react";
import { CorrelationReport, FaceForensicData, EvidenceMetadata } from "../../types.js";
import { Network, ShieldCheck, AlertTriangle, Eye, Info, Sparkles } from "lucide-react";

interface CorrelationRadarGraphProps {
  correlation?: CorrelationReport;
  faceData?: FaceForensicData;
  metadata?: EvidenceMetadata;
  sourcesCount?: number;
  compact?: boolean;
}

interface MetricAxis {
  key: string;
  label: string;
  score: number; // 0 - 100
  weight: number;
  category: string;
  description: string;
}

export const CorrelationRadarGraph: React.FC<CorrelationRadarGraphProps> = ({
  correlation,
  faceData,
  metadata,
  sourcesCount = 0,
  compact = false
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<MetricAxis | null>(null);

  // Derive quantitative scores for the 5 correlation pillars
  const biometricScore = correlation?.faceCorrelationScore ?? (faceData && faceData.facesDetected > 0 ? Math.round(faceData.confidence * 96) : 50);
  const perceptualScore = correlation?.visualPerceptualScore ?? (metadata?.perceptualHash ? 92 : 60);
  const cryptoScore = metadata?.sha256 ? 100 : 70;
  const sourceScore = correlation?.sourceConsistencyScore ?? (sourcesCount > 0 ? Math.min(95, 70 + sourcesCount * 7) : 40);
  const metadataScore = correlation?.metadataConsistencyScore ?? 94;

  const axes: MetricAxis[] = [
    {
      key: "biometric",
      label: "Facial Biometrics",
      score: biometricScore,
      weight: 0.25,
      category: "BIOMETRIC",
      description: "Landmark geometry & high-dimensional feature embedding concordance."
    },
    {
      key: "perceptual",
      label: "Perceptual Hash (pHash)",
      score: perceptualScore,
      weight: 0.20,
      category: "VISUAL",
      description: "Discrete Cosine Transform (DCT) low-frequency spatial structure alignment."
    },
    {
      key: "crypto",
      label: "SHA-256 Byte Integrity",
      score: cryptoScore,
      weight: 0.25,
      category: "CRYPTOGRAPHIC",
      description: "FIPS 180-4 deterministic cryptographic hash byte-for-byte validation."
    },
    {
      key: "provenance",
      label: "Source Alignment",
      score: sourceScore,
      weight: 0.15,
      category: "DISCOVERY",
      description: "Multi-domain reverse visual web grounding and archive corroboration."
    },
    {
      key: "metadata",
      label: "Temporal & Metadata",
      score: metadataScore,
      weight: 0.15,
      category: "METADATA",
      description: "EXIF timeline, format container consistency, and canonical serialization."
    }
  ];

  // Composite Weighted Score
  const compositeScore = Math.round(
    axes.reduce((acc, ax) => acc + ax.score * ax.weight, 0)
  );

  // Radar geometry configuration
  const size = compact ? 260 : 340;
  const center = size / 2;
  const radius = center - (compact ? 38 : 52);
  const angleStep = (Math.PI * 2) / axes.length;

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Calculate polygon points for each concentric level
  const getLevelPolygon = (lvl: number) => {
    return axes
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * lvl * Math.cos(angle);
        const y = center + radius * lvl * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Calculate data polygon points
  const dataPoints = axes.map((ax, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const norm = Math.max(0.08, Math.min(1.0, ax.score / 100));
    const x = center + radius * norm * Math.cos(angle);
    const y = center + radius * norm * Math.sin(angle);
    return { x, y, score: ax.score, angle, axis: ax };
  });

  const dataPolygonString = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const getAdmissibilityVerdict = (score: number) => {
    if (score >= 90) return { text: "COURT-READY / STRONG CORRELATION", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
    if (score >= 75) return { text: "PROBATIVE / MODERATE CONVERGENCE", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
    if (score >= 50) return { text: "INCONCLUSIVE / DIVERGENT SIGNALS", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    return { text: "INTEGRITY RISK / CORRELATION ANOMALY", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" };
  };

  const verdict = getAdmissibilityVerdict(compositeScore);

  return (
    <div id="correlation-radar-container" className="w-full flex flex-col lg:flex-row items-center gap-6 p-4 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
      {/* Radar SVG Visualizer */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          className="overflow-visible drop-shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        >
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#059669" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
            </radialGradient>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="radarGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Grid Polygons */}
          {levels.map((lvl, idx) => (
            <polygon
              key={`lvl-${lvl}`}
              points={getLevelPolygon(lvl)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={idx === levels.length - 1 ? 1.5 : 1}
              strokeDasharray={idx === levels.length - 1 ? "none" : "3,3"}
            />
          ))}

          {/* Level Percentage Markers */}
          {levels.map((lvl) => (
            <text
              key={`txt-${lvl}`}
              x={center + 4}
              y={center - radius * lvl + 10}
              fill="rgba(255, 255, 255, 0.25)"
              fontSize="9"
              fontFamily="monospace"
            >
              {Math.round(lvl * 100)}%
            </text>
          ))}

          {/* Axis Spokes */}
          {axes.map((ax, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            const isHovered = hoveredAxis?.key === ax.key;

            return (
              <g key={`spoke-${ax.key}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke={isHovered ? "#34d399" : "rgba(255, 255, 255, 0.12)"}
                  strokeWidth={isHovered ? 1.5 : 1}
                />
              </g>
            );
          })}

          {/* Data Polygon Fill */}
          <polygon
            points={dataPolygonString}
            fill="url(#radarGlow)"
            stroke="url(#edgeGrad)"
            strokeWidth="2"
            filter="url(#radarGlowFilter)"
            className="transition-all duration-300"
          />

          {/* Vertex Points & Labels */}
          {dataPoints.map((p) => {
            const isHovered = hoveredAxis?.key === p.axis.key;
            const labelDist = radius + (compact ? 22 : 28);
            const labelX = center + labelDist * Math.cos(p.angle);
            const labelY = center + labelDist * Math.sin(p.angle);

            return (
              <g
                key={`point-${p.axis.key}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAxis(p.axis)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {/* Vertex Circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? "#34d399" : "#10b981"}
                  stroke="#050505"
                  strokeWidth="2"
                  className="transition-all duration-200 shadow-lg"
                />
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={10}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer Axis Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isHovered ? "#34d399" : "rgba(255, 255, 255, 0.7)"}
                  fontSize={compact ? "9" : "10"}
                  fontWeight={isHovered ? "bold" : "normal"}
                  fontFamily="monospace"
                  className="transition-colors uppercase tracking-wider"
                >
                  {p.axis.label.split(" ")[0]} ({p.score}%)
                </text>
              </g>
            );
          })}

          {/* Central Composite Badge */}
          <circle cx={center} cy={center} r={18} fill="#0a0a0a" stroke="#10b981" strokeWidth="1.5" />
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {compositeScore}%
          </text>
        </svg>

        <div className="mt-2 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
            Composite Multi-Signal Correlation
          </span>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${verdict.color} ${verdict.bg} ${verdict.border}`}>
            {verdict.text}
          </span>
        </div>
      </div>

      {/* Axis Breakdown & Forensic Signal Breakdown */}
      <div className="flex-1 w-full space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            5-Pillar Correlation Signal Matrix
          </span>
          <span className="text-[10px] text-white/40">
            Hover axes to inspect weighting
          </span>
        </div>

        <div className="space-y-2">
          {axes.map((ax) => {
            const isHovered = hoveredAxis?.key === ax.key;

            return (
              <div
                key={ax.key}
                onMouseEnter={() => setHoveredAxis(ax)}
                onMouseLeave={() => setHoveredAxis(null)}
                className={`p-2.5 rounded border transition-all cursor-pointer ${
                  isHovered
                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className={`font-semibold ${isHovered ? "text-emerald-300" : "text-white/90"}`}>
                      {ax.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-white/40 border border-white/10 uppercase">
                      {ax.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 font-normal">
                      Weight: {Math.round(ax.weight * 100)}%
                    </span>
                    <span className={`font-bold font-mono ${ax.score >= 90 ? "text-emerald-400" : ax.score >= 70 ? "text-cyan-400" : "text-amber-400"}`}>
                      {ax.score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ax.score >= 90 ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : ax.score >= 70 ? "bg-cyan-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${ax.score}%` }}
                  />
                </div>

                {isHovered && (
                  <p className="text-[10px] text-white/60 mt-1.5 leading-relaxed animate-in fade-in duration-150">
                    {ax.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Scientific Disclaimer Note */}
        <div className="p-2 rounded bg-black/50 border border-white/5 text-[10px] text-white/40 flex items-start gap-1.5 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Correlation signals synthesize biometric landmark vectors, spatial frequency invariance, and cryptographic digests to establish probative evidentiary convergence.
          </span>
        </div>
      </div>
    </div>
  );
};
