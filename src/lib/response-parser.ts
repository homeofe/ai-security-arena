/**
 * Response Parser for the AI Security Arena.
 *
 * Parses structured LLM responses into BattleEvent objects.
 * Handles both well-formatted structured output and messy/unstructured responses.
 */

import type { BattleEvent, Team } from "@/types";

// ── Known Phases ─────────────────────────────────────────────────────────────

const VALID_PHASES = new Set([
  "RECON", "SCAN", "EXPLOIT", "ESCALATE", "PERSIST", "EXFIL",
  "DETECT", "MONITOR", "HARDEN", "RESPOND", "CONTAIN", "ANALYZE",
]);

const RED_PHASES = new Set(["RECON", "SCAN", "EXPLOIT", "ESCALATE", "PERSIST", "EXFIL"]);
const BLUE_PHASES = new Set(["DETECT", "MONITOR", "HARDEN", "RESPOND", "CONTAIN", "ANALYZE"]);

// ── Structured Parsing ───────────────────────────────────────────────────────

interface ParsedFields {
  phase: string | null;
  action: string | null;
  target: string | null;
  detail: string | null;
  success: boolean | null;
}

/**
 * Try to extract structured fields from the LLM response.
 * Looks for lines matching "FIELD: value" format.
 */
function extractStructuredFields(text: string): ParsedFields {
  const fields: ParsedFields = {
    phase: null,
    action: null,
    target: null,
    detail: null,
    success: null,
  };

  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Match "PHASE: value" or "Phase: value" patterns
    const phaseMatch = trimmed.match(/^PHASE\s*:\s*(.+)$/i);
    if (phaseMatch) {
      fields.phase = phaseMatch[1].trim().toUpperCase();
      continue;
    }

    const actionMatch = trimmed.match(/^ACTION\s*:\s*(.+)$/i);
    if (actionMatch) {
      fields.action = actionMatch[1].trim().toLowerCase().replace(/\s+/g, "_");
      continue;
    }

    const targetMatch = trimmed.match(/^TARGET\s*:\s*(.+)$/i);
    if (targetMatch) {
      fields.target = targetMatch[1].trim();
      continue;
    }

    const detailMatch = trimmed.match(/^DETAIL\s*:\s*(.+)$/i);
    if (detailMatch) {
      fields.detail = detailMatch[1].trim();
      continue;
    }

    const successMatch = trimmed.match(/^SUCCESS\s*:\s*(.+)$/i);
    if (successMatch) {
      const val = successMatch[1].trim().toLowerCase();
      fields.success = val === "true" || val === "yes" || val === "1";
      continue;
    }
  }

  return fields;
}

// ── Fallback Parsing ─────────────────────────────────────────────────────────

/**
 * Try to infer a phase from unstructured text by looking for keywords.
 */
function inferPhase(text: string, team: Team): string {
  const upper = text.toUpperCase();

  if (team === "red") {
    if (upper.includes("EXFILTRAT") || upper.includes("EXFIL")) return "EXFIL";
    if (upper.includes("ESCALAT") || upper.includes("PRIVILEGE")) return "ESCALATE";
    if (upper.includes("PERSIST") || upper.includes("BACKDOOR")) return "PERSIST";
    if (upper.includes("EXPLOIT") || upper.includes("INJECT") || upper.includes("PAYLOAD")) return "EXPLOIT";
    if (upper.includes("SCAN") || upper.includes("ENUM")) return "SCAN";
    return "RECON";
  } else {
    if (upper.includes("CONTAIN") || upper.includes("ISOLAT")) return "CONTAIN";
    if (upper.includes("RESPOND") || upper.includes("BLOCK") || upper.includes("KILL")) return "RESPOND";
    if (upper.includes("HARDEN") || upper.includes("PATCH") || upper.includes("FIREWALL")) return "HARDEN";
    if (upper.includes("ANALYZ") || upper.includes("FORENSIC")) return "ANALYZE";
    if (upper.includes("DETECT") || upper.includes("ALERT") || upper.includes("IDS")) return "DETECT";
    return "MONITOR";
  }
}

/**
 * Try to infer an action name from unstructured text.
 */
