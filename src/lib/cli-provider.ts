/**
 * CLI-based LLM Provider for the AI Security Arena.
 *
 * Adapted from conduit-vscode agent-backends patterns.
 * Spawns claude/gemini/codex CLI processes for one-shot prompts.
 * All execution happens server-side only (never in browser).
 */

import { execSync, spawn, type ChildProcess } from "child_process";
import { homedir } from "os";
import type { CliStatus } from "@/types";
import { getEffectiveApiKeys } from "@/lib/config";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export type CliName = "claude" | "gemini" | "codex";

interface CliConfig {
  cmd: string;
  args: string[];
  stdinPrompt: string;
  shell: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 30_000;

// ── CLI Detection ────────────────────────────────────────────────────────────

/**
 * Check if a CLI tool is available on the system PATH.
 */
function checkCli(name: string): boolean {
  try {
    const cmd = process.platform === "win32"
      ? `where ${name} 2>nul`
      : `which ${name} 2>/dev/null`;
    const result = execSync(cmd, { encoding: "utf-8", timeout: 3000 }).trim();
    return !!result;
  } catch {
    return false;
  }
}

/**
 * Detect which CLI tools are installed on the system.
 */
export function detectAvailableClis(): CliStatus {
  return {
    claude: checkCli("claude"),
    gemini: checkCli("gemini"),
    codex: checkCli("codex"),
  };
}

// ── Model to CLI Mapping ─────────────────────────────────────────────────────

/**
 * Map a model ID to the CLI tool that should run it.
 * Returns null if no CLI supports this model.
 */
export function getCliForModel(modelId: string): CliName | null {
  const id = modelId.toLowerCase();

  // Anthropic models -> claude CLI
  if (id.includes("claude") || id.includes("anthropic")) {
    return "claude";
  }

  // Google models -> gemini CLI
  if (id.includes("gemini") || id.includes("google")) {
    return "gemini";
  }

  // OpenAI models -> codex CLI
  if (id.includes("gpt") || id.includes("codex") || id.includes("openai")) {
    return "codex";
  }

  return null;
}

/**
 * Check if the required CLI for a model is available.
 */
export function isModelAvailable(modelId: string, cliStatus: CliStatus): boolean {
  const cli = getCliForModel(modelId);
  if (!cli) return false;
  return cliStatus[cli];
}

// ── Minimal Environment ──────────────────────────────────────────────────────

/**
 * Build a clean environment for CLI subprocess.
 * Passes through only necessary vars and API keys.
 */
function buildMinimalEnv(): Record<string, string> {
  const env: Record<string, string> = { NO_COLOR: "1", TERM: "dumb" };

  // System essentials
  for (const key of [
    "HOME", "PATH", "USER", "LOGNAME", "SHELL", "TMPDIR", "TMP", "TEMP",
    "USERPROFILE", "APPDATA", "LOCALAPPDATA", "SystemRoot", "PATHEXT",
    "HOMEDRIVE", "HOMEPATH", "ComSpec",
  ]) {
    if (process.env[key]) env[key] = process.env[key]!;
  }

  // API keys from config file (UI-configured) take priority over env vars
  const configKeys = getEffectiveApiKeys();
  Object.assign(env, configKeys);

  // Additional API keys and config dirs from env (fallback for keys not in config)
  for (const key of [
    "GOOGLE_APPLICATION_CREDENTIALS", "ANTHROPIC_API_KEY", "CLAUDE_API_KEY",
    "CODEX_API_KEY", "OPENAI_API_KEY", "XDG_CONFIG_HOME", "XDG_DATA_HOME",
    "XDG_CACHE_HOME", "XDG_RUNTIME_DIR", "DBUS_SESSION_BUS_ADDRESS",
  ]) {
    if (!env[key] && process.env[key]) env[key] = process.env[key]!;
  }

  return env;
}

// ── CLI Config Builder ───────────────────────────────────────────────────────

/**
 * Build the command configuration for a specific CLI tool.
 * The full prompt (system + user combined) is passed as a single string.
 */
function buildCliConfig(cli: CliName, fullPrompt: string): CliConfig {
  // On Windows, spawn needs shell: true to resolve .cmd/.bat wrappers
  const needsShell = process.platform === "win32";

  // Pass prompts via stdin to avoid Windows command-line length limits (~8191 chars)
  // and shell escaping issues with special characters in prompts.
  switch (cli) {
    case "claude":
      return {
        cmd: "claude",
        args: ["--print", "--permission-mode", "bypassPermissions"],
        stdinPrompt: fullPrompt,
        shell: needsShell,
      };

    case "gemini":
      // Gemini requires -p/--prompt to run in headless (non-interactive) mode.
      // The -p value is appended to stdin input, so we pipe the real prompt
      // via stdin and use a short -p trigger to activate headless mode.
      return {
        cmd: "gemini",
        args: ["-p", "Respond to the instructions above.", "--output-format", "text"],
        stdinPrompt: fullPrompt,
        shell: needsShell,
      };

    case "codex":
      return {
        cmd: "codex",
        args: ["exec"],
        stdinPrompt: fullPrompt,
        shell: true,
      };
  }
}

// ── Core Runner ──────────────────────────────────────────────────────────────

/**
 * Execute a CLI process and capture its output.
 * Handles timeouts by killing the process.
 */
function runCliProcess(config: CliConfig, timeoutMs: number): Promise<CliRunResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const env = buildMinimalEnv() as NodeJS.ProcessEnv;

