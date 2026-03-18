import type { BattleConfig, BattleEvent, BattleState } from "@/types";
import { calculateScore } from "./scoring";

/**
 * Arena controller. Orchestrates a battle between Red and Blue teams.
 *
 * TODO: Integrate ai-red-team and ai-blue-team as library imports.
 * For now, this is a placeholder that defines the control flow.
 */
export class ArenaController {
  private state: BattleState;
  private listeners: Set<(event: BattleEvent) => void> = new Set();

  constructor(config: BattleConfig) {
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

      // TODO: Replace with actual ai-red-team and ai-blue-team calls
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
   * TODO: Call ai-red-team library with the configured model and prompt.
   */
  private async executeRedTurn(round: number): Promise<BattleEvent> {
    // Placeholder
    return {
      timestamp: Date.now(),
      team: "red",
      phase: "RECON",
      action: "scan",
      detail: `[Round ${round}] Red Team scanning target (placeholder)`,
      success: false,
    };
  }

  /**
   * Execute Blue Team's turn.
   * TODO: Call ai-blue-team library with the configured model, prompt, and Red's action.
   */
  private async executeBlueTurn(
    round: number,
    _redAction: BattleEvent,
  ): Promise<BattleEvent> {
    // Placeholder
    return {
      timestamp: Date.now(),
      team: "blue",
      phase: "DETECT",
      action: "monitor",
      detail: `[Round ${round}] Blue Team monitoring logs (placeholder)`,
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
