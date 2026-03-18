"use client";

import { useState } from "react";
import type { BattleReport, TimelineEntry, TurningPoint, TurnReasoning } from "@/types";

interface DecisionTimelineProps {
  report: BattleReport;
}

const PHASE_COLORS: Record<string, string> = {
  RECON: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  SCAN: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  EXPLOIT: "bg-red-500/20 text-red-300 border-red-500/30",
  ESCALATE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  PERSIST: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  EXFIL: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  DETECT: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  MONITOR: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  HARDEN: "bg-green-500/20 text-green-300 border-green-500/30",
  RESPOND: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CONTAIN: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  ANALYZE: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

export function DecisionTimeline({ report }: DecisionTimelineProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const turningPointRounds = new Set(report.turningPoints.map((tp) => tp.round));

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
        Decision Timeline
      </h2>

      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gray-700 via-gray-600 to-gray-700 -translate-x-1/2" />

        <div className="space-y-4">
          {report.timeline.map((entry, idx) => {
            const isTurningPoint = turningPointRounds.has(entry.round);
            const turningPoint = report.turningPoints.find((tp) => tp.round === entry.round);
            const isExpanded = expandedRound === entry.round;
            const reasoning = report.reasoning.filter((r) => r.round === entry.round);

            return (
              <div key={entry.round}>
                {/* Turning point marker */}
                {isTurningPoint && turningPoint && (
                  <div className="relative flex justify-center mb-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 z-10">
                      <span className="text-amber-400">⚡</span>
                      <span className="text-[0.65rem] text-amber-300 font-semibold">TURNING POINT</span>
                      <span className={`text-[0.65rem] text-mono font-bold ${turningPoint.team === "red" ? "text-red-400" : "text-blue-400"}`}>
                        {turningPoint.scoreDelta > 0 ? "+" : ""}{turningPoint.scoreDelta}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`relative grid grid-cols-[1fr_auto_1fr] gap-4 items-start cursor-pointer group ${isTurningPoint ? "animate-pulse-glow rounded-lg" : ""}`}
                  onClick={() => setExpandedRound(isExpanded ? null : entry.round)}
                >
                  {/* Red Team (left side) */}
                  <div className="flex justify-end">
                    {entry.redEvent && (
                      <TimelineCard
                        event={entry.redEvent}
                        side="left"
                        isTurningPoint={isTurningPoint}
                      />
                    )}
                  </div>

                  {/* Center round marker */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-mono border-2 ${
                      isTurningPoint
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-gray-800 border-gray-600 text-gray-300"
                    }`}>
                      {entry.round}
                    </div>
                    {/* Score indicator */}
                    <div className="mt-1 flex gap-2 text-[0.6rem] text-mono">
                      <span className="text-red-400">{entry.cumulativeRedScore}</span>
                      <span className="text-gray-600">/</span>
                      <span className="text-blue-400">{entry.cumulativeBlueScore}</span>
                    </div>
                  </div>

                  {/* Blue Team (right side) */}
                  <div className="flex justify-start">
                    {entry.blueEvent && (
                      <TimelineCard
                        event={entry.blueEvent}
                        side="right"
                        isTurningPoint={isTurningPoint}
                      />
                    )}
                  </div>
                </div>

                {/* Expanded reasoning */}
                {isExpanded && reasoning.length > 0 && (
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-4 animate-slide-up">
                    <div className="flex justify-end">
                      {reasoning.find((r) => r.team === "red") && (
                        <ReasoningCard reasoning={reasoning.find((r) => r.team === "red")!} />
                      )}
                    </div>
                    <div className="w-10" />
                    <div className="flex justify-start">
                      {reasoning.find((r) => r.team === "blue") && (
                        <ReasoningCard reasoning={reasoning.find((r) => r.team === "blue")!} />
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded reasoning for when there's no reasoning data but user clicked */}
                {isExpanded && reasoning.length === 0 && (
                  <div className="mt-3 flex justify-center animate-slide-up">
                    <div className="text-xs text-gray-600 bg-gray-900/40 rounded-lg px-4 py-2 border border-gray-800/50">
                      Detailed reasoning not available for this round (mock mode)
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  event,
  side,
  isTurningPoint,
}: {
  event: NonNullable<TimelineEntry["redEvent"]>;
  side: "left" | "right";
  isTurningPoint: boolean;
}) {
  const isRed = event.team === "red";
  const phaseClass = PHASE_COLORS[event.phase] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";

  return (
    <div
      className={`
        max-w-xs p-3 rounded-lg border transition-all group-hover:scale-[1.02]
        ${isRed ? "bg-red-950/20 border-red-500/20" : "bg-blue-950/20 border-blue-500/20"}
        ${isTurningPoint ? (isRed ? "glow-red" : "glow-blue") : ""}
      `}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`phase-badge border ${phaseClass}`}>
          {event.phase}
        </span>
        <span className={`w-2 h-2 rounded-full ${event.success ? "bg-green-400" : "bg-red-400"}`} />
      </div>
      <div className="text-xs text-gray-300 font-semibold mb-1">
        {event.action.replace(/_/g, " ")}
      </div>
      <div className="text-[0.65rem] text-gray-500 leading-relaxed line-clamp-2">
        {event.detail}
      </div>
    </div>
  );
}

function ReasoningCard({ reasoning }: { reasoning: TurnReasoning }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const isRed = reasoning.team === "red";

  return (
    <div className={`max-w-sm p-3 rounded-lg border ${isRed ? "bg-red-950/10 border-red-500/10" : "bg-blue-950/10 border-blue-500/10"}`}>
      {/* Thinking time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[0.6rem] text-gray-500">Thinking time:</span>
        <span className="text-[0.6rem] text-mono text-gray-300">{reasoning.thinkingTime}ms</span>
        {reasoning.tokensUsed && (
          <>
            <span className="text-[0.6rem] text-gray-600">|</span>
            <span className="text-[0.6rem] text-mono text-gray-300">{reasoning.tokensUsed} tokens</span>
          </>
        )}
      </div>

      {/* Collapsible prompt */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowPrompt(!showPrompt); }}
        className="text-[0.65rem] text-gray-400 hover:text-gray-200 transition mb-1 flex items-center gap-1 cursor-pointer"
      >
        <span className="text-mono">{showPrompt ? "v" : ">"}</span> Prompt Sent
      </button>
      {showPrompt && (
        <pre className="text-[0.6rem] text-gray-500 bg-black/30 rounded p-2 mb-2 overflow-x-auto max-h-40 overflow-y-auto text-mono whitespace-pre-wrap">
          {reasoning.promptSent}
        </pre>
      )}

      {/* Collapsible response */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowResponse(!showResponse); }}
        className="text-[0.65rem] text-gray-400 hover:text-gray-200 transition mb-1 flex items-center gap-1 cursor-pointer"
      >
        <span className="text-mono">{showResponse ? "v" : ">"}</span> Raw LLM Response
      </button>
      {showResponse && (
        <pre className="text-[0.6rem] text-gray-400 bg-black/30 rounded p-2 overflow-x-auto max-h-48 overflow-y-auto text-mono whitespace-pre-wrap">
          {reasoning.rawResponse}
        </pre>
      )}
    </div>
  );
}
