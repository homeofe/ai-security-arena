"use client";

import { useState, useEffect, useCallback } from "react";
import type { MatchSummary } from "@/types";

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScenario, setFilterScenario] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterWinner, setFilterWinner] = useState("");

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterScenario) params.set("scenarioId", filterScenario);
      if (filterModel) params.set("model", filterModel);
      if (filterWinner) params.set("winner", filterWinner);

      const res = await fetch(`/api/matches?${params.toString()}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [filterScenario, filterModel, filterWinner]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return (
    <div className="space-y-6 animate-float-in">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold gradient-text-battle mb-2">Match History</h2>
        <p className="text-sm text-gray-500">Browse past battles and review outcomes</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Scenario</label>
            <input
              type="text"
              placeholder="All scenarios"
              value={filterScenario}
              onChange={(e) => setFilterScenario(e.target.value)}
              className="rounded-lg bg-gray-900/60 border border-gray-700/50 py-1.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Model</label>
            <input
              type="text"
              placeholder="All models"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="rounded-lg bg-gray-900/60 border border-gray-700/50 py-1.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Winner</label>
            <select
              value={filterWinner}
              onChange={(e) => setFilterWinner(e.target.value)}
              className="rounded-lg bg-gray-900/60 border border-gray-700/50 py-1.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="">All</option>
              <option value="red">Red Team</option>
              <option value="blue">Blue Team</option>
              <option value="draw">Draw</option>
            </select>
          </div>
          <button
            onClick={fetchMatches}
            className="ml-auto glass-card px-4 py-1.5 text-sm font-semibold text-purple-300 hover:border-purple-500/50 transition cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Match List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading matches...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚔️</div>
          <div className="text-gray-400 text-lg mb-2">No matches yet</div>
          <p className="text-gray-600 text-sm mb-6">
            Start a battle in the Arena to see results here
          </p>
          <a
            href="/arena"
            className="inline-block start-button rounded-xl px-8 py-3 text-sm font-bold text-white"
          >
            Go to Arena
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MatchSummary }) {
  const date = new Date(match.createdAt);
  const durationSec = Math.round((match.durationMs ?? 0) / 1000);
  const winnerLabel =
    match.winner === "red" ? "🔴 Red" :
    match.winner === "blue" ? "🔵 Blue" :
    "🟣 Draw";

  return (
    <a href={`/replay?id=${match.id}`} className="block">
      <div className="glass-card p-4 hover:border-purple-500/30 transition cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Winner badge */}
            <div className={`
              w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
              ${match.winner === "red" ? "bg-red-500/20 border border-red-500/30" :
                match.winner === "blue" ? "bg-blue-500/20 border border-blue-500/30" :
                "bg-purple-500/20 border border-purple-500/30"}
            `}>
              {winnerLabel.slice(0, 2)}
            </div>

            {/* Match info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-200">{match.scenarioName}</span>
                <span className="text-xs text-gray-600">|</span>
                <span className="text-xs text-gray-400">{match.rounds} rounds</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="text-red-400">{match.redModel}</span>
                <span>vs</span>
                <span className="text-blue-400">{match.blueModel}</span>
              </div>
            </div>
          </div>

          {/* Score and metadata */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono font-bold">{match.redScore}</span>
                <span className="text-gray-600">:</span>
                <span className="text-blue-400 font-mono font-bold">{match.blueScore}</span>
              </div>
              <div className="text-xs text-gray-600">Score</div>
            </div>

            <div className="text-center">
              <div className="text-gray-300 font-mono">{durationSec}s</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>

            <div className="text-center">
              <div className="text-gray-300 font-mono">${(match.totalCostUsd ?? 0).toFixed(4)}</div>
              <div className="text-xs text-gray-600">Cost</div>
            </div>

            <div className="text-center min-w-[80px]">
              <div className="text-gray-400 text-xs">
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="text-gray-600 text-xs">
                {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
