import { describe, it, expect } from "vitest";
import {
  redActionToBattleEvent,
  mapScenarioForRedTeam,
  generateMockRedAction,
  MockRedTeamAdapter,
} from "./red-team-adapter";
import type { Scenario } from "@/types";

describe("RedTeamAdapter", () => {
  const mockScenario: Scenario = {
    id: "web-server",
    name: "Web Server",
    description: "Test scenario",
    category: "web",
    difficulty: "beginner",
    services: ["nginx", "node-api"],
    maxRounds: 10,
  };

  describe("redActionToBattleEvent", () => {
    it("should convert red team action to battle event", () => {
      const event = redActionToBattleEvent(
        {
          type: "port_scan",
          phase: "recon",
          reasoning: "Scanning ports",
          success: true,
          output: "Found open ports",
        },
        1,
      );

      expect(event.team).toBe("red");
      expect(event.phase).toBe("RECON");
      expect(event.action).toBe("port scan");
      expect(event.success).toBe(true);
      expect(event.detail).toBe("Scanning ports");
    });

    it("should map phases correctly", () => {
      const phases = ["recon", "exploit", "escalate", "exfil"];
      const expected = ["RECON", "EXPLOIT", "ESCALATE", "EXFIL"];

      phases.forEach((phase, i) => {
        const event = redActionToBattleEvent(
          { type: "noop", phase, reasoning: "test", success: true, output: "" },
          1,
        );
        expect(event.phase).toBe(expected[i]);
      });
    });
  });

  describe("mapScenarioForRedTeam", () => {
    it("should map web scenario", () => {
      const mapped = mapScenarioForRedTeam(mockScenario);
      expect(mapped.name).toBe("web-server");
      expect(mapped.targetPort).toBe(8080);
      expect(mapped.services).toEqual(["nginx", "node-api"]);
    });

    it("should map network scenario", () => {
      const networkScenario = { ...mockScenario, id: "corp-net", category: "network" as const };
      const mapped = mapScenarioForRedTeam(networkScenario);
      expect(mapped.targetPort).toBe(445);
    });
  });

  describe("generateMockRedAction", () => {
    it("should generate recon actions early", () => {
      const action = generateMockRedAction(1, 10);
      expect(action.phase).toBe("recon");
      expect(action.type).toBe("port_scan");
    });

    it("should generate exploit actions mid-battle", () => {
      const action = generateMockRedAction(4, 10);
      expect(action.phase).toBe("exploit");
    });

    it("should generate exfil actions late", () => {
      const action = generateMockRedAction(10, 10);
      expect(action.phase).toBe("exfil");
    });
  });

  describe("MockRedTeamAdapter", () => {
    it("should return valid battle events", async () => {
      const adapter = new MockRedTeamAdapter();
      const event = await adapter.executeAction(1, 10, mockScenario, []);

      expect(event.team).toBe("red");
      expect(event.timestamp).toBeGreaterThan(0);
      expect(typeof event.phase).toBe("string");
      expect(typeof event.action).toBe("string");
      expect(typeof event.success).toBe("boolean");
    });
  });
});
