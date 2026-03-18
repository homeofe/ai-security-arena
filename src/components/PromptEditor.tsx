"use client";

import { useState } from "react";
import type { Team, PromptTemplate } from "@/types";
import { EXAMPLE_PROMPTS } from "@/lib/prompts";

interface PromptEditorProps {
  team: Team;
  value: string;
  onChange: (prompt: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  recon: "🔍",
  exploit: "💥",
  detect: "🛡️",
  harden: "🔒",
  respond: "🚨",
};

export function PromptEditor({ team, value, onChange }: PromptEditorProps) {
  const [tab, setTab] = useState<"examples" | "custom">("examples");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const teamPrompts = EXAMPLE_PROMPTS.filter((p) => p.team === team);
  const isRed = team === "red";

  function handleSelectPrompt(prompt: PromptTemplate) {
    setSelectedPromptId(prompt.id);
    onChange(prompt.prompt);
    setTab("custom");
  }

  return (
    <div className="space-y-2">
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${isRed ? "text-red-400" : "text-blue-400"}`}>
        Prompt
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-900/50 p-0.5">
        <button
          onClick={() => setTab("examples")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            tab === "examples"
              ? isRed ? "bg-red-900/40 text-red-300" : "bg-blue-900/40 text-blue-300"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Examples
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            tab === "custom"
              ? isRed ? "bg-red-900/40 text-red-300" : "bg-blue-900/40 text-blue-300"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Custom
        </button>
      </div>

      {/* Content */}
      {tab === "examples" ? (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
          {teamPrompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSelectPrompt(prompt)}
              className={`
                glass-card text-left p-2.5 w-full transition-all cursor-pointer
                ${selectedPromptId === prompt.id
                  ? isRed ? "glow-border-red" : "glow-border-blue"
                  : ""
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs">{CATEGORY_ICONS[prompt.category] || "📋"}</span>
                <span className="text-sm font-medium text-gray-200">{prompt.name}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{prompt.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedPromptId(null);
            }}
            placeholder={`Enter custom ${team} team prompt...`}
            rows={7}
            className={`
              w-full rounded-lg bg-gray-900/60 border border-gray-700/50 p-3
              text-sm text-gray-200 text-mono placeholder-gray-600
              focus:outline-none
              ${isRed
                ? "focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                : "focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              }
              resize-none transition
            `}
          />
          {value && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-600 text-mono">
              {value.length} chars
            </div>
          )}
        </div>
      )}
    </div>
  );
}
