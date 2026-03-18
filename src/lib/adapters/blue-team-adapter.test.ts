import { describe, it, expect } from "vitest";
import {
  blueActionToBattleEvent,
  mapScenarioForBlueTeam,
  generateContextualBlueAction,
  MockBlueTeamAdapter,
} from "./blue-team-adapter";
import type { BattleEvent, Scenario } from "@/types";

describe("BlueTeamAdapter", () => {
  const mockScenario: Scenario = {
    id: "web-server",
    name: "Web Server",
    description: "Test scenario",
    category: "web",
    difficulty: "beginner",
    services: ["nginx", "node-api"],
    maxRounds: 10,
  };

  describe("blueActionToBattleEvent", () => {
    it("should convert blue team action to battle event", () => {
      const event = blueActionToBattleEvent(
        {
          type: "block_ip",
          phase: "respond",
          reasoning: "Blocking malicious IP",
          success: true,
          output: "IP blocked",
        },
        3,
      );

      expect(event.team).toBe("blue");
      expect(event.phase).toBe("RESPOND");
      expect(event.action).toBe("block ip");
      expect(event.success).toBe(true);
    });

    it("should map phases correctly", () => {
      const phases = ["detect", "analyze", "respond", "harden", "contain"];
      const expected = ["DETECT", "ANALYZE", "RESPOND", "HARDEN", "CONTAIN"];

      phases.forEach((phase, i) => {
        const event = blueActionToBattleEvent(
          { type: "noop", phase, reasoning: "test", success: true, output: "" },
          1,
        );
        expect(event.phase).toBe(expected[i]);
      });
    });
  });

  describe("mapScenarioForBlueTeam", () => {
    it("should map web scenario with expected attacks", () => {
      const mapped = mapScenarioForBlueTeam(mockScenario);
      expect(mapped.name).toBe("web-server");
      expect(mapped.services).toEqual(["nginx", "node-api"]);
      expect(mapped.expectedAttacks).toContain("sql_injection");
      expect(mapped.expectedAttacks).toContain("xss");
    });

    it("should map cloud scenario", () => {
      const cloudScenario = { ...mockScenario, id: "cloud", category: "cloud" as const };
      const mapped = mapScenarioForBlueTeam(cloudScenario);
      expect(mapped.expectedAttacks).toContain("metadata_access");
    });
  });

  describe("generateContextualBlueAction", () => {
    it("should respond to RECON with detection", () => {
      const redEvent: BattleEvent = {
        timestamp: Date.now(),
        team: "red",
        phase: "RECON",
        action: "port_scan",
        detail: "Scanning ports",
        success: true,
      };

      const action = generateContextualBlueAction(redEvent, 1, 10);
      expect(action.phase).toBe("detect");
      expect(action.type).toBe("analyze_logs");
      expect(action.detection).toBeDefined();
      expect(action.detection!.type).toBe("reconnaissance");
    });

    it("should respond to EXPLOIT with blocking or hardening", () => {
      const redEvent: BattleEvent = {
        timestamp: Date.now(),
        team: "red",
        phase: "EXPLOIT",
        action: "sql_injection",
        detail: "SQL injection attempt",
        success: true,
      };

      const action = generateContextualBlueAction(redEvent, 5, 10);
      expect(["respond", "harden"]).toContain(action.phase);
      expect(action.detection).toBeDefined();
      expect(action.detection!.mitreTechnique).toBe("T1190");
    });

    it("should respond to ESCALATE with containment", () => {
      const redEvent: BattleEvent = {
        timestamp: Date.now(),
        team: "red",
        phase: "ESCALATE",
        action: "priv_esc",
        detail: "Privilege escalation",
        success: true,
      };

      const action = generateContextualBlueAction(redEvent, 7, 10);
      expect(action.phase).toBe("contain");
      expect(action.type).toBe("isolate_network");
    });

    it("should respond to EXFIL with blocking", () => {
      const redEvent: BattleEvent = {
        timestamp: Date.now(),
        team: "red",
        phase: "EXFIL",
        action: "data_dump",
        detail: "Exfiltrating data",
        success: true,
      };

      const action = generateContextualBlueAction(redEvent, 9, 10);
      expect(action.phase).toBe("respond");
      expect(action.detection!.mitreTechnique).toBe("T1048");
    });
  });

  describe("MockBlueTeamAdapter", () => {
    it("should return valid battle events", async () => {
      const adapter = new MockBlueTeamAdapter();
      const redEvent: BattleEvent = {
        timestamp: Date.now(),
        team: "red",
        phase: "EXPLOIT",
        action: "xss",
        detail: "XSS attack",
        success: false,
      };

      const event = await adapter.executeAction(3, 10, mockScenario, [], redEvent);
      expect(event.team).toBe("blue");
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it("should work without a red event", async () => {
      const adapter = new MockBlueTeamAdapter();
      const event = await adapter.executeAction(1, 10, mockScenario, []);
      expect(event.team).toBe("blue");
    });
  });
});
