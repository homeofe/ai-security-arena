/**
 * Exported EventBus class for testing.
 * The singleton instance lives in event-bus.ts.
 */

import type { SSEMessage } from "./event-bus";

type Subscriber = (msg: SSEMessage) => void;

export class EventBus {
  private subscribers = new Map<string, Set<Subscriber>>();
  private globalSubscribers = new Set<Subscriber>();

  subscribe(battleId: string, fn: Subscriber): () => void {
    if (!this.subscribers.has(battleId)) {
      this.subscribers.set(battleId, new Set());
    }
    this.subscribers.get(battleId)!.add(fn);

    return () => {
      const subs = this.subscribers.get(battleId);
      if (subs) {
        subs.delete(fn);
        if (subs.size === 0) {
          this.subscribers.delete(battleId);
        }
      }
    };
  }

  subscribeAll(fn: Subscriber): () => void {
    this.globalSubscribers.add(fn);
    return () => {
      this.globalSubscribers.delete(fn);
    };
  }

  emit(msg: SSEMessage): void {
    const subs = this.subscribers.get(msg.battleId);
    if (subs) {
      for (const fn of subs) {
        try { fn(msg); } catch { /* ignore */ }
      }
    }
    for (const fn of this.globalSubscribers) {
      try { fn(msg); } catch { /* ignore */ }
    }
  }

  subscriberCount(battleId: string): number {
    return (this.subscribers.get(battleId)?.size ?? 0) + this.globalSubscribers.size;
  }

  cleanup(battleId: string): void {
    this.subscribers.delete(battleId);
  }
}