    const proc: ChildProcess = spawn(config.cmd, config.args, {
      env,
      cwd: homedir(),
      shell: config.shell,
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    // Timeout safety net (in case spawn timeout doesn't fire)
    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (!proc.killed) proc.kill("SIGKILL");
      }, 2000);
    }, timeoutMs + 1000);

    if (config.stdinPrompt && proc.stdin) {
      proc.stdin.write(config.stdinPrompt, "utf8", () => {
        proc.stdin!.end();
      });
    } else if (proc.stdin) {
      proc.stdin.end();
    }

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code: number | null) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      if (killed && !stdout.trim()) {
        resolve({
          stdout: "",
          stderr: `CLI timeout: process killed after ${timeoutMs}ms`,
          exitCode: code ?? 1,
          durationMs,
        });
      } else {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0,
          durationMs,
        });
      }
    });

    proc.on("error", (err: Error) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn '${config.cmd}': ${err.message}`));
    });
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a one-shot CLI prompt for the arena.
 * Combines system prompt and user prompt, sends to the appropriate CLI,
 * and returns the raw response text.
 *
 * @param modelId - The model ID (used to determine which CLI to invoke)
 * @param systemPrompt - System-level instructions for the LLM
 * @param userPrompt - The specific prompt for this turn
 * @param timeoutMs - Maximum time to wait for response (default 30s)
 * @returns The CLI's response text
 * @throws If the CLI is not available or the call fails
 */
export async function runCliPrompt(
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<{ text: string; durationMs: number }> {
  const cli = getCliForModel(modelId);
  if (!cli) {
    throw new Error(`No CLI available for model: ${modelId}`);
  }

  // Combine system and user prompts into a single formatted prompt
  const fullPrompt = formatCombinedPrompt(systemPrompt, userPrompt);
  const config = buildCliConfig(cli, fullPrompt);

  const result = await runCliProcess(config, timeoutMs);

  if (result.exitCode !== 0 && !result.stdout.trim()) {
    throw new Error(
      `CLI '${cli}' exited with code ${result.exitCode}: ${result.stderr || "no output"}`,
    );
  }

  return {
    text: result.stdout,
    durationMs: result.durationMs,
  };
}

// ── Prompt Formatting ────────────────────────────────────────────────────────

/**
 * Combine system and user prompts into a single string for CLI input.
 * CLIs don't have a native system prompt concept, so we prepend it.
 */
function formatCombinedPrompt(systemPrompt: string, userPrompt: string): string {
  if (!systemPrompt) return userPrompt;
  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}
