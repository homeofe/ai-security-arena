// ── Models ────────────────────────────────────────────────────────────────────

export interface ModelConfig {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "google" | "grok" | "local";
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: "web" | "network" | "cloud" | "iot" | "custom";
  difficulty: "beginner" | "intermediate" | "advanced";
  services: string[];
  maxRounds: number;
}

// ── Battle ────────────────────────────────────────────────────────────────────

export type Team = "red" | "blue";

export interface BattleConfig {
  id: string;
  scenario: Scenario;
  redModel: ModelConfig;
  blueModel: ModelConfig;
  redPrompt?: string;
  bluePrompt?: string;
  maxRounds: number;
  budgetLimitUsd: number;
  providerMode: ProviderMode;
}

export interface BattleEvent {
  timestamp: number;
  team: Team;
  phase: string; // RECON, EXPLOIT, DETECT, HARDEN, etc.
  action: string;
  detail: string;
  success: boolean;
}

export type BattleStatus = "waiting" | "running" | "paused" | "completed" | "error";

export interface BattleState {
  config: BattleConfig;
  status: BattleStatus;
  currentRound: number;
  events: BattleEvent[];
  score: BattleScore;
  startedAt?: number;
  completedAt?: number;
  costSoFar: number;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export interface BattleScore {
  red: TeamScore;
  blue: TeamScore;
  winner?: Team;
}

export interface TeamScore {
  points: number;
  attacksLanded: number;
  attacksBlocked: number;
  detectionsCorrect: number;
  detectionsMissed: number;
  avgResponseTimeMs: number;
}

// ── Match History ─────────────────────────────────────────────────────────────

export interface MatchSummary {
  id: string;
  scenarioName: string;
  redModel: string;
  blueModel: string;
  winner: Team | "draw";
  redScore: number;
  blueScore: number;
  rounds: number;
  totalCostUsd: number;
  createdAt: number;
  durationMs: number;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  model: string;
  team: Team;
  wins: number;
  losses: number;
  draws: number;
  avgScore: number;
  totalMatches: number;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export interface PromptTemplate {
  id: string;
  name: string;
  team: Team;
  category: string;
  prompt: string;
  description: string;
}

// ── Provider Modes ────────────────────────────────────────────────────────

export type ProviderMode = "mock" | "cli" | "api";

export interface CliStatus {
  claude: boolean;
  gemini: boolean;
  codex: boolean;
}

// ── Battle Report ─────────────────────────────────────────────────────────────

/** Raw LLM reasoning per turn (the full thought process, not just extracted action) */
export interface TurnReasoning {
  round: number;
  team: Team;
  rawResponse: string;      // full LLM output
  parsedEvent: BattleEvent; // what was extracted
  promptSent: string;       // what was sent to the LLM
  thinkingTime: number;     // ms the LLM took to respond
  tokensUsed?: number;
}

/** Battle report with full analysis */
export interface BattleReport {
  match: MatchSummary;
  events: BattleEvent[];
  reasoning: TurnReasoning[];
  turningPoints: TurningPoint[];
  strategyAnalysis: StrategyAnalysis;
  timeline: TimelineEntry[];
}

export interface TurningPoint {
  round: number;
  description: string;
  team: Team;           // who gained advantage
  scoreDelta: number;   // score shift
}

export interface StrategyAnalysis {
  red: TeamStrategy;
  blue: TeamStrategy;
}

export interface TeamStrategy {
  phases: Record<string, number>;    // count per phase (RECON: 3, EXPLOIT: 5)
  successRate: number;               // 0-1
  adaptations: string[];             // moments where strategy changed
  strengths: string[];
  weaknesses: string[];
}

export interface TimelineEntry {
  timestamp: number;
  round: number;
  redEvent?: BattleEvent;
  blueEvent?: BattleEvent;
  cumulativeRedScore: number;
  cumulativeBlueScore: number;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export type WsMessageType =
  | "battle:start"
  | "battle:event"
  | "battle:round"
  | "battle:score"
  | "battle:end"
  | "battle:error";

export interface WsMessage {
  type: WsMessageType;
  battleId: string;
  data: BattleEvent | BattleScore | BattleState | { error: string };
}
