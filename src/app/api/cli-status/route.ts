import { NextResponse } from "next/server";
import { detectAvailableClis } from "@/lib/cli-provider";

/**
 * GET /api/cli-status
 *
 * Returns the status of installed CLI tools.
 * This runs server-side only, so it can safely check the filesystem.
 */
export async function GET() {
  try {
    const status = detectAvailableClis();
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to detect CLIs: ${message}` },
      { status: 500 },
    );
  }
}
