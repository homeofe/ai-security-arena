"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ModelConfig, Scenario, BattleEvent, BattleScore, BattleConfig } from "@/types";
import { calculateScore } from "@/lib/scoring";
import { runMockBattle, type MockBattleController } from "@/lib/mock-battle";

import { ModelPicker } from "@/components/ModelPicker";
import { PromptEditor } from "@/components/PromptEditor";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { BattleHeader } from "@/components/BattleHeader";
import { BattleLog } from "@/components/BattleLog";
import { ScoreBar } from "@/components/ScoreBar";

type Phase = "setup" | "battle" | "complete";

function generateId(): string {
  return `battle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ArenaPage() {
  // ── Setup State ──────────────────────────────────────────────────────────
  const [redModel, setRedModel] = useState<ModelConfig | null>(null);
  const [blueModel, setBlueModel] = useState<ModelConfig | null>(null);
  const [redPrompt, setRedPrompt] = useState("");
  const [bluePrompt, setBluePrompt] = useState("");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [maxRounds, setMaxRounds] = useState(10);
  const [budgetLimit, setBudgetLimit] = useState(1.0);

  // ── Battle State ─────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("setup");
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [score, setScore] = useState<BattleScore>({
    red: { points: 0, attacksLanded: 0, attacksBlocked: 0, detectionsCorrect: 0, detectionsMissed: 0, avgResponseTimeMs: 0 },
    blue: { points: 0, attacksLanded: 0, attacksBlocked: 0, detectionsCorrect: 0, detectionsMissed: 0, avgResponseTimeMs: 0 },
  });
  const [currentRound, setCurrentRound] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [costSoFar, setCostSoFar] = useState(0);
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null);

  const controllerRef = useRef<MockBattleController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "battle" && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, startedAt]);

  // ── Simulate cost accumulation ───────────────────────────────────────────
  useEffect(() => {
    if (events.length > 0) {
      // Simulate small cost per event
      setCostSoFar(events.length * 0.0023);
    }
  }, [events.length]);

  // ── Recalculate score when events change ─────────────────────────────────
  useEffect(() => {
    if (events.length > 0) {
      setScore(calculateScore(events));
    }
  }, [events]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const canStart = redModel && blueModel && scenario;

  const handleStart = useCallback(() => {
    if (!redModel || !blueModel || !scenario) return;

    const config: BattleConfig = {
      id: generateId(),
      scenario,
      redModel,
      blueModel,
      redPrompt: redPrompt || undefined,
      bluePrompt: bluePrompt || undefined,
      maxRounds: scenario.maxRounds < maxRounds ? scenario.maxRounds : maxRounds,
      budgetLimitUsd: budgetLimit,
    };

    setBattleConfig(config);
    setPhase("battle");
    setEvents([]);
    setCurrentRound(0);
    setStartedAt(Date.now());
    setElapsedMs(0);
    setCostSoFar(0);
    setIsPaused(false);
    setScore({
      red: { points: 0, attacksLanded: 0, attacksBlocked: 0, detectionsCorrect: 0, detectionsMissed: 0, avgResponseTimeMs: 0 },
      blue: { points: 0, attacksLanded: 0, attacksBlocked: 0, detectionsCorrect: 0, detectionsMissed: 0, avgResponseTimeMs: 0 },
    });

    const controller = runMockBattle(
      config,
      (event) => setEvents((prev) => [...prev, event]),
      (round) => setCurrentRound(round),
      () => {
        setPhase("complete");
        if (timerRef.current) clearInterval(timerRef.current);
      },
    );

    controllerRef.current = controller;
    controller.start();
  }, [redModel, blueModel, scenario, redPrompt, bluePrompt, maxRounds, budgetLimit]);

  const handlePause = useCallback(() => {
    if (controllerRef.current) {
      if (isPaused) {
        controllerRef.current.resume();
        setIsPaused(false);
      } else {
        controllerRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isPaused]);

  const handleStop = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
    }
  }, []);

  const handleReset = useCallback(() => {
    setPhase("setup");
    setEvents([]);
    setCurrentRound(0);
    setElapsedMs(0);
    setCostSoFar(0);
    setBattleConfig(null);
    controllerRef.current = null;
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="space-y-6 animate-float-in">
        {/* Page Title */}
        <div className="text-center mb-2">
          <h2 className="text-3xl font-bold gradient-text-battle mb-2">Battle Arena</h2>
          <p className="text-sm text-gray-500">Configure your teams and start the battle</p>
        </div>

        {/* Team Configuration: Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Red Team */}
          <div className="glass-card-red p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔴</span>
              <h2 className="text-lg font-bold gradient-text-red">Red Team</h2>
              <span className="text-xs text-gray-600 ml-auto">Attacker</span>
            </div>
            <ModelPicker team="red" selected={redModel} onSelect={setRedModel} />
            <PromptEditor team="red" value={redPrompt} onChange={setRedPrompt} />
          </div>

          {/* Blue Team */}
          <div className="glass-card-blue p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔵</span>
              <h2 className="text-lg font-bold gradient-text-blue">Blue Team</h2>
              <span className="text-xs text-gray-600 ml-auto">Defender</span>
            </div>
            <ModelPicker team="blue" selected={blueModel} onSelect={setBlueModel} />
            <PromptEditor team="blue" value={bluePrompt} onChange={setBluePrompt} />
          </div>
        </div>

        {/* Scenario Selector */}
        <ScenarioSelector selected={scenario} onSelect={setScenario} />

        {/* Settings Row */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Rounds
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={maxRounds}
                onChange={(e) => setMaxRounds(Number(e.target.value))}
                className="w-28 accent-purple-500"
              />
              <span className="text-sm text-mono text-gray-300 w-6 text-center">{maxRounds}</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-24 rounded-lg bg-gray-900/60 border border-gray-700/50 py-1.5 pl-6 pr-2 text-sm text-mono text-gray-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            {scenario && (
              <div className="text-xs text-gray-500 ml-auto">
                Scenario max: {scenario.maxRounds} rounds
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center pb-4">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`
              start-button rounded-xl px-12 py-4 text-lg font-bold text-white
              tracking-wider uppercase no-select
              ${canStart ? "animate-pulse-rb cursor-pointer" : "opacity-30 cursor-not-allowed"}
            `}
          >
            ⚔️ Start Battle
          </button>
          {!canStart && (
            <p className="mt-2 text-xs text-gray-600">
              Select models for both teams and a scenario to begin
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Battle / Complete Phase ──────────────────────────────────────────────
  if (!battleConfig) return null;

  return (
    <div className="space-y-4 animate-float-in" style={{ height: "calc(100vh - 140px)" }}>
      {/* Battle Header */}
      <BattleHeader
        config={battleConfig}
        currentRound={currentRound}
        elapsedMs={elapsedMs}
        costSoFar={costSoFar}
        isPaused={isPaused}
      />

      {/* Battle Log */}
      <div className="flex-1" style={{ height: "calc(100% - 200px)" }}>
        <BattleLog events={events} startedAt={startedAt} />
      </div>

      {/* Score Bar */}
      <ScoreBar score={score} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-2">
        {phase === "battle" && (
          <>
            <button
              onClick={handlePause}
              className="glass-card px-6 py-2 text-sm font-semibold hover:border-yellow-500/50 transition cursor-pointer"
            >
              {isPaused ? "▶️ Resume" : "⏸️ Pause"}
            </button>
            <button
              onClick={handleStop}
              className="glass-card px-6 py-2 text-sm font-semibold hover:border-red-500/50 transition text-red-400 cursor-pointer"
            >
              ⏹️ Stop
            </button>
          </>
        )}
        {phase === "complete" && (
          <>
            <div className="glass-card px-8 py-3 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Battle Complete</div>
              <div className="text-xl font-bold">
                {score.winner ? (
                  <span className={score.winner === "red" ? "text-red-400" : "text-blue-400"}>
                    {score.winner === "red" ? "🔴 Red Team Wins!" : "🔵 Blue Team Wins!"}
                  </span>
                ) : (
                  <span className="text-purple-400">Draw!</span>
                )}
              </div>
              <div className="text-xs text-gray-500 text-mono mt-1">
                {events.length} events, {currentRound} rounds, ${costSoFar.toFixed(4)} spent
              </div>
            </div>
            <button
              onClick={handleReset}
              className="start-button rounded-xl px-8 py-3 text-sm font-bold text-white cursor-pointer"
            >
              New Battle
            </button>
          </>
        )}
      </div>
    </div>
  );
}
