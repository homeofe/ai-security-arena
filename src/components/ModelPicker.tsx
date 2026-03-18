"use client";

import type { ModelConfig, Team } from "@/types";
import { AVAILABLE_MODELS } from "@/lib/models";

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: "🟤",
  openai: "🟢",
  google: "🔵",
  grok: "🐦",
  local: "🟣",
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  grok: "xAI",
  local: "Local",
};

function formatContext(ctx: number): string {
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(0)}M`;
  return `${(ctx / 1_000).toFixed(0)}K`;
}

function costTier(model: ModelConfig): { label: string; color: string } {
  const cost = model.costPer1kInput + model.costPer1kOutput;
  if (cost < 0.005) return { label: "$", color: "text-green-400" };
  if (cost < 0.015) return { label: "$$", color: "text-yellow-400" };
  return { label: "$$$", color: "text-red-400" };
}

interface ModelPickerProps {
  team: Team;
  selected: ModelConfig | null;
  onSelect: (model: ModelConfig) => void;
}

export function ModelPicker({ team, selected, onSelect }: ModelPickerProps) {
  const isRed = team === "red";

  return (
    <div className="space-y-2">
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${isRed ? "text-red-400" : "text-blue-400"}`}>
        Select Model
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {AVAILABLE_MODELS.map((model) => {
          const isSelected = selected?.id === model.id;
          const tier = costTier(model);

          return (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className={`
                glass-card text-left p-3 transition-all cursor-pointer
                ${isSelected
                  ? isRed
                    ? "glow-border-red border-red-500/50"
                    : "glow-border-blue border-blue-500/50"
                  : ""
                }
                ${isRed ? "hover:border-red-500/30" : "hover:border-blue-500/30"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{PROVIDER_ICONS[model.provider]}</span>
                  <div>
                    <div className={`text-sm font-medium ${
                      isSelected
                        ? isRed ? "text-red-300" : "text-blue-300"
                        : "text-gray-200"
                    }`}>
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {PROVIDER_LABELS[model.provider]}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-xs text-gray-500 text-mono">
                    {formatContext(model.contextWindow)}
                  </span>
                  <span className={`text-xs font-bold text-mono ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
