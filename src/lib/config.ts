/**
 * Server-side configuration store for API keys and settings.
 * Stores data in .data/config.json (gitignored).
 * API keys set here override environment variables.
 */

import fs from "fs";
import path from "path";

const CONFIG_DIR = path.join(process.cwd(), ".data");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

// Keys that can be configured through the UI
export const CONFIGURABLE_API_KEYS = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", placeholder: "sk-ant-..." },
  { key: "OPENAI_API_KEY", label: "OpenAI API Key", placeholder: "sk-..." },
  { key: "GOOGLE_API_KEY", label: "Google AI API Key", placeholder: "AIza..." },
  { key: "GOOGLE_APPLICATION_CREDENTIALS", label: "Google Application Credentials", placeholder: "/path/to/credentials.json" },
] as const;

export type ApiKeyName = (typeof CONFIGURABLE_API_KEYS)[number]["key"];

interface AppConfig {
  apiKeys: Partial<Record<string, string>>;
}

function readConfig(): AppConfig {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Corrupted file or parse error - start fresh
  }
  return { apiKeys: {} };
}

function writeConfig(config: AppConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Get all configured API keys (from config file).
 * Returns masked values for display (never full keys).
 */
export function getApiKeyStatuses(): Array<{
  key: string;
  label: string;
  placeholder: string;
  source: "config" | "env" | "none";
  masked: string;
}> {
  const config = readConfig();

  return CONFIGURABLE_API_KEYS.map(({ key, label, placeholder }) => {
    const configValue = config.apiKeys[key];
    const envValue = process.env[key];

    if (configValue) {
      return { key, label, placeholder, source: "config" as const, masked: maskKey(configValue) };
    }
    if (envValue) {
      return { key, label, placeholder, source: "env" as const, masked: maskKey(envValue) };
    }
    return { key, label, placeholder, source: "none" as const, masked: "" };
  });
}

/**
 * Set an API key in the config file.
 */
export function setApiKey(key: string, value: string): void {
  const config = readConfig();
  config.apiKeys[key] = value;
  writeConfig(config);
}

/**
 * Remove an API key from the config file.
 */
export function removeApiKey(key: string): void {
  const config = readConfig();
  delete config.apiKeys[key];
  writeConfig(config);
}

/**
 * Get the effective value for an API key.
 * Config file takes priority over environment variables.
 */
export function getEffectiveApiKey(key: string): string | undefined {
  const config = readConfig();
  return config.apiKeys[key] || process.env[key] || undefined;
}

/**
 * Get all effective API keys as a record (for injecting into subprocess env).
 */
export function getEffectiveApiKeys(): Record<string, string> {
  const config = readConfig();
  const result: Record<string, string> = {};

  for (const { key } of CONFIGURABLE_API_KEYS) {
    const value = config.apiKeys[key] || process.env[key];
    if (value) result[key] = value;
  }

  return result;
}

function maskKey(value: string): string {
  if (value.length <= 8) return "*".repeat(value.length);
  return value.slice(0, 4) + "*".repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
}
