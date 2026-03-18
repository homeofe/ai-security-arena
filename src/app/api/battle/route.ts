import { NextResponse } from "next/server";
import type { BattleConfig } from "@/types";
import { runCliPrompt, getCliForModel, isModelAvailable, detectAvailableClis } from "@/lib/cli-provider";
import { buildRedTeamPrompt, buildBlueTeamPrompt } from "@/lib/prompt-builder";
import { parseResponse, isValidResponse } from "@/lib/response-parser";

/**
 * POST /api/battle
 *
 * Executes a single battle turn via CLI.
 * Request body: { team, modelId, scenario, round, events, redAction?, customPrompt? }
 *
 * All CLI execution happens server-side. The browser never touches CLI processes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { team, modelId, scenario, round, events, redAction, customPrompt, timeoutMs } = body;

    if (!team || !modelId || !scenario || !round) {
      return NextResponse.json(
        { error: "Missing required fields: team, modelId, scenario, round" },
        { status: 400 },
      );
    }

    // Validate CLI is available for this model
    const cliStatus = detectAvailableClis();
    if (!isModelAvailable(modelId, cliStatus)) {
      const cli = getCliForModel(modelId);
      return NextResponse.json(
        { error: `CLI '${cli || "unknown"}' not available for model '${modelId}'` },
        { status: 400 },
      );
    }

    const timeout = timeoutMs || 30_000;

    let systemPrompt: string;
    let userPrompt: string;

    if (team === "red") {
      const prompts = buildRedTeamPrompt(scenario, round, events || [], customPrompt);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    } else {
      if (!redAction) {
        return NextResponse.json(
          { error: "Blue team turn requires redAction" },
          { status: 400 },
        );
      }
      const prompts = buildBlueTeamPrompt(scenario, round, events || [], redAction, customPrompt);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }

    const result = await runCliPrompt(modelId, systemPrompt, userPrompt, timeout);

    if (!isValidResponse(result.text)) {
      return NextResponse.json(
        { error: "CLI returned empty or invalid response", raw: result.text },
        { status: 502 },
      );
    }

    const event = parseResponse(result.text, team);

    return NextResponse.json({
      event,
      raw: result.text,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Battle turn failed: ${message}` },
      { status: 500 },
    );
  }
}
