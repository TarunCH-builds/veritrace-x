import React, { useEffect, useRef } from "react";

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Cryptographic & forensic nodes
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
      pulsePhase: number;
    }

    const nodeCount = Math.min(32, Math.floor((width * height) / 45000));
    const nodes: Node[] = [];

    const colors = [
      "16, 185, 129", // Emerald
      "6, 182, 212",  // Cyan
      "52, 211, 153", // Mint
      "14, 165, 233"  // Sky blue
    ];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.25 + 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections between proximate forensic nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 130;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw & update nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce gently at screen edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Subtle pulsing glow
        const pulse = Math.sin(time + node.pulsePhase) * 0.1 + node.baseAlpha;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color}, ${Math.max(0.08, pulse)})`;
        ctx.fill();

        // Optional tiny outer halo for occasional anchor nodes
        if (node.radius > 2.0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${node.color}, ${pulse * 0.2})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      id="veritrace-animated-background"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* 1. Base dark radial foundation */}
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(0,0,0,0))]" />

      {/* 2. Floating Animated Deep Color Glow Orbs */}
      {/* Orb 1: Deep Emerald Cryptographic Glow (Top-Left / Center) */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[130px] animate-glow-1"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.14) 50%, transparent 75%)",
        }}
      />

      {/* Orb 2: Cyber Cyan / Navy Intelligence Beacon (Top-Right) */}
      <div
        className="absolute -top-[10%] -right-[15%] w-[60vw] h-[60vw] rounded-full blur-[140px] animate-glow-2"
        style={{
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(8, 47, 73, 0.12) 50%, transparent 75%)",
        }}
      />

      {/* Orb 3: Deep Midnight Slate / Indigo Consensus Core (Bottom-Center / Left) */}
      <div
        className="absolute -bottom-[20%] left-[15%] w-[65vw] h-[60vw] rounded-full blur-[150px] animate-glow-3"
        style={{
          background:
            "radial-gradient(circle, rgba(15, 23, 42, 0.35) 0%, rgba(30, 27, 75, 0.15) 50%, transparent 80%)",
        }}
      />

      {/* Orb 4: Deep Mint / Jade Telemetry Field (Bottom-Right) */}
      <div
        className="absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-glow-4"
        style={{
          background:
            "radial-gradient(circle, rgba(5, 150, 105, 0.16) 0%, rgba(4, 47, 46, 0.12) 50%, transparent 75%)",
        }}
      />

      {/* 3. Subtle Cyber Forensic Scanner Beam */}
      <div
        className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-emerald-500/[0.04] to-transparent animate-cyber-scanner"
      />

      {/* 4. Fine Matrix Coordinate Grid & Crosshairs */}
      <div
        className="absolute inset-0 opacity-[0.05] animate-grid-shimmer"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Dot Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* 5. Interactive Particle & Cryptographic Evidence Links Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80"
      />

      {/* 6. Technical Corner Crosshairs (Forensic Interface Precision) */}
      <div className="absolute top-16 left-6 text-white/10 font-mono text-[10px] hidden md:block select-none">
        + SYS.NET: SECURE [EVM_0x742D]
      </div>
      <div className="absolute top-16 right-6 text-white/10 font-mono text-[10px] hidden md:block select-none">
        + CIPHER: SHA256_FIPS_180_4
      </div>
      <div className="absolute bottom-6 left-6 text-white/10 font-mono text-[10px] hidden md:block select-none">
        + LATENCY: 24MS [CONSENSUS_ACTIVE]
      </div>
      <div className="absolute bottom-6 right-6 text-white/10 font-mono text-[10px] hidden md:block select-none">
        + NODE: VT-GOA-ALPHA
      </div>
    </div>
  );
};
