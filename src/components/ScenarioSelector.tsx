"use client";

import type { Scenario } from "@/types";
import { BUILTIN_SCENARIOS } from "@/lib/scenarios";

const CATEGORY_ICONS: Record<string, string> = {
  web: "🌐",
  network: "🔗",
  cloud: "☁️",
  iot: "📟",
  custom: "⚙️",
};

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: "bg-green-900/50", text: "text-green-300" },
  intermediate: { bg: "bg-yellow-900/50", text: "text-yellow-300" },
  advanced:     { bg: "bg-red-900/50", text: "text-red-300" },
};

interface ScenarioSelectorProps {
  selected: Scenario | null;
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioSelector({ selected, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400">
        Battle Scenario
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scenario-scroll">
        {BUILTIN_SCENARIOS.map((scenario) => {
          const isSelected = selected?.id === scenario.id;
          const diff = DIFFICULTY_STYLES[scenario.difficulty];

          return (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario)}
              className={`
                glass-card flex-shrink-0 w-[220px] p-4 text-left transition-all cursor-pointer
                ${isSelected ? "glow-red-strong glow-blue-strong border-purple-500/50" : ""}
                hover:border-purple-500/30
              `}
              style={isSelected ? {
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)"
              } : undefined}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{CATEGORY_ICONS[scenario.category]}</span>
                <span className={`text-sm font-semibold ${isSelected ? "text-purple-300" : "text-gray-200"}`}>
                  {scenario.name}
                </span>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                {scenario.description}
              </p>

              <div className="flex items-center justify-between mb-2">
                <span className={`phase-badge ${diff.bg} ${diff.text}`}>
                  {scenario.difficulty}
                </span>
                <span className="text-xs text-gray-600 text-mono">
                  {scenario.maxRounds} rounds
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {scenario.services.slice(0, 3).map((svc) => (
                  <span
                    key={svc}
                    className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[0.625rem] text-gray-400 text-mono"
                  >
                    {svc}
                  </span>
                ))}
                {scenario.services.length > 3 && (
                  <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[0.625rem] text-gray-500">
                    +{scenario.services.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
