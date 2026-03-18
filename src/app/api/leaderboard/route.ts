import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard - Get model rankings aggregated from match history
 */
export async function GET() {
  try {
    const data = getLeaderboardData();
    return NextResponse.json({ leaderboard: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
