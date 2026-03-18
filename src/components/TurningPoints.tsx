"use client";

import type { TurningPoint } from "@/types";

interface TurningPointsProps {
  turningPoints: TurningPoint[];
}

export function TurningPoints({ turningPoints }: TurningPointsProps) {
  if (turningPoints.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Turning Points
        </h2>
        <div className="text-center py-8 text-gray-600 text-sm">
          No significant momentum shifts detected in this battle.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Turning Points
      </h2>

      <div className="space-y-4">
        {turningPoints.map((tp, idx) => (
          <TurningPointCard key={idx} point={tp} index={idx} />
        ))}
      </div>
    </div>
  );
}

function TurningPointCard({ point, index }: { point: TurningPoint; index: number }) {
  const isRed = point.team === "red";

  return (
    <div
      className={`
        relative rounded-xl p-5 border overflow-hidden
        ${isRed ? "bg-red-950/15 border-red-500/20" : "bg-blue-950/15 border-blue-500/20"}
      `}
    >
      {/* Glow background effect */}
      <div
        className={`absolute top-0 left-0 w-full h-full pointer-events-none ${
          isRed ? "bg-gradient-to-br from-red-500/5 to-transparent" : "bg-gradient-to-br from-blue-500/5 to-transparent"
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          {/* Lightning bolt indicator */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isRed ? "bg-red-500/20 border border-red-500/30" : "bg-blue-500/20 border border-blue-500/30"
          }`}>
            <span className="text-lg">⚡</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-mono text-gray-400">
                Round {point.round}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isRed ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"
              }`}>
                {isRed ? "Red Advantage" : "Blue Advantage"}
              </span>
            </div>
          </div>

          {/* Score delta */}
          <div className={`text-xl font-black text-mono ${
            point.scoreDelta > 0
              ? (isRed ? "text-red-400" : "text-blue-400")
              : "text-gray-500"
          }`}>
            {point.scoreDelta > 0 ? "+" : ""}{point.scoreDelta}
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          {point.description}
        </p>
      </div>
    </div>
  );
}
