"use client";

import type { MatchSummary } from "@/types";

interface ReportHeaderProps {
  match: MatchSummary;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${remaining}s`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportHeader({ match }: ReportHeaderProps) {
  const winnerColor = match.winner === "red" ? "text-red-400" : match.winner === "blue" ? "text-blue-400" : "text-purple-400";
  const winnerLabel = match.winner === "red" ? "RED TEAM VICTORY" : match.winner === "blue" ? "BLUE TEAM VICTORY" : "DRAW";
  const winnerGlow = match.winner === "red" ? "glow-red" : match.winner === "blue" ? "glow-blue" : "";

  return (
    <div className="relative overflow-hidden">
      {/* Classified watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span
          className="text-[8rem] font-black text-gray-500/[0.03] uppercase tracking-[0.3em]"
          style={{ transform: "rotate(-25deg)" }}
        >
          CLASSIFIED
        </span>
      </div>

      <div className="glass-card p-8 relative z-10">
        {/* Top label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[0.65rem] font-bold text-amber-400/80 uppercase tracking-[0.2em]">
              Classified Intelligence Briefing
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-400/20 to-transparent" />
          <span className="text-[0.65rem] text-gray-600 text-mono">
            REF: {match.id.toUpperCase()}
          </span>
        </div>

        {/* Main title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
          <span className="gradient-text-battle">BATTLE REPORT</span>
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-mono">
          {match.scenarioName} // {formatDate(match.createdAt)}
        </p>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetaItem label="Red Team" value={match.redModel} accent="text-red-400" />
          <MetaItem label="Blue Team" value={match.blueModel} accent="text-blue-400" />
          <MetaItem label="Duration" value={formatDuration(match.durationMs)} />
          <MetaItem label="Rounds" value={String(match.rounds)} />
          <MetaItem label="Scenario" value={match.scenarioName} />
          <MetaItem label="Total Cost" value={`$${match.totalCostUsd.toFixed(4)}`} />
          <MetaItem label="Red Score" value={String(match.redScore)} accent="text-red-400" />
          <MetaItem label="Blue Score" value={String(match.blueScore)} accent="text-blue-400" />
        </div>

        {/* Winner declaration */}
        <div className={`text-center p-6 rounded-xl bg-gray-900/50 border border-gray-700/30 ${winnerGlow}`}>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Final Verdict</div>
          <div className={`text-3xl md:text-4xl font-black ${winnerColor} mb-2`}>
            {winnerLabel}
          </div>
          <div className="flex items-center justify-center gap-6 text-mono">
            <span className="text-2xl font-bold text-red-400">{match.redScore}</span>
            <span className="text-gray-600 text-lg">vs</span>
            <span className="text-2xl font-bold text-blue-400">{match.blueScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800/50">
      <div className="text-[0.6rem] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm font-semibold text-mono truncate ${accent ?? "text-gray-200"}`}>
        {value}
      </div>
    </div>
  );
}
