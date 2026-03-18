"use client";

import type { BattleConfig } from "@/types";

interface BattleHeaderProps {
  config: BattleConfig;
  currentRound: number;
  elapsedMs: number;
  costSoFar: number;
  isPaused: boolean;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function BattleHeader({ config, currentRound, elapsedMs, costSoFar, isPaused }: BattleHeaderProps) {
  return (
    <div className="glass-card p-4 scanlines relative overflow-hidden">
      <div className="flex items-center justify-between">
        {/* Left: Scenario */}
        <div className="flex items-center gap-3">
          <span className="text-xl">⚔️</span>
          <div>
            <h2 className="text-lg font-bold gradient-text-battle">
              {config.scenario.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-red-400">{config.redModel.name}</span>
              <span>vs</span>
              <span className="text-blue-400">{config.blueModel.name}</span>
            </div>
          </div>
        </div>

        {/* Center: Round Counter */}
        <div className="text-center">
          <div className="text-2xl font-bold text-mono text-white">
            Round {currentRound}
            <span className="text-gray-600">/{config.maxRounds}</span>
          </div>
          {isPaused && (
            <span className="text-xs text-yellow-400 font-medium animate-blink">
              PAUSED
            </span>
          )}
        </div>

        {/* Right: Timer + Cost */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Elapsed</div>
            <div className="text-lg font-bold text-mono text-gray-200">
              {formatTime(elapsedMs)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Cost</div>
            <div className="text-lg font-bold text-mono">
              <span className={costSoFar > config.budgetLimitUsd * 0.8 ? "text-red-400" : "text-green-400"}>
                ${costSoFar.toFixed(4)}
              </span>
              <span className="text-gray-600 text-sm">/${config.budgetLimitUsd.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for rounds */}
      <div className="mt-3 h-1 rounded-full bg-gray-800/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${(currentRound / config.maxRounds) * 100}%` }}
        />
      </div>
    </div>
  );
}
