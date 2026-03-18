"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types";

type SortKey = "wins" | "losses" | "draws" | "avgScore" | "totalMatches";
type SortDir = "asc" | "desc";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<"all" | "red" | "blue">("all");
  const [sortKey, setSortKey] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setEntries(data.leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = entries.filter((e) => teamFilter === "all" || e.team === teamFilter);
  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "desc" ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * mul;
  });

  // Medal icons for top 3
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 animate-float-in">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold gradient-text-battle mb-2">Leaderboard</h2>
        <p className="text-sm text-gray-500">Model rankings across all battles</p>
      </div>

      {/* Team filter tabs */}
      <div className="flex justify-center gap-2">
        {(["all", "red", "blue"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTeamFilter(t)}
            className={`
              px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer
              ${teamFilter === t
                ? t === "red"
                  ? "bg-red-500/20 border border-red-500/50 text-red-300"
                  : t === "blue"
                    ? "bg-blue-500/20 border border-blue-500/50 text-blue-300"
                    : "bg-purple-500/20 border border-purple-500/50 text-purple-300"
                : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
              }
            `}
          >
            {t === "all" ? "⚔️ All" : t === "red" ? "🔴 Red Team" : "🔵 Blue Team"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading rankings...</div>
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Team
                </th>
                <SortableHeader label="Wins" sortKey="wins" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Losses" sortKey="losses" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Draws" sortKey="draws" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Avg Score" sortKey="avgScore" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortableHeader label="Matches" sortKey="totalMatches" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => {
                const winRate = entry.totalMatches > 0
                  ? ((entry.wins / entry.totalMatches) * 100).toFixed(0)
                  : "0";
                const medal = i < 3 ? medals[i] : null;

                return (
                  <tr
                    key={`${entry.model}-${entry.team}`}
                    className="border-b border-gray-800/30 hover:bg-gray-800/20 transition"
                  >
                    <td className="px-4 py-3 text-sm">
                      {medal ? (
                        <span className="text-lg">{medal}</span>
                      ) : (
                        <span className="text-gray-500 font-mono">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProviderIcon model={entry.model} />
                        <span className="font-semibold text-gray-200">{entry.model}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${entry.team === "red"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                        }
                      `}>
                        {entry.team === "red" ? "🔴 Red" : "🔵 Blue"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400 font-mono">{entry.wins}</td>
                    <td className="px-4 py-3 text-sm text-red-400 font-mono">{entry.losses}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{entry.draws}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {typeof entry.avgScore === "number" ? entry.avgScore.toFixed(1) : "0"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">{entry.totalMatches}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-mono w-8">{winRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Head-to-head section (future) */}
      {sorted.length > 0 && (
        <div className="glass-card p-6 text-center">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Head-to-Head Matrix
          </h3>
          <p className="text-xs text-gray-600">
            Coming soon: see how each model performs against every other model
          </p>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-semibold cursor-pointer hover:text-gray-200 transition select-none"
      onClick={() => onClick(sortKey)}
    >
      {label} {isActive ? (dir === "desc" ? "↓" : "↑") : ""}
    </th>
  );
}

function ProviderIcon({ model }: { model: string }) {
  const lower = model.toLowerCase();
  if (lower.includes("claude") || lower.includes("anthropic")) {
    return <span className="text-xs provider-anthropic">◆</span>;
  }
  if (lower.includes("gpt") || lower.includes("openai") || lower.includes("o1") || lower.includes("o3")) {
    return <span className="text-xs provider-openai">◆</span>;
  }
  if (lower.includes("gemini") || lower.includes("google")) {
    return <span className="text-xs provider-google">◆</span>;
  }
  if (lower.includes("grok")) {
    return <span className="text-xs provider-grok">◆</span>;
  }
  return <span className="text-xs provider-local">◆</span>;
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🏆</div>
      <div className="text-gray-400 text-lg mb-2">No rankings yet</div>
      <p className="text-gray-600 text-sm mb-6">
        Complete battles in the Arena to see model rankings here
      </p>
      <a
        href="/arena"
        className="inline-block start-button rounded-xl px-8 py-3 text-sm font-bold text-white"
      >
        Start a Battle
      </a>
    </div>
  );
}
