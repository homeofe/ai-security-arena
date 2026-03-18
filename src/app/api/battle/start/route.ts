import { NextResponse } from "next/server";
import type { BattleConfig, BattleEvent } from "@/types";
import { eventBus } from "@/lib/event-bus";
import { calculateScore } from "@/lib/scoring";
import { runCliPrompt, isModelAvailable, detectAvailableClis } from "@/lib/cli-provider";
import { buildRedTeamPrompt, buildBlueTeamPrompt } from "@/lib/prompt-builder";
import { parseResponse, isValidResponse } from "@/lib/response-parser";

// Active battles tracked in memory
const activeBattles = new Map<string, { status: string; abort: AbortController }>();

/**
 * POST /api/battle/start
 *
 * Start a full battle. Events are streamed via the SSE /api/events endpoint.
 * Returns immediately with the battle ID.
 */
export async function POST(request: Request) {
  try {
    const config: BattleConfig = await request.json();

    if (!config.id || !config.scenario || !config.redModel || !config.blueModel) {
      return NextResponse.json(
        { error: "Missing required battle config fields" },
        { status: 400 },
      );
    }

    // For CLI mode, validate tools are available
    if (config.providerMode === "cli") {
      const cliStatus = detectAvailableClis();
      if (!isModelAvailable(config.redModel.id, cliStatus)) {
        return NextResponse.json(
          { error: `CLI not available for red model: ${config.redModel.id}` },
          { status: 400 },
        );
      }
      if (!isModelAvailable(config.blueModel.id, cliStatus)) {
        return NextResponse.json(
          { error: `CLI not available for blue model: ${config.blueModel.id}` },
          { status: 400 },
        );
      }
    }

    const abort = new AbortController();
    activeBattles.set(config.id, { status: "running", abort });

    // Run battle asynchronously
    runBattle(config, abort.signal).catch(() => {
      // Error handled inside runBattle
    });

    return NextResponse.json({ battleId: config.id, status: "started" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to start battle: ${message}` },
      { status: 500 },
    );
  }
}

async function runBattle(config: BattleConfig, signal: AbortSignal): Promise<void> {
  const events: BattleEvent[] = [];

  eventBus.emit({
    type: "battle:start",
    battleId: config.id,
    data: {
      config,
      status: "running",
      currentRound: 0,
      events: [],
      score: { red: emptyScore(), blue: emptyScore() },
      costSoFar: 0,
    },
  });

  try {
    for (let round = 1; round <= config.maxRounds; round++) {
      if (signal.aborted) break;

      eventBus.emit({
        type: "battle:round",
        battleId: config.id,
        data: { round },
      });

      // Red Team turn
      const redEvent = await executeTurn(config, "red", round, events);
      events.push(redEvent);
      eventBus.emit({ type: "battle:event", battleId: config.id, data: redEvent });

      if (signal.aborted) break;

      // Blue Team turn
      const blueEvent = await executeTurn(config, "blue", round, events, redEvent);
      events.push(blueEvent);
      eventBus.emit({ type: "battle:event", battleId: config.id, data: blueEvent });

      // Emit updated score
      const score = calculateScore(events);
      eventBus.emit({ type: "battle:score", battleId: config.id, data: score });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    eventBus.emit({
      type: "battle:error",
      battleId: config.id,
      data: { error: message },
    });
  }

  // Battle complete
  const finalScore = calculateScore(events);
  eventBus.emit({
    type: "battle:end",
    battleId: config.id,
    data: {
      config,
      status: "completed",
      currentRound: config.maxRounds,
      events,
      score: finalScore,
      costSoFar: events.length * (config.providerMode === "cli" ? 0.012 : 0.0023),
    },
  });

  activeBattles.delete(config.id);
  // Clean up subscribers after a delay
  setTimeout(() => eventBus.cleanup(config.id), 60_000);
}

async function executeTurn(
  config: BattleConfig,
  team: "red" | "blue",
  round: number,
  events: BattleEvent[],
  redAction?: BattleEvent,
): Promise<BattleEvent> {
  if (config.providerMode === "mock") {
    return mockTurn(team, round);
  }

  // CLI mode
  try {
    const model = team === "red" ? config.redModel : config.blueModel;
    let systemPrompt: string;
    let userPrompt: string;

    if (team === "red") {
      const prompts = buildRedTeamPrompt(
        config.scenario,
        round,
        events,
        config.redPrompt,
      );
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    } else {
      const prompts = buildBlueTeamPrompt(
        config.scenario,
        round,
        events,
        redAction!,
        config.bluePrompt,
      );
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }

    const result = await runCliPrompt(model.id, systemPrompt, userPrompt, 30_000);

    if (!isValidResponse(result.text)) {
      return errorEvent(team, round, "Empty or invalid CLI response");
    }

    return parseResponse(result.text, team);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorEvent(team, round, `CLI error: ${message}`);
  }
}

function mockTurn(team: "red" | "blue", round: number): BattleEvent {
  const phases = team === "red"
    ? ["RECON", "EXPLOIT", "ESCALATE", "EXFIL"]
    : ["DETECT", "HARDEN", "RESPOND", "CONTAIN"];

  const phase = phases[Math.min(Math.floor((round - 1) / 3), phases.length - 1)];
  const actions = team === "red"
    ? ["scan", "inject", "probe", "exploit"]
    : ["monitor", "block", "patch", "isolate"];
  const action = actions[Math.floor(Math.random() * actions.length)];

  return {
    timestamp: Date.now(),
    team,
    phase,
    action,
    detail: `[Round ${round}] ${team === "red" ? "Red" : "Blue"} Team ${action} (mock)`,
    success: Math.random() > 0.4,
  };
}

function errorEvent(team: "red" | "blue", round: number, message: string): BattleEvent {
  return {
    timestamp: Date.now(),
    team,
    phase: "SYSTEM",
    action: "error",
    detail: `[Round ${round}] ${message}`,
    success: false,
  };
}

function emptyScore() {
  return {
    points: 0,
    attacksLanded: 0,
    attacksBlocked: 0,
    detectionsCorrect: 0,
    detectionsMissed: 0,
    avgResponseTimeMs: 0,
  };
}
