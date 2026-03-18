"use client";

import type { BattleReport } from "@/types";
import { ScoreChart } from "./ScoreChart";

interface ScoreOverviewProps {
  report: BattleReport;
}

export function ScoreOverview({ report }: ScoreOverviewProps) {
  const { match } = report;
  const total = match.redScore + match.blueScore || 1;
  const redPct = Math.round((match.redScore / total) * 100);
  const bluePct = 100 - redPct;

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Score Overview
      </h2>

      {/* Large score comparison */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-xs text-red-400/70 uppercase tracking-wider mb-1">Red Team</div>
          <div className="text-5xl md:text-6xl font-black text-red-400 text-mono">
            {match.redScore}
          </div>
          <div className="text-xs text-gray-600 mt-1">{match.redModel}</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-600 text-xl">vs</div>
          {/* Mini score bar */}
          <div className="w-32 h-2 rounded-full overflow-hidden bg-gray-800 flex">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000"
              style={{ width: `${redPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
              style={{ width: `${bluePct}%` }}
            />
          </div>
          <div className="flex justify-between w-32 text-[0.6rem] text-gray-600 text-mono">
            <span>{redPct}%</span>
            <span>{bluePct}%</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-blue-400/70 uppercase tracking-wider mb-1">Blue Team</div>
          <div className="text-5xl md:text-6xl font-black text-blue-400 text-mono">
            {match.blueScore}
          </div>
          <div className="text-xs text-gray-600 mt-1">{match.blueModel}</div>
        </div>
      </div>

      {/* Stat comparison chart */}
      <ScoreChart report={report} />
    </div>
  );
}
