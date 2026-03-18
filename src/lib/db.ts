import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { BattleEvent, BattleState, MatchSummary, TurnReasoning } from "@/types";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "arena.db");

let _db: Database.Database | null = null;

/**
 * Get or create the SQLite database connection.
 * Creates the .data directory and tables if they don't exist.
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL,
      red_model TEXT NOT NULL,
      blue_model TEXT NOT NULL,
      winner TEXT,
      red_score INTEGER DEFAULT 0,
      blue_score INTEGER DEFAULT 0,
      rounds INTEGER DEFAULT 0,
      total_cost_usd REAL DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      provider_mode TEXT DEFAULT 'mock',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      round INTEGER NOT NULL,
      team TEXT NOT NULL,
      phase TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 0,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reasoning (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      round INTEGER NOT NULL,
      team TEXT NOT NULL,
      prompt_sent TEXT,
      raw_response TEXT,
      thinking_time INTEGER DEFAULT 0,
      tokens_used INTEGER
    );

    CREATE TABLE IF NOT EXISTS custom_scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      services TEXT NOT NULL,
      max_rounds INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_match ON events(match_id);
    CREATE INDEX IF NOT EXISTS idx_reasoning_match ON reasoning(match_id);
    CREATE INDEX IF NOT EXISTS idx_matches_created ON matches(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner);
    CREATE INDEX IF NOT EXISTS idx_matches_scenario ON matches(scenario_id);
  `);

  return _db;
}

/**
 * Save a completed battle to the database.
 */
export function saveMatch(state: BattleState): string {
  const db = getDb();
  const { config, events, score } = state;

  const winner = score.winner ?? "draw";
  const durationMs = (state.completedAt ?? Date.now()) - (state.startedAt ?? Date.now());

  const insertMatch = db.prepare(`
    INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, winner, red_score, blue_score, rounds, total_cost_usd, duration_ms, provider_mode, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (match_id, round, team, phase, action, detail, success, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    insertMatch.run(
      config.id,
      config.scenario.id,
      config.scenario.name,
      config.redModel.name,
      config.blueModel.name,
      winner,
      score.red.points,
      score.blue.points,
      state.currentRound,
      state.costSoFar,
      durationMs,
      config.providerMode ?? "mock",
      state.startedAt ?? Date.now(),
    );

    let round = 0;
    let eventIdx = 0;
    for (const event of events) {
      // Estimate round from event index (2 events per round: red + blue)
      if (eventIdx % 2 === 0) round++;
      insertEvent.run(
        config.id,
        round,
        event.team,
        event.phase,
        event.action,
        event.detail,
        event.success ? 1 : 0,
        event.timestamp,
      );
      eventIdx++;
    }
  });

  txn();
  return config.id;
}

/**
 * Save reasoning data for a battle.
 */
export function saveReasoning(matchId: string, reasoning: TurnReasoning[]): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO reasoning (match_id, round, team, prompt_sent, raw_response, thinking_time, tokens_used)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    for (const r of reasoning) {
      insert.run(
        matchId,
        r.round,
        r.team,
        r.promptSent,
        r.rawResponse,
        r.thinkingTime,
        r.tokensUsed ?? null,
      );
    }
  });

  txn();
}

/**
 * List matches with optional filters.
 */
export function listMatches(filters?: {
  scenarioId?: string;
  model?: string;
  winner?: string;
  limit?: number;
  offset?: number;
}): MatchSummary[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.scenarioId) {
    conditions.push("scenario_id = ?");
    params.push(filters.scenarioId);
  }
  if (filters?.model) {
    conditions.push("(red_model = ? OR blue_model = ?)");
    params.push(filters.model, filters.model);
  }
  if (filters?.winner) {
    conditions.push("winner = ?");
    params.push(filters.winner);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const rows = db.prepare(`
    SELECT id, scenario_name as scenarioName, red_model as redModel, blue_model as blueModel,
           winner, red_score as redScore, blue_score as blueScore, rounds,
           total_cost_usd as totalCostUsd, duration_ms as durationMs, created_at as createdAt
    FROM matches
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as MatchSummary[];

  return rows;
}

/**
 * Get a single match by ID.
 */
export function getMatch(id: string): MatchSummary | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, scenario_name as scenarioName, red_model as redModel, blue_model as blueModel,
           winner, red_score as redScore, blue_score as blueScore, rounds,
           total_cost_usd as totalCostUsd, duration_ms as durationMs, created_at as createdAt
    FROM matches
    WHERE id = ?
  `).get(id) as MatchSummary | undefined;

  return row ?? null;
}

/**
 * Get all events for a match.
 */
export function getMatchEvents(matchId: string): BattleEvent[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT team, phase, action, detail, success, timestamp
    FROM events
    WHERE match_id = ?
    ORDER BY timestamp ASC
  `).all(matchId) as Array<{
    team: string;
    phase: string;
    action: string;
    detail: string;
    success: number;
    timestamp: number;
  }>;

  return rows.map((r) => ({
    team: r.team as "red" | "blue",
    phase: r.phase,
    action: r.action,
    detail: r.detail,
    success: r.success === 1,
    timestamp: r.timestamp,
  }));
}

