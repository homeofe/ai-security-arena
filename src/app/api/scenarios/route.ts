import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Scenario } from "@/types";
import { BUILTIN_SCENARIOS } from "@/lib/scenarios";

export const dynamic = "force-dynamic";

/**
 * GET /api/scenarios - List all scenarios (builtin + custom)
 */
export async function GET() {
  try {
    const db = getDb();
    const customRows = db.prepare(`
      SELECT id, name, description, category, difficulty, services, max_rounds as maxRounds
      FROM custom_scenarios
      ORDER BY created_at DESC
    `).all() as Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      difficulty: string;
      services: string;
      maxRounds: number;
    }>;

    const customScenarios: Scenario[] = customRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category as Scenario["category"],
      difficulty: r.difficulty as Scenario["difficulty"],
      services: JSON.parse(r.services),
      maxRounds: r.maxRounds,
    }));

    return NextResponse.json({
      builtin: BUILTIN_SCENARIOS,
      custom: customScenarios,
      all: [...BUILTIN_SCENARIOS, ...customScenarios],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/scenarios - Create a custom scenario
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, difficulty, services, maxRounds } = body;

    if (!name || !description || !category || !difficulty || !services || !maxRounds) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, category, difficulty, services, maxRounds" },
        { status: 400 },
      );
    }

    const validCategories = ["web", "network", "cloud", "iot", "custom"];
    const validDifficulties = ["beginner", "intermediate", "advanced"];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 },
      );
    }
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}` },
        { status: 400 },
      );
    }
    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "services must be a non-empty array of strings" },
        { status: 400 },
      );
    }

    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    const db = getDb();
    db.prepare(`
      INSERT INTO custom_scenarios (id, name, description, category, difficulty, services, max_rounds, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description, category, difficulty, JSON.stringify(services), maxRounds, now, now);

    const scenario: Scenario = {
      id,
      name,
      description,
      category,
      difficulty,
      services,
      maxRounds,
    };

    return NextResponse.json({ scenario, status: "created" }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/scenarios - Delete a custom scenario
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing scenario id" }, { status: 400 });
    }

    // Prevent deletion of builtin scenarios
    if (BUILTIN_SCENARIOS.some((s) => s.id === id)) {
      return NextResponse.json({ error: "Cannot delete builtin scenarios" }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare("DELETE FROM custom_scenarios WHERE id = ?").run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
