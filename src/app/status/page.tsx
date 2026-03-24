"use client";

import { useState, useEffect, useCallback } from "react";

interface ComponentStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "info";
  detail: string;
  latencyMs?: number;
  optional?: boolean;
}

interface SystemStatus {
  overall: "healthy" | "degraded" | "down";
  timestamp: number;
  totalLatencyMs: number;
  platform: string;
  nodeVersion: string;
  components: ComponentStatus[];
}

const STATUS_ICON: Record<string, string> = {
  healthy: "\u2713",
  degraded: "!",
  down: "\u2717",
  info: "-",
};

const STATUS_COLOR: Record<string, string> = {
  healthy: "text-green-400",
  degraded: "text-yellow-400",
  down: "text-red-400",
  info: "text-gray-400",
};

const STATUS_BG: Record<string, string> = {
  healthy: "bg-green-400/10 border-green-400/30",
  degraded: "bg-yellow-400/10 border-yellow-400/30",
  down: "bg-red-400/10 border-red-400/30",
  info: "bg-gray-400/10 border-gray-400/30",
};

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-green-400",
  degraded: "bg-yellow-400",
  down: "bg-red-400",
  info: "bg-gray-400",
};

const CATEGORY_ICON: Record<string, string> = {
  server: "\u2699\ufe0f",
  database: "\ud83d\uddc4\ufe0f",
  cli: "\ud83d\udcbb",
  keys: "\ud83d\udd11",
};

function categorize(name: string): string {
  if (name.includes("Server")) return "server";
  if (name.includes("Database") || name.includes("SQLite")) return "database";
  if (name.includes("CLI")) return "cli";
  if (name.includes("API Key") || name.includes("Credentials")) return "keys";
  return "server";
}

function categoryLabel(cat: string): string {
  switch (cat) {
    case "server": return "Server";
    case "database": return "Database";
    case "cli": return "CLI Connectors";
    case "keys": return "API Keys";
    default: return cat;
  }
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemStatus = await res.json();
      setStatus(data);
      setError(null);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatus]);

  // Group components by category
  const grouped: Record<string, ComponentStatus[]> = {};
  if (status) {
    for (const comp of status.components) {
      const cat = categorize(comp.name);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(comp);
    }
  }

  const categoryOrder = ["server", "database", "cli", "keys"];

  return (
    <div className="space-y-6 animate-float-in">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold gradient-text-battle mb-2">System Status</h2>
        <p className="text-sm text-gray-500">Health overview of all connectors and services</p>
      </div>

      {/* Overall status banner */}
      {status && (
        <div className={`glass-card p-6 border ${STATUS_BG[status.overall]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${STATUS_DOT[status.overall]} ${status.overall === "healthy" ? "" : "animate-pulse"}`} />
              <div>
                <h3 className={`text-xl font-bold ${STATUS_COLOR[status.overall]}`}>
                  {status.overall === "healthy" ? "All Systems Operational" :
                   status.overall === "degraded" ? "Some Systems Degraded" :
                   "System Outage Detected"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {status.platform} / Node {status.nodeVersion} - checked in {status.totalLatencyMs}ms
                  {status.overall === "healthy" && status.components.some((c: ComponentStatus) => c.optional && c.status === "info") && (
                    <span className="ml-2 text-gray-400">- Mock mode ready, configure API keys in <a href="/settings" className="text-purple-400 hover:text-purple-300 underline">Settings</a> for CLI mode</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="accent-purple-500"
                />
                Auto-refresh
              </label>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition disabled:opacity-50"
              >
                {loading ? "Checking..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !status && (
        <div className="glass-card p-6 border border-red-500/30 bg-red-500/10 text-center">
          <p className="text-red-400 font-medium">Failed to reach status API</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchStatus}
            className="mt-4 text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !status && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-5 bg-gray-800 rounded w-40 mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-800 rounded" />
                <div className="h-12 bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Component groups */}
      {status && categoryOrder.map((cat) => {
        const components = grouped[cat];
        if (!components?.length) return null;

        return (
          <div key={cat} className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>{CATEGORY_ICON[cat]}</span>
              {categoryLabel(cat)}
            </h3>
            <div className="space-y-2">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-900/50 border border-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold font-mono w-6 text-center ${STATUS_COLOR[comp.status]}`}>
                      {STATUS_ICON[comp.status]}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-200">
                        {comp.name.replace("Env: ", "")}
                      </span>
                      <p className="text-xs text-gray-500">{comp.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {comp.latencyMs !== undefined && (
                      <span className="text-xs text-gray-600 font-mono">{comp.latencyMs}ms</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BG[comp.status]} ${STATUS_COLOR[comp.status]}`}>
                      {comp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Last refresh timestamp */}
      {lastRefresh > 0 && (
        <p className="text-center text-xs text-gray-600">
          Last checked: {new Date(lastRefresh).toLocaleTimeString()}
          {autoRefresh && " - auto-refreshing every 10s"}
        </p>
      )}
    </div>
  );
}