/**
 * Get reasoning data for a match.
 */
export function getMatchReasoning(matchId: string): TurnReasoning[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT round, team, prompt_sent, raw_response, thinking_time, tokens_used
    FROM reasoning
    WHERE match_id = ?
    ORDER BY round ASC, team ASC
  `).all(matchId) as Array<{
    round: number;
    team: string;
    prompt_sent: string | null;
    raw_response: string | null;
    thinking_time: number;
    tokens_used: number | null;
  }>;

  return rows.map((r) => ({
    round: r.round,
    team: r.team as "red" | "blue",
    promptSent: r.prompt_sent ?? "",
    rawResponse: r.raw_response ?? "",
    thinkingTime: r.thinking_time,
    tokensUsed: r.tokens_used ?? undefined,
    parsedEvent: {
      timestamp: 0,
      team: r.team as "red" | "blue",
      phase: "",
      action: "",
      detail: "",
      success: false,
    },
  }));
}

/**
 * Get match count for the dashboard.
 */
export function getMatchCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM matches").get() as { count: number };
  return row.count;
}

/**
 * Get leaderboard data: aggregate stats per model+team.
 */
export function getLeaderboardData(): Array<{
  model: string;
  team: string;
  wins: number;
  losses: number;
  draws: number;
  avgScore: number;
  totalMatches: number;
}> {
  const db = getDb();

  // Red team stats
  const redRows = db.prepare(`
    SELECT red_model as model, 'red' as team,
           SUM(CASE WHEN winner = 'red' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN winner = 'blue' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN winner = 'draw' THEN 1 ELSE 0 END) as draws,
           AVG(red_score) as avgScore,
           COUNT(*) as totalMatches
    FROM matches
    GROUP BY red_model
  `).all() as Array<{
    model: string;
    team: string;
    wins: number;
    losses: number;
    draws: number;
    avgScore: number;
    totalMatches: number;
  }>;

  // Blue team stats
  const blueRows = db.prepare(`
    SELECT blue_model as model, 'blue' as team,
           SUM(CASE WHEN winner = 'blue' THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN winner = 'red' THEN 1 ELSE 0 END) as losses,
           SUM(CASE WHEN winner = 'draw' THEN 1 ELSE 0 END) as draws,
           AVG(blue_score) as avgScore,
           COUNT(*) as totalMatches
    FROM matches
    GROUP BY blue_model
  `).all() as Array<{
    model: string;
    team: string;
    wins: number;
    losses: number;
    draws: number;
    avgScore: number;
    totalMatches: number;
  }>;

  return [...redRows, ...blueRows];
}
