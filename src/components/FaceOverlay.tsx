import React, { useState } from "react";
import { FaceForensicData, FaceBoundingBox } from "../types.js";
import { Scan, Eye, Crosshair, Sparkles } from "lucide-react";

interface FaceOverlayProps {
  imageUrl: string;
  faceData?: FaceForensicData;
  showLandmarks?: boolean;
  onSelectBox?: (box: FaceBoundingBox) => void;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  imageUrl,
  faceData,
  showLandmarks = true,
  onSelectBox
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const boxes = faceData?.boundingBoxes || [];

  return (
    <div
      id="face-overlay-container"
      className="relative w-full overflow-hidden rounded-lg bg-[#0d0d0d] border border-white/10 group shadow-2xl"
    >
      {/* Background dot grid for frosted evidence aesthetic */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Evidence Image */}
      <img
        id="forensic-target-img"
        src={imageUrl}
        alt="Forensic Evidence"
        className={`w-full h-auto object-contain max-h-[460px] mx-auto transition-opacity duration-300 relative z-0 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
      />

      {!imageLoaded && (
        <div className="w-full h-64 flex items-center justify-center text-neutral-500 gap-2">
          <Scan className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm font-mono">Loading evidence raster...</span>
        </div>
      )}

      {/* SVG Overlay for Bounding Boxes and Landmarks */}
      {imageLoaded && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {boxes.map((box, idx) => {
            const isHovered = hoveredIndex === idx;
            const width = Math.max(2, box.xmax - box.xmin);
            const height = Math.max(2, box.ymax - box.ymin);

            return (
              <g key={idx}>
                {/* Tactical Bounding Box */}
                <rect
                  x={`${box.xmin}%`}
                  y={`${box.ymin}%`}
                  width={`${width}%`}
                  height={`${height}%`}
                  fill={isHovered ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.04)"}
                  stroke={isHovered ? "#34d399" : "#10b981"}
                  strokeWidth="0.6"
                  strokeDasharray={isHovered ? "none" : "2,1"}
                  className="transition-all duration-200"
                />

                {/* Corner Crosshairs */}
                <line
                  x1={`${box.xmin}%`}
                  y1={`${box.ymin}%`}
                  x2={`${box.xmin + 3}%`}
                  y2={`${box.ymin}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <line
                  x1={`${box.xmin}%`}
                  y1={`${box.ymin}%`}
                  x2={`${box.xmin}%`}
                  y2={`${box.ymin + 3}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />

                <line
                  x1={`${box.xmax}%`}
                  y1={`${box.ymin}%`}
                  x2={`${box.xmax - 3}%`}
                  y2={`${box.ymin}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <line
                  x1={`${box.xmax}%`}
                  y1={`${box.ymin}%`}
                  x2={`${box.xmax}%`}
                  y2={`${box.ymin + 3}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />

                <line
                  x1={`${box.xmin}%`}
                  y1={`${box.ymax}%`}
                  x2={`${box.xmin + 3}%`}
                  y2={`${box.ymax}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <line
                  x1={`${box.xmin}%`}
                  y1={`${box.ymax}%`}
                  x2={`${box.xmin}%`}
                  y2={`${box.ymax - 3}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />

                <line
                  x1={`${box.xmax}%`}
                  y1={`${box.ymax}%`}
                  x2={`${box.xmax - 3}%`}
                  y2={`${box.ymax}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <line
                  x1={`${box.xmax}%`}
                  y1={`${box.ymax}%`}
                  x2={`${box.xmax}%`}
                  y2={`${box.ymax - 3}%`}
                  stroke="#10b981"
                  strokeWidth="1"
                />

                {/* Center Reticle */}
                <circle
                  cx={`${box.xmin + width / 2}%`}
                  cy={`${box.ymin + height / 2}%`}
                  r="0.8"
                  fill="#10b981"
                />
              </g>
            );
          })}

          {/* Facial Landmarks (Eyes, Nose, Mouth) */}
          {showLandmarks && faceData?.landmarks && (
            <g>
              {faceData.landmarks.leftEye && (
                <circle
                  cx={`${faceData.landmarks.leftEye[1]}%`}
                  cy={`${faceData.landmarks.leftEye[0]}%`}
                  r="0.9"
                  fill="#06b6d4"
                  className="animate-pulse"
                />
              )}
              {faceData.landmarks.rightEye && (
                <circle
                  cx={`${faceData.landmarks.rightEye[1]}%`}
                  cy={`${faceData.landmarks.rightEye[0]}%`}
                  r="0.9"
                  fill="#06b6d4"
                  className="animate-pulse"
                />
              )}
              {faceData.landmarks.nose && (
                <circle
                  cx={`${faceData.landmarks.nose[1]}%`}
                  cy={`${faceData.landmarks.nose[0]}%`}
                  r="0.7"
                  fill="#10b981"
                />
              )}
              {faceData.landmarks.mouth && (
                <circle
                  cx={`${faceData.landmarks.mouth[1]}%`}
                  cy={`${faceData.landmarks.mouth[0]}%`}
                  r="0.8"
                  fill="#f59e0b"
                />
              )}
            </g>
          )}
        </svg>
      )}

      {/* Interactive HTML Hover Badges */}
      {imageLoaded &&
        boxes.map((box, idx) => (
          <div
            key={idx}
            style={{
              top: `${box.ymin}%`,
              left: `${box.xmin}%`
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSelectBox?.(box)}
            className="absolute -translate-y-full mb-1 cursor-pointer pointer-events-auto z-20"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-500 text-black text-[10px] font-bold font-mono uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Crosshair className="w-3 h-3 text-black stroke-[2.5]" />
              <span>{box.label || `Face #${idx + 1}`}</span>
              <span className="opacity-40">|</span>
              <span>{(box.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}

      {/* Floating Metadata Glass Badges (Frosted Glass Theme Signature) */}
      <div className="absolute bottom-12 left-3 hidden sm:flex gap-2 pointer-events-none z-20">
        <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded">
          <div className="text-[9px] uppercase font-mono text-white/40 leading-none mb-0.5">Metadata</div>
          <div className="font-mono text-[10px] text-white/80">SHA-256 Indexed | Cryptographic Lock</div>
        </div>
        <div className="bg-black/70 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded">
          <div className="text-[9px] uppercase font-mono text-white/40 leading-none mb-0.5">Biometrics</div>
          <div className="font-mono text-[10px] text-emerald-400">
            {faceData?.facesDetected ? `${faceData.facesDetected} Verified Signals` : "Zero Anomalies"}
          </div>
        </div>
      </div>

      {/* Bottom Info HUD Bar */}
      <div className="relative z-20 bg-black/80 backdrop-blur-md border-t border-white/10 px-3 py-2 flex items-center justify-between text-xs font-mono text-white/60">
        <div className="flex items-center gap-2">
          <Scan className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {faceData?.facesDetected
              ? `${faceData.facesDetected} Subject${faceData.facesDetected > 1 ? "s" : ""} Located`
              : "Scanning for Facial Geometry..."}
          </span>
        </div>

        {faceData?.embeddingFingerprint && (
          <div className="flex items-center gap-1.5 text-[11px] text-white/80">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-white/40">Vector Fingerprint:</span>
            <span className="text-emerald-400 font-mono tracking-wider font-semibold">
              {faceData.embeddingFingerprint}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
