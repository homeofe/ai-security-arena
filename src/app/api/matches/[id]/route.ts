import { NextResponse } from "next/server";
import { getMatch, getMatchEvents, getMatchReasoning } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/matches/[id] - Get a single match with events and reasoning
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const match = getMatch(id);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const events = getMatchEvents(id);
    const reasoning = getMatchReasoning(id);

    return NextResponse.json({ match, events, reasoning });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
