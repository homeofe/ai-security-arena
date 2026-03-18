"use client";

import { useEffect, useRef } from "react";
import type { BattleEvent, Team } from "@/types";
import { PhaseIcon } from "./PhaseIcon";

function formatTimestamp(ts: number, startedAt: number): string {
  const elapsed = Math.max(0, ts - startedAt);
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const ms = elapsed % 1000;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

interface TeamLogProps {
  events: BattleEvent[];
  team: Team;
  startedAt: number;
}

function TeamLog({ events, team, startedAt }: TeamLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRed = team === "red";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`
        flex items-center gap-2 px-4 py-2.5 border-b
        ${isRed
          ? "border-red-900/40 bg-red-950/30"
          : "border-blue-900/40 bg-blue-950/30"
        }
      `}>
        <span className="text-sm">{isRed ? "🔴" : "🔵"}</span>
        <span className={`text-sm font-bold uppercase tracking-wider ${isRed ? "text-red-400" : "text-blue-400"}`}>
          {isRed ? "Red Team" : "Blue Team"} 
        </span>
        <span className="text-xs text-gray-600 text-mono ml-auto">
          {events.length} events
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className={`
          flex-1 overflow-y-auto p-3 space-y-1 battle-log
          ${isRed ? "battle-log-red" : "battle-log-blue"}
        `}
      >
        {events.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            <span className="animate-blink mr-2">_</span>
            Waiting for events...
          </div>
        )}

        {events.map((event, idx) => (
          <div
            key={idx}
            className={`
              animate-slide-up px-2 py-1.5 rounded
              ${event.success ? "log-entry-success" : "log-entry-failure"}
            `}
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[0.65rem] text-gray-600 text-mono shrink-0">
                {formatTimestamp(event.timestamp, startedAt)}
              </span>
              <PhaseIcon phase={event.phase} />
              {event.success ? (
                <span className="text-[0.6rem] text-green-500 font-bold ml-auto">OK</span>
              ) : (
                <span className="text-[0.6rem] text-red-500/60 font-bold ml-auto">FAIL</span>
              )}
            </div>
            <div className={`text-xs ${event.success ? "text-gray-300" : "text-gray-500"}`}>
              <span className="text-gray-400 font-medium">{event.action}</span>
              {" : "}
              {event.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BattleLogProps {
  events: BattleEvent[];
  startedAt: number;
}

export function BattleLog({ events, startedAt }: BattleLogProps) {
  const redEvents = events.filter((e) => e.team === "red");
  const blueEvents = events.filter((e) => e.team === "blue");

  return (
    <div className="flex gap-0 h-full rounded-xl overflow-hidden border border-gray-800/50">
      {/* Red Team Log */}
      <div className="flex-1 flex flex-col border-r border-gray-800/30">
        <TeamLog events={redEvents} team="red" startedAt={startedAt} />
      </div>

      {/* Center Divider */}
      <div className="center-divider" />

      {/* Blue Team Log */}
      <div className="flex-1 flex flex-col">
        <TeamLog events={blueEvents} team="blue" startedAt={startedAt} />
      </div>
    </div>
  );
}
