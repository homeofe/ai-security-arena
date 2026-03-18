"use client";

import { useState } from "react";
import type { TurnReasoning, Team } from "@/types";

interface ReasoningViewerProps {
  reasoning: TurnReasoning[];
}

export function ReasoningViewer({ reasoning }: ReasoningViewerProps) {
  const [activeTab, setActiveTab] = useState<Team>("red");
  const filtered = reasoning.filter((r) => r.team === activeTab);

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Inside Their Heads
      </h2>
      <p className="text-xs text-gray-600 mb-4">
        Full LLM reasoning for each round: what was asked, what was answered, and what was extracted.
      </p>

      {/* Tab selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("red")}
          className={`
            px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer
            ${activeTab === "red"
              ? "bg-red-500/20 border border-red-500/50 text-red-300 glow-red"
              : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
            }
          `}
        >
          🔴 Red Team
        </button>
        <button
          onClick={() => setActiveTab("blue")}
          className={`
            px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer
            ${activeTab === "blue"
              ? "bg-blue-500/20 border border-blue-500/50 text-blue-300 glow-blue"
              : "bg-gray-900/40 border border-gray-700/50 text-gray-400 hover:border-gray-600/50"
            }
          `}
        >
          🔵 Blue Team
        </button>
      </div>

      {/* Reasoning entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          No detailed reasoning data available.
          <br />
          <span className="text-xs text-gray-700">Reasoning is captured in CLI mode with real LLM calls.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <ReasoningEntry key={`${entry.team}-${entry.round}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReasoningEntry({ entry }: { entry: TurnReasoning }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const isRed = entry.team === "red";

  return (
    <div className={`rounded-lg border p-4 ${isRed ? "bg-red-950/10 border-red-500/15" : "bg-blue-950/10 border-blue-500/15"}`}>
      {/* Round header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold text-mono px-2 py-0.5 rounded ${isRed ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}`}>
            Round {entry.round}
          </span>
          <span className="text-xs text-gray-500">{entry.parsedEvent.phase} / {entry.parsedEvent.action.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-mono">
          {/* Thinking time bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Think:</span>
            <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${isRed ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min((entry.thinkingTime / 5000) * 100, 100)}%` }}
              />
            </div>
            <span className="text-gray-400">{entry.thinkingTime}ms</span>
          </div>
          {entry.tokensUsed && (
            <span className="text-gray-500">{entry.tokensUsed} tok</span>
          )}
          <span className={`w-2 h-2 rounded-full ${entry.parsedEvent.success ? "bg-green-400" : "bg-red-400"}`} />
        </div>
      </div>

      {/* Extracted event card */}
      <div className={`rounded-lg p-3 mb-3 border ${isRed ? "bg-red-950/20 border-red-500/10" : "bg-blue-950/20 border-blue-500/10"}`}>
        <div className="text-xs text-gray-400 mb-1">Extracted Action:</div>
        <div className="text-sm text-gray-200">{entry.parsedEvent.detail}</div>
      </div>

      {/* Collapsible sections */}
      <div className="space-y-2">
        <CollapsibleSection
          label="Prompt Sent to LLM"
          isOpen={showPrompt}
          onToggle={() => setShowPrompt(!showPrompt)}
        >
          <pre className="text-[0.7rem] text-gray-400 whitespace-pre-wrap text-mono leading-relaxed">
            {entry.promptSent}
          </pre>
        </CollapsibleSection>

        <CollapsibleSection
          label="Full LLM Response"
          isOpen={showRaw}
          onToggle={() => setShowRaw(!showRaw)}
        >
          <HighlightedResponse text={entry.rawResponse} />
        </CollapsibleSection>
      </div>
    </div>
  );
}

function CollapsibleSection({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition cursor-pointer w-full text-left"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-semibold">{label}</span>
      </button>
      {isOpen && (
        <div className="mt-2 bg-black/30 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Simple syntax highlighting for structured response fields.
 */
function HighlightedResponse({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <pre className="text-[0.7rem] text-mono leading-relaxed whitespace-pre-wrap">
      {lines.map((line, i) => {
        const fieldMatch = line.match(/^(PHASE|ACTION|TARGET|DETAIL|SUCCESS)\s*:/i);
        if (fieldMatch) {
          const colonIdx = line.indexOf(":");
          const key = line.slice(0, colonIdx + 1);
          const value = line.slice(colonIdx + 1);
          return (
            <span key={i}>
              <span className="text-purple-400 font-bold">{key}</span>
              <span className="text-gray-300">{value}</span>
              {"\n"}
            </span>
          );
        }
        return (
          <span key={i} className="text-gray-500">
            {line}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
}
