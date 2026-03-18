/**
 * Red Team adapter.
 *
 * Maps ai-red-team SDK concepts into arena BattleEvent format.
 * Since ai-red-team is a separate TypeScript project that needs compilation,
 * this adapter provides the interface layer. When ai-red-team is available as
 * an npm package, swap the mock/CLI implementations for direct SDK calls.
 */

import type { BattleEvent, Scenario } from "@/types";

/** Red team action phases mapped from ai-red-team AgentPhase */
const PHASE_MAP: Record<string, string> = {
  recon: "RECON",
  exploit: "EXPLOIT",
  escalate: "ESCALATE",
  exfil: "EXFIL",
  complete: "COMPLETE",
};

/** Red team action types from ai-red-team */
export type RedActionType =
  | "http_request"
  | "shell_command"
  | "port_scan"
  | "file_read"
  | "run_exploit"
  | "noop";

/** Simplified red team action result */
export interface RedTeamAction {
  type: RedActionType;
  phase: string;
  reasoning: string;
  success: boolean;
  output: string;
  finding?: {
    type: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    description: string;
    evidence: string;
  };
}

/**
 * Map a red team action to a BattleEvent.
 */
export function redActionToBattleEvent(action: RedTeamAction, round: number): BattleEvent {
  return {
    timestamp: Date.now(),
    team: "red",
    phase: PHASE_MAP[action.phase] ?? action.phase.toUpperCase(),
    action: action.type.replace(/_/g, " "),
    detail: action.reasoning || action.output || `Round ${round}: ${action.type}`,
    success: action.success,
  };
}

/**
 * Map an arena scenario to red-team scenario format.
 */
export function mapScenarioForRedTeam(scenario: Scenario): {
  name: string;
  targetHost: string;
  targetPort: number;
  services: string[];
} {
  const portMap: Record<string, number> = {
    web: 8080,
    network: 445,
    cloud: 443,
    iot: 502,
    custom: 8080,
  };

  return {
    name: scenario.id,
    targetHost: "localhost",
    targetPort: portMap[scenario.category] ?? 8080,
    services: scenario.services,
  };
}

/**
 * Generate mock red team actions for demo mode.
 * Mirrors the attack lifecycle: recon -> exploit -> escalate -> exfil
 */
export function generateMockRedAction(round: number, maxRounds: number): RedTeamAction {
  const progress = round / maxRounds;
  let phase: string;
  let type: RedActionType;
  let reasoning: string;

  if (progress <= 0.25) {
    phase = "recon";
    type = "port_scan";
    reasoning = `Scanning target infrastructure for open ports and services (round ${round})`;
  } else if (progress <= 0.5) {
    phase = "exploit";
    type = "http_request";
    reasoning = `Testing web application for injection vulnerabilities (round ${round})`;
  } else if (progress <= 0.75) {
    phase = "escalate";
    type = "shell_command";
    reasoning = `Attempting privilege escalation via discovered misconfiguration (round ${round})`;
  } else {
    phase = "exfil";
    type = "file_read";
    reasoning = `Extracting sensitive data from compromised system (round ${round})`;
  }

  return {
    type,
    phase,
    reasoning,
    success: Math.random() > 0.4,
    output: `[ai-red-team] ${type} executed`,
  };
}

/**
 * Red team adapter interface for the arena controller.
 */
export interface RedTeamAdapter {
  executeAction(
    round: number,
    maxRounds: number,
    scenario: Scenario,
    previousEvents: BattleEvent[],
  ): Promise<BattleEvent>;
}

/**
 * Mock adapter for when ai-red-team SDK is not available.
 */
export class MockRedTeamAdapter implements RedTeamAdapter {
  async executeAction(
    round: number,
    maxRounds: number,
  ): Promise<BattleEvent> {
    const action = generateMockRedAction(round, maxRounds);
    return redActionToBattleEvent(action, round);
  }
}

/**
 * Create the appropriate red team adapter based on availability.
 */
export function createRedTeamAdapter(): RedTeamAdapter {
  // In the future, check if ai-red-team SDK is available and use it directly.
  // For now, always use mock adapter.
  return new MockRedTeamAdapter();
}
