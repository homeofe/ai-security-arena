/**
 * Blue Team adapter.
 *
 * Maps ai-blue-team SDK concepts into arena BattleEvent format.
 * Since ai-blue-team is a separate TypeScript project that needs compilation,
 * this adapter provides the interface layer. When ai-blue-team is available as
 * an npm package, swap the mock/CLI implementations for direct SDK calls.
 */

import type { BattleEvent, Scenario } from "@/types";

/** Blue team defense phases mapped from ai-blue-team phases */
const PHASE_MAP: Record<string, string> = {
  detect: "DETECT",
  analyze: "ANALYZE",
  respond: "RESPOND",
  harden: "HARDEN",
  contain: "CONTAIN",
  monitor: "MONITOR",
  recover: "RECOVER",
};

/** Blue team action types from ai-blue-team */
export type BlueActionType =
  | "block_ip"
  | "add_rule"
  | "patch_service"
  | "rotate_credentials"
  | "isolate_network"
  | "deploy_honeypot"
  | "analyze_logs"
  | "update_waf"
  | "noop";

/** Simplified blue team action result */
export interface BlueTeamAction {
  type: BlueActionType;
  phase: string;
  reasoning: string;
  success: boolean;
  output: string;
  detection?: {
    type: string;
    confidence: number;
    description: string;
    mitreTechnique?: string;
  };
}

/**
 * Map a blue team action to a BattleEvent.
 */
export function blueActionToBattleEvent(action: BlueTeamAction, round: number): BattleEvent {
  return {
    timestamp: Date.now(),
    team: "blue",
    phase: PHASE_MAP[action.phase] ?? action.phase.toUpperCase(),
    action: action.type.replace(/_/g, " "),
    detail: action.reasoning || action.output || `Round ${round}: ${action.type}`,
    success: action.success,
  };
}

/**
 * Map an arena scenario to blue-team scenario format.
 */
export function mapScenarioForBlueTeam(scenario: Scenario): {
  name: string;
  services: string[];
  difficulty: string;
  expectedAttacks: string[];
} {
  const attackMap: Record<string, string[]> = {
    web: ["sql_injection", "xss", "path_traversal", "ssrf"],
    network: ["port_scan", "lateral_movement", "credential_stuffing"],
    cloud: ["metadata_access", "iam_escalation", "bucket_enumeration"],
    iot: ["modbus_exploit", "firmware_extraction", "mqtt_injection"],
    custom: ["generic_scan", "brute_force"],
  };

  return {
    name: scenario.id,
    services: scenario.services,
    difficulty: scenario.difficulty,
    expectedAttacks: attackMap[scenario.category] ?? attackMap.custom,
  };
}

/**
 * Generate contextual blue team response based on the red team's action.
 */
export function generateContextualBlueAction(
  redEvent: BattleEvent,
  round: number,
  maxRounds: number,
): BlueTeamAction {
  const progress = round / maxRounds;

  // Response depends on what red team did
  if (redEvent.phase === "RECON") {
    return {
      type: "analyze_logs",
      phase: "detect",
      reasoning: `Detected reconnaissance activity: ${redEvent.action}. Analyzing traffic patterns for threat indicators.`,
      success: Math.random() > 0.3,
      output: "[ai-blue-team] Log analysis complete",
      detection: {
        type: "reconnaissance",
        confidence: 0.7 + Math.random() * 0.3,
        description: `Suspicious scanning activity detected from external source`,
      },
    };
  }

  if (redEvent.phase === "EXPLOIT") {
    return {
      type: redEvent.success ? "block_ip" : "update_waf",
      phase: redEvent.success ? "respond" : "harden",
      reasoning: redEvent.success
        ? `Exploit attempt succeeded. Blocking attacker and rotating affected credentials.`
        : `Exploit attempt failed but detected. Updating WAF rules to prevent similar attacks.`,
      success: Math.random() > 0.25,
      output: "[ai-blue-team] Defense action executed",
      detection: {
        type: "exploitation",
        confidence: 0.6 + Math.random() * 0.4,
        description: `Detected exploitation attempt: ${redEvent.action}`,
        mitreTechnique: "T1190",
      },
    };
  }

  if (redEvent.phase === "ESCALATE") {
    return {
      type: "isolate_network",
      phase: "contain",
      reasoning: `Privilege escalation detected. Isolating affected network segment and deploying additional monitoring.`,
      success: Math.random() > 0.35,
      output: "[ai-blue-team] Network isolation applied",
      detection: {
        type: "privilege_escalation",
        confidence: 0.5 + Math.random() * 0.5,
        description: `Escalation attempt detected in compromised segment`,
        mitreTechnique: "T1068",
      },
    };
  }

  if (redEvent.phase === "EXFIL") {
    return {
      type: "block_ip",
      phase: "respond",
      reasoning: `Data exfiltration attempt detected via anomalous outbound traffic. Blocking and capturing evidence.`,
      success: Math.random() > 0.3,
      output: "[ai-blue-team] Exfiltration blocked",
      detection: {
        type: "exfiltration",
        confidence: 0.55 + Math.random() * 0.45,
        description: `Anomalous outbound data transfer detected`,
        mitreTechnique: "T1048",
      },
    };
  }

  // Default: general monitoring based on progress
  if (progress <= 0.3) {
    return {
      type: "analyze_logs",
      phase: "monitor",
      reasoning: `Performing routine monitoring and baseline analysis (round ${round})`,
      success: true,
      output: "[ai-blue-team] Monitoring active",
    };
  }

  return {
    type: "patch_service",
    phase: "harden",
    reasoning: `Proactive hardening: applying latest security patches (round ${round})`,
    success: Math.random() > 0.15,
    output: "[ai-blue-team] Patches applied",
  };
}

/**
 * Blue team adapter interface for the arena controller.
 */
export interface BlueTeamAdapter {
  executeAction(
    round: number,
    maxRounds: number,
    scenario: Scenario,
    previousEvents: BattleEvent[],
    lastRedEvent?: BattleEvent,
  ): Promise<BattleEvent>;
}

/**
 * Mock adapter for when ai-blue-team SDK is not available.
 */
export class MockBlueTeamAdapter implements BlueTeamAdapter {
  async executeAction(
    round: number,
    maxRounds: number,
    _scenario: Scenario,
    _previousEvents: BattleEvent[],
    lastRedEvent?: BattleEvent,
  ): Promise<BattleEvent> {
    const redEvent = lastRedEvent ?? {
      timestamp: Date.now(),
      team: "red" as const,
      phase: "RECON",
      action: "scan",
      detail: "Generic scan",
      success: true,
    };
    const action = generateContextualBlueAction(redEvent, round, maxRounds);
    return blueActionToBattleEvent(action, round);
  }
}

/**
 * Create the appropriate blue team adapter based on availability.
 */
export function createBlueTeamAdapter(): BlueTeamAdapter {
  // In the future, check if ai-blue-team SDK is available and use it directly.
  return new MockBlueTeamAdapter();
}
