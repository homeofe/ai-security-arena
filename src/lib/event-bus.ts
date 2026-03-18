import type { BattleEvent, BattleScore, BattleState } from "@/types";

/**
 * In-memory event bus for SSE broadcasting.
 * Holds per-battle subscriber lists and emits events to all connected clients.
 */

export type SSEEventType =
  | "battle:start"
  | "battle:event"
  | "battle:round"
  | "battle:score"
  | "battle:end"
  | "battle:error";

export interface SSEMessage {
  type: SSEEventType;
  battleId: string;
  data: BattleEvent | BattleScore | BattleState | { error: string } | { round: number };
}

type Subscriber = (msg: SSEMessage) => void;

class EventBus {
  private subscribers = new Map<string, Set<Subscriber>>();
  private globalSubscribers = new Set<Subscriber>();

  /** Subscribe to events for a specific battle */
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

  /** Subscribe to all battle events (for global feeds) */
  subscribeAll(fn: Subscriber): () => void {
    this.globalSubscribers.add(fn);
    return () => {
      this.globalSubscribers.delete(fn);
    };
  }

  /** Emit an event to all subscribers of a battle + global subscribers */
  emit(msg: SSEMessage): void {
    const subs = this.subscribers.get(msg.battleId);
    if (subs) {
      for (const fn of subs) {
        try {
          fn(msg);
        } catch {
          // Don't let one subscriber crash others
        }
      }
    }
    for (const fn of this.globalSubscribers) {
      try {
        fn(msg);
      } catch {
        // Don't let one subscriber crash others
      }
    }
  }

  /** Get count of subscribers for a battle */
  subscriberCount(battleId: string): number {
    return (this.subscribers.get(battleId)?.size ?? 0) + this.globalSubscribers.size;
  }

  /** Clean up all subscribers for a battle */
  cleanup(battleId: string): void {
    this.subscribers.delete(battleId);
  }
}

/** Singleton event bus */
export const eventBus = new EventBus();
