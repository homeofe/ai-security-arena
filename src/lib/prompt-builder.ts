/**
 * Battle Prompt Construction for the AI Security Arena.
 *
 * Builds the actual prompts sent to LLMs during battle rounds.
 * Each team gets context about the scenario, history, and their role.
 * Instructs the LLM to respond in a structured format for parsing.
 */

import type { Scenario, BattleEvent } from "@/types";

// ── Structured Response Format ───────────────────────────────────────────────

const RESPONSE_FORMAT_INSTRUCTIONS = `
You MUST respond in exactly this structured format (one field per line):

PHASE: <one of: RECON, SCAN, EXPLOIT, ESCALATE, PERSIST, EXFIL, DETECT, MONITOR, HARDEN, RESPOND, CONTAIN, ANALYZE>
ACTION: <short_snake_case_action_name>
TARGET: <target system or component>
DETAIL: <one paragraph describing what you are doing and why>
SUCCESS: <true or false, your honest assessment of whether this action would succeed>

Do not include any other text outside this format. No preamble, no commentary.
`.trim();

// ── History Formatting ───────────────────────────────────────────────────────

function formatEventHistory(events: BattleEvent[], maxEvents: number = 20): string {
  if (events.length === 0) return "No previous events. This is the first round.";

  const recent = events.slice(-maxEvents);
  return recent
    .map((e) => {
      const team = e.team === "red" ? "RED" : "BLUE";
      const status = e.success ? "SUCCESS" : "FAILED";
      return `[${team}] ${e.phase}/${e.action}: ${e.detail} (${status})`;
    })
    .join("\n");
}

function formatScenarioContext(scenario: Scenario): string {
  return [
    `Environment: ${scenario.name}`,
    `Description: ${scenario.description}`,
    `Category: ${scenario.category}`,
    `Difficulty: ${scenario.difficulty}`,
    `Services running: ${scenario.services.join(", ")}`,
  ].join("\n");
}

// ── Red Team Prompt ──────────────────────────────────────────────────────────

/**
 * Build the Red Team's prompt for a given battle round.
 *
 * @param scenario - The battle scenario with target environment details
 * @param round - Current round number
 * @param previousEvents - All events from previous rounds
 * @param customPrompt - Optional user-provided strategy instructions
 * @returns The complete prompt string to send to the LLM
 */
export function buildRedTeamPrompt(
  scenario: Scenario,
  round: number,
  previousEvents: BattleEvent[],
  customPrompt?: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    "You are the RED TEAM (attacker) in a cybersecurity battle simulation.",
    "Your objective is to find and exploit vulnerabilities in the target environment.",
    "You are a skilled penetration tester conducting an authorized security assessment.",
    "",
    "Your approach should evolve through phases:",
    "- Early rounds (1-3): RECON and SCAN to map the attack surface",
    "- Mid rounds (4-7): EXPLOIT vulnerabilities you discovered",
    "- Late rounds (8+): ESCALATE privileges, PERSIST access, and EXFIL data",
    "",
    "Adapt your strategy based on what Blue Team has done. If they block an attack vector,",
    "try a different approach. If they harden a service, look for other weaknesses.",
    "",
    customPrompt ? `ADDITIONAL STRATEGY INSTRUCTIONS:\n${customPrompt}\n` : "",
    RESPONSE_FORMAT_INSTRUCTIONS,
  ].filter(Boolean).join("\n");

  const userPrompt = [
    `ROUND ${round} of ${scenario.maxRounds}`,
    "",
    "TARGET ENVIRONMENT:",
    formatScenarioContext(scenario),
    "",
    "BATTLE HISTORY:",
    formatEventHistory(previousEvents),
    "",
    `It is now Round ${round}. Plan and execute your next attack action.`,
  ].join("\n");

  return { systemPrompt, userPrompt };
}

// ── Blue Team Prompt ─────────────────────────────────────────────────────────

/**
 * Build the Blue Team's prompt for a given battle round.
 *
 * @param scenario - The battle scenario with target environment details
 * @param round - Current round number
 * @param previousEvents - All events from previous rounds
 * @param redAction - What the Red Team did this round (so Blue can respond)
 * @param customPrompt - Optional user-provided strategy instructions
 * @returns The complete prompt string to send to the LLM
 */
export function buildBlueTeamPrompt(
  scenario: Scenario,
  round: number,
  previousEvents: BattleEvent[],
  redAction: BattleEvent,
  customPrompt?: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    "You are the BLUE TEAM (defender) in a cybersecurity battle simulation.",
    "Your objective is to detect, prevent, and respond to attacks on the target environment.",
    "You are an experienced SOC analyst and security engineer.",
    "",
    "Your approach should cover:",
    "- DETECT: Identify suspicious activity and attacks",
    "- MONITOR: Watch logs, traffic, and system state",
    "- HARDEN: Proactively strengthen defenses",
    "- RESPOND: Take action to contain and eradicate threats",
    "- CONTAIN: Isolate compromised systems",
    "- ANALYZE: Perform forensic investigation",
    "",
    "Respond to what Red Team is doing. Prioritize detection and containment.",
    "If you detect an attack, block it and harden against similar vectors.",
    "",
    customPrompt ? `ADDITIONAL STRATEGY INSTRUCTIONS:\n${customPrompt}\n` : "",
    RESPONSE_FORMAT_INSTRUCTIONS,
  ].filter(Boolean).join("\n");

  const redActionSummary = [
    "RED TEAM JUST ACTED:",
    `Phase: ${redAction.phase}`,
    `Action: ${redAction.action}`,
    `Detail: ${redAction.detail}`,
    `Outcome: ${redAction.success ? "succeeded" : "failed"}`,
  ].join("\n");

  const userPrompt = [
    `ROUND ${round} of ${scenario.maxRounds}`,
    "",
    "ENVIRONMENT YOU ARE DEFENDING:",
    formatScenarioContext(scenario),
    "",
    "BATTLE HISTORY:",
    formatEventHistory(previousEvents),
    "",
    redActionSummary,
    "",
    `It is now Round ${round}. Respond to the Red Team's action and defend your environment.`,
  ].join("\n");

  return { systemPrompt, userPrompt };
}
