"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { BattleEvent, MatchSummary } from "@/types";
import { calculateScore } from "@/lib/scoring";

type PlayState = "stopped" | "playing" | "paused";

function ReplayContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [allEvents, setAllEvents] = useState<BattleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>("stopped");
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const visibleEvents = allEvents.slice(0, currentIndex);
  const currentRound = Math.floor(currentIndex / 2) + 1;
  const totalRounds = Math.ceil(allEvents.length / 2);
  const score = calculateScore(visibleEvents);

  // Current red and blue events for the split view
  const currentRedEvent = visibleEvents.filter((e) => e.team === "red").slice(-1)[0];
  const currentBlueEvent = visibleEvents.filter((e) => e.team === "blue").slice(-1)[0];

  // Load match data
  useEffect(() => {
    if (!matchId) {
      setError("No match ID provided. Go to History to select a match.");
      setLoading(false);
      return;
    }

    fetch(`/api/matches/${matchId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Match not found");
        return res.json();
      })
      .then((data) => {
        setMatch(data.match);
        setAllEvents(data.events);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Play/pause logic
  const tick = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= allEvents.length) {
        setPlayState("stopped");
        return prev;
      }
      return prev + 1;
    });
  }, [allEvents.length]);

  useEffect(() => {
    if (playState === "playing") {
      const interval = Math.max(100, 800 / speed);
      timerRef.current = setTimeout(() => {
        tick();
      }, interval);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playState, speed, tick, currentIndex]);

  // Controls
  const handlePlay = () => {
    if (currentIndex >= allEvents.length) {
      setCurrentIndex(0);
    }
    setPlayState("playing");
  };
  const handlePause = () => setPlayState("paused");
  const handleStop = () => {
    setPlayState("stopped");
    setCurrentIndex(0);
  };
  const handleStepForward = () => {
    if (currentIndex < allEvents.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };
  const handleStepBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };
  const handleSeek = (value: number) => {
    setCurrentIndex(value);
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="text-gray-500 text-lg">Loading replay...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <a href="/history" className="text-purple-400 hover:text-purple-300 transition">
          Back to History
        </a>
      </div>
    );
  }

  if (!match) return null;

  const redPercent = score.red.points + score.blue.points > 0
    ? (score.red.points / (score.red.points + score.blue.points)) * 100
    : 50;

  return (
    <div className="space-y-4 animate-float-in">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold gradient-text-battle">Replay: {match.scenarioName}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="text-red-400">{match.redModel}</span>
              <span>vs</span>
              <span className="text-blue-400">{match.blueModel}</span>
              <span>|</span>
              <span>{match.rounds} rounds</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">
              {match.winner === "red" ? (
                <span className="text-red-400">Red Team Won</span>
              ) : match.winner === "blue" ? (
                <span className="text-blue-400">Blue Team Won</span>
              ) : (
                <span className="text-purple-400">Draw</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {match.redScore} : {match.blueScore}
            </div>
          </div>
        </div>
      </div>

      {/* Score progression */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-red-400 font-mono font-bold w-8 text-right">
            {score.red.points}
          </span>
          <div className="flex-1 score-bar-bg h-4">
            <div className="flex h-full">
              <div
                className="score-bar-red"
                style={{ width: `${redPercent}%` }}
              />
              <div
                className="score-bar-blue"
                style={{ width: `${100 - redPercent}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-blue-400 font-mono font-bold w-8">
            {score.blue.points}
          </span>
        </div>
      </div>

      {/* Split-screen: Red vs Blue */}
      <div className="grid grid-cols-2 gap-4" style={{ minHeight: "300px" }}>
        {/* Red Team Panel */}
        <div className="glass-card-red p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔴</span>
            <h3 className="text-sm font-bold gradient-text-red">Red Team</h3>
          </div>
          {currentRedEvent ? (
            <EventDetail event={currentRedEvent} />
          ) : (
            <div className="text-xs text-gray-600 italic">Waiting for action...</div>
          )}

          {/* Red event history */}
          <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
            {visibleEvents
              .filter((e) => e.team === "red")
              .reverse()
              .slice(1, 6)
              .map((e, i) => (
                <MiniEvent key={i} event={e} />
              ))}
          </div>
        </div>

        {/* Blue Team Panel */}
        <div className="glass-card-blue p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔵</span>
            <h3 className="text-sm font-bold gradient-text-blue">Blue Team</h3>
          </div>
          {currentBlueEvent ? (
            <EventDetail event={currentBlueEvent} />
          ) : (
            <div className="text-xs text-gray-600 italic">Waiting for action...</div>
          )}

          {/* Blue event history */}
          <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
            {visibleEvents
              .filter((e) => e.team === "blue")
              .reverse()
              .slice(1, 6)
              .map((e, i) => (
                <MiniEvent key={i} event={e} />
              ))}
          </div>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs text-gray-400 font-mono">
            Round {currentRound}/{totalRounds}
          </span>
          <input
            type="range"
            min={0}
            max={allEvents.length}
            value={currentIndex}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs text-gray-400 font-mono">
            {currentIndex}/{allEvents.length} events
          </span>
        </div>

        {/* Round markers */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: totalRounds }, (_, i) => {
            const roundStart = i * 2;
            const isActive = currentIndex >= roundStart;
            const isCurrent = currentRound === i + 1;
            return (
              <button
                key={i}
                onClick={() => handleSeek(roundStart)}
                className={`
                  flex-1 h-2 rounded-full transition cursor-pointer
                  ${isCurrent ? "bg-purple-500" : isActive ? "bg-gray-600" : "bg-gray-800"}
                `}
                title={`Round ${i + 1}`}
              />
            );
          })}
        </div>

        {/* VCR Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleStop}
            className="glass-card px-3 py-1.5 text-sm hover:border-gray-500/50 transition cursor-pointer"
            title="Stop"
          >
            ⏹
          </button>
          <button
            onClick={handleStepBack}
            disabled={currentIndex === 0}
            className="glass-card px-3 py-1.5 text-sm hover:border-gray-500/50 transition cursor-pointer disabled:opacity-30"
            title="Step back"
          >
            ⏪
          </button>
          {playState === "playing" ? (
            <button
              onClick={handlePause}
              className="glass-card px-5 py-2 text-sm font-bold hover:border-yellow-500/50 transition cursor-pointer"
              title="Pause"
            >
              ⏸
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="start-button rounded-lg px-5 py-2 text-sm font-bold text-white cursor-pointer"
              title="Play"
            >
              ▶
            </button>
          )}
          <button
            onClick={handleStepForward}
            disabled={currentIndex >= allEvents.length}
            className="glass-card px-3 py-1.5 text-sm hover:border-gray-500/50 transition cursor-pointer disabled:opacity-30"
            title="Step forward"
          >
            ⏩
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-500">Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`
                  px-2 py-1 rounded text-xs font-mono transition cursor-pointer
                  ${speed === s
                    ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                    : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
                  }
                `}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <a
          href="/history"
          className="glass-card px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-500/50 transition inline-flex items-center gap-2"
        >
          ← Back to History
        </a>
        <a
          href="/report"
          className="glass-card px-4 py-2 text-sm text-purple-300 hover:border-purple-500/50 transition inline-flex items-center gap-2"
        >
          📊 Full Report
        </a>
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: BattleEvent }) {
  return (
    <div className={`p-3 rounded-lg ${event.success ? "log-entry-success" : "log-entry-failure"} bg-gray-900/40`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`phase-badge ${event.team === "red" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
          {event.phase}
        </span>
        <span className="text-xs text-gray-400">{event.action}</span>
        <span className={`ml-auto text-xs font-semibold ${event.success ? "text-green-400" : "text-red-400"}`}>
          {event.success ? "SUCCESS" : "FAILED"}
        </span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed battle-log">{event.detail}</p>
    </div>
  );
}

function MiniEvent({ event }: { event: BattleEvent }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 py-1 border-b border-gray-800/50">
      <span className={`w-1.5 h-1.5 rounded-full ${event.success ? "bg-green-500/60" : "bg-red-500/40"}`} />
      <span className="font-mono text-gray-600">{event.phase}</span>
      <span className="truncate">{event.action}</span>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-gray-500">Loading...</div>}>
      <ReplayContent />
    </Suspense>
  );
}
