import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "./event-bus-testable";
import type { SSEMessage } from "./event-bus";

// We test the EventBus class logic directly

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("should deliver events to battle-specific subscribers", () => {
    const handler = vi.fn();
    bus.subscribe("battle-1", handler);

    const msg: SSEMessage = {
      type: "battle:event",
      battleId: "battle-1",
      data: {
        timestamp: Date.now(),
        team: "red",
        phase: "RECON",
        action: "scan",
        detail: "test",
        success: true,
      },
    };

    bus.emit(msg);
    expect(handler).toHaveBeenCalledWith(msg);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not deliver events to other battles", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.subscribe("battle-1", handler1);
    bus.subscribe("battle-2", handler2);

    const msg: SSEMessage = {
      type: "battle:event",
      battleId: "battle-1",
      data: {
        timestamp: Date.now(),
        team: "red",
        phase: "RECON",
        action: "scan",
        detail: "test",
        success: true,
      },
    };

    bus.emit(msg);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it("should deliver events to global subscribers", () => {
    const handler = vi.fn();
    bus.subscribeAll(handler);

    const msg: SSEMessage = {
      type: "battle:start",
      battleId: "any-battle",
      data: {
        config: {} as never,
        status: "running",
        currentRound: 0,
        events: [],
        score: { red: {} as never, blue: {} as never },
        costSoFar: 0,
      },
    };

    bus.emit(msg);
    expect(handler).toHaveBeenCalledWith(msg);
  });

  it("should support unsubscribe", () => {
    const handler = vi.fn();
    const unsub = bus.subscribe("battle-1", handler);

    bus.emit({
      type: "battle:event",
      battleId: "battle-1",
      data: { timestamp: 0, team: "red", phase: "RECON", action: "scan", detail: "a", success: true },
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unsub();

    bus.emit({
      type: "battle:event",
      battleId: "battle-1",
      data: { timestamp: 0, team: "red", phase: "RECON", action: "scan", detail: "b", success: true },
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should report subscriber count", () => {
    expect(bus.subscriberCount("battle-1")).toBe(0);

    bus.subscribe("battle-1", vi.fn());
    expect(bus.subscriberCount("battle-1")).toBe(1);

    bus.subscribeAll(vi.fn());
    expect(bus.subscriberCount("battle-1")).toBe(2);
  });

  it("should clean up battle subscribers", () => {
    const handler = vi.fn();
    bus.subscribe("battle-1", handler);
    expect(bus.subscriberCount("battle-1")).toBeGreaterThan(0);

    bus.cleanup("battle-1");

    bus.emit({
      type: "battle:event",
      battleId: "battle-1",
      data: { timestamp: 0, team: "red", phase: "RECON", action: "scan", detail: "a", success: true },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should not crash when subscriber throws", () => {
    const badHandler = vi.fn(() => { throw new Error("boom"); });
    const goodHandler = vi.fn();
    bus.subscribe("battle-1", badHandler);
    bus.subscribe("battle-1", goodHandler);

    bus.emit({
      type: "battle:event",
      battleId: "battle-1",
      data: { timestamp: 0, team: "red", phase: "RECON", action: "scan", detail: "a", success: true },
    });

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });
});
