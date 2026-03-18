import type { ModelConfig } from "@/types";

/**
 * Available models for Red and Blue teams.
 * Cost estimates are approximate and may change.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  // Anthropic
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    contextWindow: 1_000_000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    contextWindow: 1_000_000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200_000,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
  },

  // OpenAI
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2 Codex",
    provider: "openai",
    contextWindow: 256_000,
    costPer1kInput: 0.002,
    costPer1kOutput: 0.008,
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    contextWindow: 256_000,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  },

  // Google
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    contextWindow: 1_000_000,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    contextWindow: 1_000_000,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
  },

  // Grok
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "grok",
    contextWindow: 131_000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: ModelConfig["provider"]): ModelConfig[] {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
}
