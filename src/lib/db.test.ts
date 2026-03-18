import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Test with an in-memory database to avoid file system side effects

describe("Database schema", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(`
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
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("should insert and retrieve a match", () => {
    db.prepare(`
      INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, winner, red_score, blue_score, rounds, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("test-1", "web-server", "Web Server", "Claude 4", "GPT-5", "red", 45, 32, 10, Date.now());

    const row = db.prepare("SELECT * FROM matches WHERE id = ?").get("test-1") as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.red_model).toBe("Claude 4");
    expect(row.winner).toBe("red");
  });

  it("should insert and retrieve events for a match", () => {
    db.prepare(`
      INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("test-2", "web-server", "Web Server", "Claude 4", "GPT-5", Date.now());

    db.prepare(`
      INSERT INTO events (match_id, round, team, phase, action, detail, success, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("test-2", 1, "red", "RECON", "scan", "Port scanning", 1, Date.now());

    const events = db.prepare("SELECT * FROM events WHERE match_id = ?").all("test-2") as Array<Record<string, unknown>>;
    expect(events).toHaveLength(1);
    expect(events[0].team).toBe("red");
    expect(events[0].success).toBe(1);
  });

  it("should cascade delete events when match is deleted", () => {
    db.prepare(`
      INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("test-3", "web-server", "Web Server", "Claude 4", "GPT-5", Date.now());

    db.prepare(`
      INSERT INTO events (match_id, round, team, phase, action, detail, success, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("test-3", 1, "red", "RECON", "scan", "Port scanning", 1, Date.now());

    db.prepare("DELETE FROM matches WHERE id = ?").run("test-3");

    const events = db.prepare("SELECT * FROM events WHERE match_id = ?").all("test-3");
    expect(events).toHaveLength(0);
  });

  it("should store and retrieve reasoning data", () => {
    db.prepare(`
      INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("test-4", "web-server", "Web Server", "Claude 4", "GPT-5", Date.now());

    db.prepare(`
      INSERT INTO reasoning (match_id, round, team, prompt_sent, raw_response, thinking_time, tokens_used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("test-4", 1, "red", "System prompt here", "LLM response here", 1500, 250);

    const rows = db.prepare("SELECT * FROM reasoning WHERE match_id = ?").all("test-4") as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].thinking_time).toBe(1500);
    expect(rows[0].tokens_used).toBe(250);
  });

  it("should store custom scenarios", () => {
    const now = Date.now();
    db.prepare(`
      INSERT INTO custom_scenarios (id, name, description, category, difficulty, services, max_rounds, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("custom-1", "My Scenario", "Custom test scenario", "web", "beginner", JSON.stringify(["nginx"]), 10, now, now);

    const row = db.prepare("SELECT * FROM custom_scenarios WHERE id = ?").get("custom-1") as Record<string, unknown>;
    expect(row).toBeDefined();
    expect(row.name).toBe("My Scenario");
    expect(JSON.parse(row.services as string)).toEqual(["nginx"]);
  });

  it("should aggregate leaderboard data", () => {
    const now = Date.now();
    // Insert multiple matches
    db.prepare(`INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, winner, red_score, blue_score, rounds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run("m1", "web", "Web", "Claude", "GPT", "red", 50, 30, 10, now);
    db.prepare(`INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, winner, red_score, blue_score, rounds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run("m2", "web", "Web", "Claude", "GPT", "blue", 25, 40, 10, now);
    db.prepare(`INSERT INTO matches (id, scenario_id, scenario_name, red_model, blue_model, winner, red_score, blue_score, rounds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run("m3", "web", "Web", "Claude", "GPT", "red", 45, 35, 10, now);

    const redStats = db.prepare(`
      SELECT red_model as model,
             SUM(CASE WHEN winner = 'red' THEN 1 ELSE 0 END) as wins,
             SUM(CASE WHEN winner = 'blue' THEN 1 ELSE 0 END) as losses,
             COUNT(*) as totalMatches
      FROM matches GROUP BY red_model
    `).all() as Array<Record<string, unknown>>;

    expect(redStats).toHaveLength(1);
    expect(redStats[0].model).toBe("Claude");
    expect(redStats[0].wins).toBe(2);
    expect(redStats[0].losses).toBe(1);
    expect(redStats[0].totalMatches).toBe(3);
  });
});
