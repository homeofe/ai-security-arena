"use client";

import type { BattleScore } from "@/types";

interface ScoreBarProps {
  score: BattleScore;
}

export function ScoreBar({ score }: ScoreBarProps) {
  const totalPoints = Math.max(1, score.red.points + score.blue.points);
  const redPercent = totalPoints > 0 ? (score.red.points / totalPoints) * 100 : 50;
  const bluePercent = 100 - redPercent;

  // If both are 0, show 50/50
  const displayRedPercent = score.red.points === 0 && score.blue.points === 0 ? 50 : Math.max(5, Math.min(95, redPercent));
  const displayBluePercent = 100 - displayRedPercent;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm">🔴</span>
          <span className="text-sm font-bold text-red-400 text-mono">
            {score.red.points} pts
          </span>
          <div className="hidden sm:flex gap-3 text-[0.65rem] text-gray-500 text-mono">
            <span title="Attacks landed">
              💥 {score.red.attacksLanded}
            </span>
            <span title="Attacks blocked">
              🚫 {score.red.attacksBlocked}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
          Score
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-[0.65rem] text-gray-500 text-mono">
            <span title="Detections correct">
              ✅ {score.blue.detectionsCorrect}
            </span>
            <span title="Detections missed">
              ❌ {score.blue.detectionsMissed}
            </span>
          </div>
          <span className="text-sm font-bold text-blue-400 text-mono">
            {score.blue.points} pts
          </span>
          <span className="text-sm">🔵</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="score-bar-bg h-4 flex">
        <div
          className="score-bar-red h-full relative"
          style={{ width: `${displayRedPercent}%` }}
        >
          {displayRedPercent > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold text-white/80 text-mono">
              {Math.round(redPercent)}%
            </span>
          )}
        </div>
        <div
          className="score-bar-blue h-full relative"
          style={{ width: `${displayBluePercent}%` }}
        >
          {displayBluePercent > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold text-white/80 text-mono">
              {Math.round(bluePercent)}%
            </span>
          )}
        </div>
      </div>

      {/* Winner indicator */}
      {score.winner && (
        <div className="mt-2 text-center">
          <span className={`text-xs font-bold uppercase tracking-widest ${
            score.winner === "red" ? "text-red-400" : "text-blue-400"
          }`}>
            {score.winner === "red" ? "🔴 Red Team Leading" : "🔵 Blue Team Leading"}
          </span>
        </div>
      )}
    </div>
  );
}
