import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health - Health check endpoint
 *
 * Returns 200 OK with basic service info.
 * Used by Docker health checks, load balancers, and monitoring.
 */
export async function GET() {
  const uptime = process.uptime();

  return NextResponse.json({
    status: "ok",
    service: "ai-security-arena",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: Math.round(uptime),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV ?? "development",
  });
}
