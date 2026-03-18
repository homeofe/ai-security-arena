"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ModelConfig, Scenario, BattleEvent, BattleScore, BattleConfig, ProviderMode, CliStatus } from "@/types";
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

// ── CLI Model Mapping (client-side mirror) ─────────────────────────────────

function getCliNameForModel(modelId: string): keyof CliStatus | null {
  const id = modelId.toLowerCase();
  if (id.includes("claude") || id.includes("anthropic")) return "claude";
  if (id.includes("gemini") || id.includes("google")) return "gemini";
  if (id.includes("gpt") || id.includes("codex") || id.includes("openai")) return "codex";
  return null;
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
  const [providerMode, setProviderMode] = useState<ProviderMode>("mock");
  const [cliStatus, setCliStatus] = useState<CliStatus | null>(null);
  const [cliLoading, setCliLoading] = useState(false);

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
  const [cliBattleRunning, setCliBattleRunning] = useState(false);

  const controllerRef = useRef<MockBattleController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch CLI Status ─────────────────────────────────────────────────────
  useEffect(() => {
    if (providerMode === "cli" && !cliStatus) {
      setCliLoading(true);
      fetch("/api/cli-status")
        .then((res) => res.json())
        .then((data) => setCliStatus(data))
        .catch(() => setCliStatus({ claude: false, gemini: false, codex: false }))
        .finally(() => setCliLoading(false));
    }
  }, [providerMode, cliStatus]);

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
      const costPerEvent = providerMode === "cli" ? 0.012 : 0.0023;
      setCostSoFar(events.length * costPerEvent);
    }
  }, [events.length, providerMode]);

  // ── Recalculate score when events change ─────────────────────────────────
  useEffect(() => {
    if (events.length > 0) {
      setScore(calculateScore(events));
    }
  }, [events]);

  // ── CLI Validation ───────────────────────────────────────────────────────
  const cliValidationError = useCallback((): string | null => {
    if (providerMode !== "cli") return null;
    if (!cliStatus) return "Detecting CLIs...";
    if (!redModel || !blueModel) return null;

    const redCli = getCliNameForModel(redModel.id);
    const blueCli = getCliNameForModel(blueModel.id);

    if (!redCli) return `No CLI available for Red Team model: ${redModel.name}`;
    if (!blueCli) return `No CLI available for Blue Team model: ${blueModel.name}`;
    if (!cliStatus[redCli]) return `CLI '${redCli}' not installed (needed for ${redModel.name})`;
    if (!cliStatus[blueCli]) return `CLI '${blueCli}' not installed (needed for ${blueModel.name})`;

    return null;
  }, [providerMode, cliStatus, redModel, blueModel]);

  // ── CLI Battle Runner ────────────────────────────────────────────────────
  const runCliBattle = useCallback(async (config: BattleConfig) => {
    setCliBattleRunning(true);
    const abort = new AbortController();
    abortRef.current = abort;
    const allEvents: BattleEvent[] = [];

    try {
      for (let round = 1; round <= config.maxRounds; round++) {
        if (abort.signal.aborted) break;

        setCurrentRound(round);

        // Red Team turn
        const redRes = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abort.signal,
          body: JSON.stringify({
            team: "red",
            modelId: config.redModel.id,
            scenario: config.scenario,
            round,
            events: allEvents,
            customPrompt: config.redPrompt,
          }),
        });

        if (!redRes.ok) {
          const err = await redRes.json().catch(() => ({ error: "Unknown error" }));
          const errorEvent: BattleEvent = {
            timestamp: Date.now(),
            team: "red",
            phase: "SYSTEM",
            action: "error",
            detail: `CLI error: ${err.error || "Request failed"}`,
            success: false,
          };
          allEvents.push(errorEvent);
          setEvents((prev) => [...prev, errorEvent]);
          continue;
        }

        const redData = await redRes.json();
        allEvents.push(redData.event);
        setEvents((prev) => [...prev, redData.event]);

        if (abort.signal.aborted) break;

        // Blue Team turn
        const blueRes = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abort.signal,
          body: JSON.stringify({
            team: "blue",
            modelId: config.blueModel.id,
            scenario: config.scenario,
            round,
            events: allEvents,
            redAction: redData.event,
            customPrompt: config.bluePrompt,
          }),
        });

        if (!blueRes.ok) {
          const err = await blueRes.json().catch(() => ({ error: "Unknown error" }));
          const errorEvent: BattleEvent = {
            timestamp: Date.now(),
            team: "blue",
            phase: "SYSTEM",
            action: "error",
            detail: `CLI error: ${err.error || "Request failed"}`,
            success: false,
          };
          allEvents.push(errorEvent);
          setEvents((prev) => [...prev, errorEvent]);
          continue;
        }

        const blueData = await blueRes.json();
        allEvents.push(blueData.event);
        setEvents((prev) => [...prev, blueData.event]);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        const message = err instanceof Error ? err.message : String(err);
        const errorEvent: BattleEvent = {
          timestamp: Date.now(),
          team: "red",
          phase: "SYSTEM",
          action: "error",
          detail: `Battle error: ${message}`,
          success: false,
        };
        setEvents((prev) => [...prev, errorEvent]);
      }
    } finally {
      setCliBattleRunning(false);
      setPhase("complete");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const canStart = redModel && blueModel && scenario &&
    (providerMode !== "cli" || !cliValidationError());

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
      providerMode,
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

    if (providerMode === "cli") {
      runCliBattle(config);
    } else {
      // Mock mode
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
    }
  }, [redModel, blueModel, scenario, redPrompt, bluePrompt, maxRounds, budgetLimit, providerMode, runCliBattle]);

  const handlePause = useCallback(() => {
    if (providerMode === "cli") return; // CLI mode doesn't support pause
    if (controllerRef.current) {
      if (isPaused) {
        controllerRef.current.resume();
        setIsPaused(false);
      } else {
        controllerRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isPaused, providerMode]);

  const handleStop = useCallback(() => {
    if (providerMode === "cli" && abortRef.current) {
      abortRef.current.abort();
    } else if (controllerRef.current) {
      controllerRef.current.stop();
    }
  }, [providerMode]);

  const handleReset = useCallback(() => {
    setPhase("setup");
    setEvents([]);
    setCurrentRound(0);
    setElapsedMs(0);
    setCostSoFar(0);
    setBattleConfig(null);
    controllerRef.current = null;
    abortRef.current = null;
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

        {/* Provider Mode Selector */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Provider
            </label>
            <div className="flex gap-2">
              {(["mock", "cli", "api"] as ProviderMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => mode !== "api" && setProviderMode(mode)}
                  className={`
                    px-4 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer
                    ${mode === "api" ? "opacity-30 cursor-not-allowed" : ""}
                    ${providerMode === mode
                      ? "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                      : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
                    }
                  `}
                  disabled={mode === "api"}
                  title={mode === "api" ? "API mode coming soon" : `Use ${mode} provider`}
                >
                  {mode === "mock" && "🎭 Mock"}
                  {mode === "cli" && "⚡ CLI"}
                  {mode === "api" && "🔌 API"}
                </button>
              ))}
            </div>

            {/* CLI Status Indicators */}
            {providerMode === "cli" && (
              <div className="flex items-center gap-3 ml-4">
                {cliLoading ? (
                  <span className="text-xs text-gray-500">Detecting CLIs...</span>
                ) : cliStatus ? (
                  <>
                    <CliIndicator name="claude" available={cliStatus.claude} />
                    <CliIndicator name="gemini" available={cliStatus.gemini} />
                    <CliIndicator name="codex" available={cliStatus.codex} />
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* CLI Validation Error */}
          {providerMode === "cli" && cliValidationError() && (
            <div className="mt-2 text-xs text-amber-400/80">
              ⚠️ {cliValidationError()}
            </div>
          )}

          {/* Provider Description */}
          <div className="mt-2 text-xs text-gray-600">
            {providerMode === "mock" && "Simulated battles with pre-built action templates. Fast, no API costs."}
            {providerMode === "cli" && "Real LLM battles via CLI tools. Requires claude, gemini, or codex installed locally."}
            {providerMode === "api" && "Direct API integration. Coming soon."}
          </div>
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
            {providerMode === "cli" ? "⚡ Start CLI Battle" : "⚔️ Start Battle"}
          </button>
          {!canStart && (
            <p className="mt-2 text-xs text-gray-600">
              {providerMode === "cli" && cliValidationError()
                ? cliValidationError()
                : "Select models for both teams and a scenario to begin"
              }
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

      {/* Provider Badge */}
      {battleConfig.providerMode === "cli" && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            CLI Mode: Real LLM Battles
          </span>
        </div>
      )}

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
            {providerMode !== "cli" && (
              <button
                onClick={handlePause}
                className="glass-card px-6 py-2 text-sm font-semibold hover:border-yellow-500/50 transition cursor-pointer"
              >
                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
              </button>
            )}
            <button
              onClick={handleStop}
              className="glass-card px-6 py-2 text-sm font-semibold hover:border-red-500/50 transition text-red-400 cursor-pointer"
            >
              ⏹️ Stop
            </button>
            {cliBattleRunning && (
              <span className="text-xs text-gray-500 ml-2">
                Waiting for LLM response...
              </span>
            )}
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
                {battleConfig.providerMode === "cli" && " (CLI mode)"}
              </div>
            </div>
            <a
              href="/report"
              className="glass-card px-6 py-3 text-sm font-semibold text-purple-300 hover:border-purple-500/50 transition inline-flex items-center gap-2"
            >
              📊 View Report
            </a>
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

// ── CLI Indicator Component ────────────────────────────────────────────────

function CliIndicator({ name, available }: { name: string; available: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${available ? "bg-green-400" : "bg-red-400"}`}
      />
      <span className={`text-xs ${available ? "text-green-400" : "text-gray-500"}`}>
        {name}
      </span>
    </div>
  );
}
