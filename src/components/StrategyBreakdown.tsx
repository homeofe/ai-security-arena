"use client";

import type { StrategyAnalysis } from "@/types";

interface StrategyBreakdownProps {
  analysis: StrategyAnalysis;
}

export function StrategyBreakdown({ analysis }: StrategyBreakdownProps) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Strategy Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamStrategyCard team="red" strategy={analysis.red} />
        <TeamStrategyCard team="blue" strategy={analysis.blue} />
      </div>
    </div>
  );
}

function TeamStrategyCard({ team, strategy }: { team: "red" | "blue"; strategy: StrategyAnalysis["red"] }) {
  const isRed = team === "red";
  const totalPhaseActions = Object.values(strategy.phases).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className={`rounded-xl p-5 border ${isRed ? "bg-red-950/15 border-red-500/20" : "bg-blue-950/15 border-blue-500/20"}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{isRed ? "🔴" : "🔵"}</span>
        <h3 className={`text-sm font-bold ${isRed ? "gradient-text-red" : "gradient-text-blue"}`}>
          {isRed ? "Red Team" : "Blue Team"} Strategy
        </h3>
      </div>

      {/* Success rate meter */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Success Rate</span>
          <span className="text-xs text-mono text-gray-200 font-bold">
            {Math.round(strategy.successRate * 100)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isRed ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-blue-600 to-blue-400"}`}
            style={{ width: `${strategy.successRate * 100}%` }}
          />
        </div>
      </div>

      {/* Phase distribution (horizontal bars) */}
      <div className="mb-5">
        <div className="text-xs text-gray-400 mb-3">Phase Distribution</div>
        <div className="space-y-2">
          {Object.entries(strategy.phases)
            .sort((a, b) => b[1] - a[1])
            .map(([phase, count]) => {
              const pct = (count / totalPhaseActions) * 100;
              return (
                <div key={phase} className="flex items-center gap-3">
                  <span className="text-[0.65rem] text-mono text-gray-400 w-20 text-right">
                    {phase}
                  </span>
                  <div className="flex-1 h-4 rounded bg-gray-800/60 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-700 ${isRed ? "bg-red-500/50" : "bg-blue-500/50"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-mono text-gray-500 w-8">
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Strengths */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Strengths</div>
        <div className="flex flex-wrap gap-1.5">
          {strategy.strengths.map((s, i) => (
            <span
              key={i}
              className="text-[0.65rem] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Weaknesses</div>
        <div className="flex flex-wrap gap-1.5">
          {strategy.weaknesses.map((w, i) => (
            <span
              key={i}
              className="text-[0.65rem] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Adaptations timeline */}
      {strategy.adaptations.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2">Strategy Adaptations</div>
          <div className="space-y-1.5">
            {strategy.adaptations.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isRed ? "bg-red-500/60" : "bg-blue-500/60"}`} />
                <span className="text-[0.65rem] text-gray-500 leading-relaxed">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
