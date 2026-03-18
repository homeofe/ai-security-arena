import { NextResponse } from "next/server";
import { listMatches, saveMatch } from "@/lib/db";
import type { BattleState } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/matches - List matches with optional filters
 * Query params: scenarioId, model, winner, limit, offset
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = {
      scenarioId: url.searchParams.get("scenarioId") ?? undefined,
      model: url.searchParams.get("model") ?? undefined,
      winner: url.searchParams.get("winner") ?? undefined,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      offset: url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : undefined,
    };

    const matches = listMatches(filters);
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/matches - Save a completed match
 * Body: BattleState
 */
export async function POST(request: Request) {
  try {
    const state: BattleState = await request.json();

    if (!state.config?.id || !state.events) {
      return NextResponse.json(
        { error: "Invalid battle state: missing config.id or events" },
        { status: 400 },
      );
    }

    const id = saveMatch(state);
    return NextResponse.json({ id, status: "saved" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
