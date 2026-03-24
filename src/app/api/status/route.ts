import { NextResponse } from "next/server";
import { detectAvailableClis } from "@/lib/cli-provider";
import { getEffectiveApiKey } from "@/lib/config";

export const dynamic = "force-dynamic";

interface ComponentStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "info";
  detail: string;
  latencyMs?: number;
  optional?: boolean;
}

/**
 * GET /api/status - Comprehensive system status
 *
 * Checks all components: server, database, CLI tools, and returns
 * an overall health status with per-component details.
 */
export async function GET() {
  const components: ComponentStatus[] = [];
  const start = Date.now();

  // 1. Server health (always healthy if this runs)
  components.push({
    name: "Next.js Server",
    status: "healthy",
    detail: `Uptime ${formatUptime(process.uptime())}`,
    latencyMs: 0,
  });

  // 2. Database check
  const dbStart = Date.now();
  try {
    // Dynamic import to avoid blocking if better-sqlite3 fails to load
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM matches").get() as { count: number };
    components.push({
      name: "SQLite Database",
      status: "healthy",
      detail: `${row.count} matches stored`,
      latencyMs: Date.now() - dbStart,
    });
  } catch (err) {
    components.push({
      name: "SQLite Database",
      status: "down",
      detail: err instanceof Error ? err.message : "Failed to connect",
      latencyMs: Date.now() - dbStart,
    });
  }

  // 3. CLI tools
  const cliStart = Date.now();
  try {
    const clis = detectAvailableClis();
    const cliLatency = Date.now() - cliStart;

    const cliEntries: Array<{ key: string; label: string }> = [
      { key: "claude", label: "Claude CLI" },
      { key: "gemini", label: "Gemini CLI" },
      { key: "codex", label: "Codex CLI" },
    ];

    for (const { key, label } of cliEntries) {
      const available = clis[key as keyof typeof clis];
      components.push({
        name: label,
        status: available ? "healthy" : "down",
        detail: available ? "Found on PATH" : "Not found on PATH",
        latencyMs: cliLatency,
      });
    }
  } catch (err) {
    components.push({
      name: "CLI Detection",
      status: "down",
      detail: err instanceof Error ? err.message : "Detection failed",
      latencyMs: Date.now() - cliStart,
    });
  }

  // 4. API key check (config file + env vars)
  const apiKeyChecks = [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key" },
    { key: "OPENAI_API_KEY", label: "OpenAI API Key" },
    { key: "GOOGLE_API_KEY", label: "Google AI API Key" },
    { key: "GOOGLE_APPLICATION_CREDENTIALS", label: "Google Credentials" },
  ];
  for (const { key, label } of apiKeyChecks) {
    const value = getEffectiveApiKey(key);
    const source = value ? (process.env[key] === value ? "env" : "config") : null;
    components.push({
      name: label,
      status: value ? "healthy" : "info",
      detail: value ? `Set (via ${source})` : "Not configured - optional for CLI/Mock mode",
      optional: true,
    });
  }

  // Overall status: only core components (non-optional) affect the overall health
  const coreComponents = components.filter((c) => !c.optional);
  const hasDown = coreComponents.some((c) => c.status === "down");
  const hasDegraded = coreComponents.some((c) => c.status === "degraded");
  const overall = hasDown ? "degraded" : hasDegraded ? "degraded" : "healthy";

  return NextResponse.json({
    overall,
    timestamp: Date.now(),
    totalLatencyMs: Date.now() - start,
    platform: process.platform,
    nodeVersion: process.version,
    components,
  });
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