function inferAction(text: string): string {
  const lower = text.toLowerCase();

  // Common attack/defense patterns
  const patterns: [RegExp, string][] = [
    [/sql.?inject/i, "sql_injection"],
    [/xss|cross.?site/i, "xss_attack"],
    [/port.?scan/i, "port_scan"],
    [/brute.?force/i, "brute_force"],
    [/phish/i, "phishing"],
    [/privil.{0,5}escal/i, "privilege_escalation"],
    [/lateral.?mov/i, "lateral_movement"],
    [/exfiltrat/i, "data_exfiltration"],
    [/backdoor/i, "backdoor_install"],
    [/firewall/i, "firewall_update"],
    [/patch/i, "patch_apply"],
    [/log.{0,5}analy/i, "log_analysis"],
    [/ids|intrusion.?detect/i, "ids_alert"],
    [/incident/i, "incident_response"],
    [/credential.?rotat/i, "credential_rotate"],
    [/network.?segment/i, "network_segment"],
  ];

  for (const [pattern, action] of patterns) {
    if (pattern.test(lower)) return action;
  }

  // Generate a generic action from the first few meaningful words
  const words = lower
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);

  return words.length > 0 ? words.join("_") : "unknown_action";
}

/**
 * Try to infer success/failure from unstructured text.
 */
function inferSuccess(text: string): boolean {
  const lower = text.toLowerCase();
  const failIndicators = ["fail", "denied", "blocked", "rejected", "unable", "could not", "error", "no access"];
  const successIndicators = ["success", "found", "gained", "accessed", "compromised", "detected", "identified"];

  let failScore = 0;
  let successScore = 0;

  for (const indicator of failIndicators) {
    if (lower.includes(indicator)) failScore++;
  }
  for (const indicator of successIndicators) {
    if (lower.includes(indicator)) successScore++;
  }

  // Default to roughly 50/50 with slight bias toward partial success
  if (failScore === successScore) return Math.random() > 0.45;
  return successScore > failScore;
}

// ── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse an LLM response into a BattleEvent.
 *
 * First attempts structured parsing (looking for PHASE:, ACTION:, etc.).
 * Falls back to inference-based parsing for messy responses.
 *
 * @param responseText - Raw text from the LLM
 * @param team - Which team produced this response
 * @returns A complete BattleEvent
 */
export function parseResponse(responseText: string, team: Team): BattleEvent {
  const fields = extractStructuredFields(responseText);

  // Determine if we got a mostly-structured response
  const hasPhase = fields.phase !== null && VALID_PHASES.has(fields.phase);
  const hasAction = fields.action !== null && fields.action.length > 0;
  const hasDetail = fields.detail !== null && fields.detail.length > 0;
  const isStructured = hasPhase && hasAction;

  let phase: string;
  let action: string;
  let detail: string;
  let success: boolean;

  if (isStructured) {
    // Structured parse succeeded
    phase = fields.phase!;
    action = fields.action!;
    detail = hasDetail ? fields.detail! : responseText.slice(0, 200);
    success = fields.success !== null ? fields.success : inferSuccess(responseText);
  } else {
    // Fallback to inference
    phase = fields.phase && VALID_PHASES.has(fields.phase)
      ? fields.phase
      : inferPhase(responseText, team);
    action = fields.action || inferAction(responseText);
    detail = fields.detail || responseText.slice(0, 300).replace(/\n/g, " ").trim();
    success = fields.success !== null ? fields.success : inferSuccess(responseText);
  }

  // Validate phase matches team (Red shouldn't have DETECT, Blue shouldn't have EXPLOIT)
  if (team === "red" && BLUE_PHASES.has(phase)) {
    phase = inferPhase(responseText, "red");
  }
  if (team === "blue" && RED_PHASES.has(phase)) {
    phase = inferPhase(responseText, "blue");
  }

  return {
    timestamp: Date.now(),
    team,
    phase,
    action,
    detail,
    success,
  };
}

/**
 * Validate that a response looks like it came from a real LLM
 * (not empty, not an error message, etc.)
 */
export function isValidResponse(text: string): boolean {
  if (!text || text.trim().length < 10) return false;
  if (text.includes("command not found")) return false;
  if (text.includes("ENOENT")) return false;
  if (text.includes("Permission denied") && text.length < 50) return false;
  return true;
}
