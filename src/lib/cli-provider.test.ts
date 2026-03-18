import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseResponse, isValidResponse } from "./response-parser";
import { buildRedTeamPrompt, buildBlueTeamPrompt } from "./prompt-builder";
import type { BattleEvent, Scenario } from "@/types";

// ── Response Parser Tests ────────────────────────────────────────────────────

describe("parseResponse", () => {
  describe("structured responses", () => {
    it("parses a well-formatted structured response", () => {
      const text = `PHASE: EXPLOIT
ACTION: sql_injection
TARGET: /api/login
DETAIL: Attempting blind SQL injection on login endpoint with payload: ' OR 1=1 --
SUCCESS: true`;

      const event = parseResponse(text, "red");

      expect(event.team).toBe("red");
      expect(event.phase).toBe("EXPLOIT");
      expect(event.action).toBe("sql_injection");
      expect(event.detail).toContain("SQL injection");
      expect(event.success).toBe(true);
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it("parses a blue team structured response", () => {
      const text = `PHASE: DETECT
ACTION: ids_alert
TARGET: perimeter firewall
DETAIL: IDS alert triggered for unusual scanning patterns from external IP
SUCCESS: true`;

      const event = parseResponse(text, "blue");

      expect(event.team).toBe("blue");
      expect(event.phase).toBe("DETECT");
      expect(event.action).toBe("ids_alert");
      expect(event.success).toBe(true);
    });

    it("handles case-insensitive field names", () => {
      const text = `phase: RECON
action: port_scan
target: 10.0.0.1
detail: Scanning top 1000 ports
success: false`;

      const event = parseResponse(text, "red");

      expect(event.phase).toBe("RECON");
      expect(event.action).toBe("port_scan");
      expect(event.success).toBe(false);
    });

    it("handles SUCCESS: yes/no variants", () => {
      const text = `PHASE: HARDEN
ACTION: patch_apply
TARGET: web server
DETAIL: Applying security patches
SUCCESS: yes`;

      const event = parseResponse(text, "blue");
      expect(event.success).toBe(true);
    });
  });

  describe("fallback parsing", () => {
    it("falls back to inference for unstructured text", () => {
      const text = "I performed a port scan on the target host, enumerating all TCP ports from 1 to 65535. Found open ports 22, 80, 443, and 8080.";

      const event = parseResponse(text, "red");

      expect(event.team).toBe("red");
      expect(event.phase).toBe("SCAN");
      expect(event.detail.length).toBeGreaterThan(0);
    });

    it("infers EXPLOIT phase from injection keywords", () => {
      const text = "Attempting to inject a malicious payload into the form field to achieve remote code execution.";

      const event = parseResponse(text, "red");
      expect(event.phase).toBe("EXPLOIT");
    });

    it("infers DETECT phase for blue team alert keywords", () => {
      const text = "Alert! Detected unusual network traffic patterns indicating a potential port scan from an external IP address.";

      const event = parseResponse(text, "blue");
      expect(event.phase).toBe("DETECT");
    });

    it("infers HARDEN phase for blue team patching keywords", () => {
      const text = "Applied critical security patches to the firewall configuration and hardened SSH access.";

      const event = parseResponse(text, "blue");
      expect(event.phase).toBe("HARDEN");
    });

    it("corrects phase mismatch (blue team with red phase)", () => {
      const text = `PHASE: EXPLOIT
ACTION: something
DETAIL: Blue team trying to exploit
SUCCESS: true`;

      const event = parseResponse(text, "blue");
      // Should NOT be EXPLOIT for blue team
      expect(["DETECT", "MONITOR", "HARDEN", "RESPOND", "CONTAIN", "ANALYZE"]).toContain(event.phase);
    });

    it("corrects phase mismatch (red team with blue phase)", () => {
      const text = `PHASE: DETECT
ACTION: something
DETAIL: Red team detecting things
SUCCESS: true`;

      const event = parseResponse(text, "red");
      // Should NOT be DETECT for red team
      expect(["RECON", "SCAN", "EXPLOIT", "ESCALATE", "PERSIST", "EXFIL"]).toContain(event.phase);
    });
  });

  describe("partial structured responses", () => {
    it("handles response with only some fields", () => {
      const text = `PHASE: RECON
DETAIL: Scanning the network for open services`;

      const event = parseResponse(text, "red");

      expect(event.phase).toBe("RECON");
      expect(event.detail).toContain("Scanning");
      expect(event.action).toBeTruthy(); // Should be inferred
    });

    it("handles empty response gracefully", () => {
      const event = parseResponse("", "red");

      expect(event.team).toBe("red");
      expect(event.phase).toBeTruthy();
      expect(event.action).toBeTruthy();
    });
  });
});

// ── isValidResponse Tests ────────────────────────────────────────────────────

describe("isValidResponse", () => {
  it("rejects empty strings", () => {
    expect(isValidResponse("")).toBe(false);
    expect(isValidResponse("   ")).toBe(false);
  });

  it("rejects very short strings", () => {
    expect(isValidResponse("hello")).toBe(false);
  });

  it("rejects command not found errors", () => {
    expect(isValidResponse("bash: claude: command not found")).toBe(false);
  });

  it("rejects ENOENT errors", () => {
    expect(isValidResponse("Error: ENOENT: no such file")).toBe(false);
  });

  it("accepts valid response text", () => {
    expect(isValidResponse("PHASE: RECON\nACTION: port_scan\nDETAIL: Scanning ports\nSUCCESS: true")).toBe(true);
  });

  it("accepts longer unstructured responses", () => {
    expect(isValidResponse("I will begin by scanning the target network for open ports and running services to map the attack surface.")).toBe(true);
  });
});

// ── Prompt Builder Tests ─────────────────────────────────────────────────────

describe("buildRedTeamPrompt", () => {
  const testScenario: Scenario = {
    id: "test-web",
    name: "Test Web Server",
    description: "A test web server scenario",
    category: "web",
    difficulty: "beginner",
    services: ["nginx", "node-api"],
    maxRounds: 10,
  };

  it("builds a prompt with scenario context", () => {
    const { systemPrompt, userPrompt } = buildRedTeamPrompt(testScenario, 1, []);

    expect(systemPrompt).toContain("RED TEAM");
    expect(systemPrompt).toContain("attacker");
    expect(userPrompt).toContain("Test Web Server");
    expect(userPrompt).toContain("nginx");
    expect(userPrompt).toContain("ROUND 1");
  });

  it("includes battle history when events exist", () => {
    const events: BattleEvent[] = [
      { timestamp: 1000, team: "red", phase: "RECON", action: "port_scan", detail: "Scanned ports", success: true },
      { timestamp: 2000, team: "blue", phase: "DETECT", action: "ids_alert", detail: "Alert triggered", success: true },
    ];

    const { userPrompt } = buildRedTeamPrompt(testScenario, 2, events);

    expect(userPrompt).toContain("port_scan");
    expect(userPrompt).toContain("ids_alert");
    expect(userPrompt).toContain("ROUND 2");
  });

  it("includes custom prompt when provided", () => {
    const { systemPrompt } = buildRedTeamPrompt(testScenario, 1, [], "Focus on SQL injection only");

    expect(systemPrompt).toContain("Focus on SQL injection only");
    expect(systemPrompt).toContain("ADDITIONAL STRATEGY");
  });

  it("includes structured response format instructions", () => {
    const { systemPrompt } = buildRedTeamPrompt(testScenario, 1, []);

    expect(systemPrompt).toContain("PHASE:");
    expect(systemPrompt).toContain("ACTION:");
    expect(systemPrompt).toContain("SUCCESS:");
  });
});

describe("buildBlueTeamPrompt", () => {
  const testScenario: Scenario = {
    id: "test-web",
    name: "Test Web Server",
    description: "A test web server scenario",
    category: "web",
    difficulty: "beginner",
    services: ["nginx", "node-api"],
    maxRounds: 10,
  };

  const redAction: BattleEvent = {
    timestamp: Date.now(),
    team: "red",
    phase: "EXPLOIT",
    action: "sql_injection",
    detail: "SQL injection on login form",
    success: true,
  };

  it("builds a prompt with defender role", () => {
    const { systemPrompt, userPrompt } = buildBlueTeamPrompt(testScenario, 1, [], redAction);

    expect(systemPrompt).toContain("BLUE TEAM");
    expect(systemPrompt).toContain("defender");
    expect(userPrompt).toContain("Test Web Server");
  });

  it("includes red team action context", () => {
    const { userPrompt } = buildBlueTeamPrompt(testScenario, 1, [], redAction);

    expect(userPrompt).toContain("RED TEAM JUST ACTED");
    expect(userPrompt).toContain("sql_injection");
    expect(userPrompt).toContain("succeeded");
  });

  it("includes custom prompt when provided", () => {
    const { systemPrompt } = buildBlueTeamPrompt(testScenario, 1, [], redAction, "Focus on network monitoring");

    expect(systemPrompt).toContain("Focus on network monitoring");
  });
});

// ── CLI Model Mapping Tests ──────────────────────────────────────────────────

describe("getCliForModel", () => {
  // We need to import the actual function
  // Using dynamic import to handle the child_process dependency in test environment

  it("maps claude models to claude CLI", async () => {
    const { getCliForModel } = await import("./cli-provider");
    expect(getCliForModel("claude-opus-4-6")).toBe("claude");
    expect(getCliForModel("claude-sonnet-4-6")).toBe("claude");
    expect(getCliForModel("claude-haiku-4-5")).toBe("claude");
  });

  it("maps gemini models to gemini CLI", async () => {
    const { getCliForModel } = await import("./cli-provider");
    expect(getCliForModel("gemini-2.5-pro")).toBe("gemini");
    expect(getCliForModel("gemini-2.5-flash")).toBe("gemini");
  });

  it("maps GPT/codex models to codex CLI", async () => {
    const { getCliForModel } = await import("./cli-provider");
    expect(getCliForModel("gpt-5.2-codex")).toBe("codex");
    expect(getCliForModel("gpt-5.1")).toBe("codex");
  });

  it("returns null for unknown models", async () => {
    const { getCliForModel } = await import("./cli-provider");
    expect(getCliForModel("unknown-model-xyz")).toBeNull();
  });

  it("maps grok models to null (no CLI support)", async () => {
    const { getCliForModel } = await import("./cli-provider");
    expect(getCliForModel("grok-3")).toBeNull();
  });
});
