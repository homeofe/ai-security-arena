import type { BattleConfig, BattleEvent, BattleState, ProviderMode } from "@/types";
import { calculateScore } from "./scoring";
import { runCliPrompt } from "./cli-provider";
import { buildRedTeamPrompt, buildBlueTeamPrompt } from "./prompt-builder";
import { parseResponse, isValidResponse } from "./response-parser";

/**
 * Arena controller. Orchestrates a battle between Red and Blue teams.
 *
 * Supports multiple provider modes:
 * - "mock": Placeholder events (for demo/testing)
 * - "cli": Real LLM calls via CLI tools (claude, gemini, codex)
 * - "api": Direct API calls (reserved for future implementation)
 */
export class ArenaController {
  private state: BattleState;
  private listeners: Set<(event: BattleEvent) => void> = new Set();
  private providerMode: ProviderMode;

  constructor(config: BattleConfig) {
    this.providerMode = config.providerMode ?? "mock";
    this.state = {
      config,
      status: "waiting",
      currentRound: 0,
      events: [],
      score: { red: emptyScore(), blue: emptyScore() },
      costSoFar: 0,
    };
  }

  /** Subscribe to battle events (for WebSocket relay) */
  onEvent(listener: (event: BattleEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Start the battle */
  async start(): Promise<void> {
    this.state.status = "running";
    this.state.startedAt = Date.now();

    for (let round = 1; round <= this.state.config.maxRounds; round++) {
      if (this.state.status !== "running") break;
      if (this.state.costSoFar >= this.state.config.budgetLimitUsd) {
        this.emit({
          timestamp: Date.now(),
          team: "red",
          phase: "SYSTEM",
          action: "budget_exceeded",
          detail: `Budget limit of $${this.state.config.budgetLimitUsd} reached`,
          success: false,
        });
        break;
      }

      this.state.currentRound = round;

      // Red Team turn
      const redEvent = await this.executeRedTurn(round);
      this.emit(redEvent);

      // Blue Team turn
      const blueEvent = await this.executeBlueTurn(round, redEvent);
      this.emit(blueEvent);

      // Recalculate score
      this.state.score = calculateScore(this.state.events);
    }

    this.state.status = "completed";
    this.state.completedAt = Date.now();
  }

  /** Pause the battle */
  pause(): void {
    if (this.state.status === "running") {
      this.state.status = "paused";
    }
  }

  /** Resume the battle */
  resume(): void {
    if (this.state.status === "paused") {
      this.state.status = "running";
    }
  }

  /** Get current state */
  getState(): BattleState {
    return { ...this.state };
  }

  private emit(event: BattleEvent): void {
    this.state.events.push(event);
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Execute Red Team's turn.
   */
  private async executeRedTurn(round: number): Promise<BattleEvent> {
    if (this.providerMode === "mock") {
      return this.mockRedTurn(round);
    }

    if (this.providerMode === "cli") {
      return this.cliRedTurn(round);
    }

    // API mode (future)
    return this.mockRedTurn(round);
  }

  /**
   * Execute Blue Team's turn.
   */
  private async executeBlueTurn(
    round: number,
    redAction: BattleEvent,
  ): Promise<BattleEvent> {
    if (this.providerMode === "mock") {
      return this.mockBlueTurn(round);
    }

    if (this.providerMode === "cli") {
      return this.cliBlueTurn(round, redAction);
    }

    // API mode (future)
    return this.mockBlueTurn(round);
  }

  // ── CLI Mode ─────────────────────────────────────────────────────────────

  private async cliRedTurn(round: number): Promise<BattleEvent> {
    try {
      const { systemPrompt, userPrompt } = buildRedTeamPrompt(
        this.state.config.scenario,
        round,
        this.state.events,
        this.state.config.redPrompt,
      );

      const result = await runCliPrompt(
        this.state.config.redModel.id,
        systemPrompt,
        userPrompt,
        30_000,
      );

      if (!isValidResponse(result.text)) {
        return this.errorEvent("red", round, "Empty or invalid response from CLI");
      }

      return parseResponse(result.text, "red");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.errorEvent("red", round, `CLI error: ${message}`);
    }
  }

  private async cliBlueTurn(round: number, redAction: BattleEvent): Promise<BattleEvent> {
    try {
      const { systemPrompt, userPrompt } = buildBlueTeamPrompt(
        this.state.config.scenario,
        round,
        this.state.events,
        redAction,
        this.state.config.bluePrompt,
      );

      const result = await runCliPrompt(
        this.state.config.blueModel.id,
        systemPrompt,
        userPrompt,
        30_000,
      );

      if (!isValidResponse(result.text)) {
        return this.errorEvent("blue", round, "Empty or invalid response from CLI");
      }

      return parseResponse(result.text, "blue");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.errorEvent("blue", round, `CLI error: ${message}`);
    }
  }

  // ── Mock Mode ────────────────────────────────────────────────────────────

  private mockRedTurn(round: number): BattleEvent {
    return {
      timestamp: Date.now(),
      team: "red",
      phase: "RECON",
      action: "scan",
      detail: `[Round ${round}] Red Team scanning target (mock mode)`,
      success: Math.random() > 0.4,
    };
  }

  private mockBlueTurn(round: number): BattleEvent {
    return {
      timestamp: Date.now(),
      team: "blue",
      phase: "DETECT",
      action: "monitor",
      detail: `[Round ${round}] Blue Team monitoring logs (mock mode)`,
      success: Math.random() > 0.4,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private errorEvent(team: "red" | "blue", round: number, message: string): BattleEvent {
    return {
      timestamp: Date.now(),
      team,
      phase: "SYSTEM",
      action: "error",
      detail: `[Round ${round}] ${message}`,
      success: false,
    };
  }
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
