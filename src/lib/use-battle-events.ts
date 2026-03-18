"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { BattleEvent, BattleScore, BattleState } from "@/types";
import type { SSEEventType } from "@/lib/event-bus";

interface SSEMessage {
  type: SSEEventType;
  battleId: string;
  data: BattleEvent | BattleScore | BattleState | { error: string } | { round: number };
}

interface UseBattleEventsOptions {
  battleId?: string;
  onEvent?: (event: BattleEvent) => void;
  onRound?: (round: number) => void;
  onScore?: (score: BattleScore) => void;
  onEnd?: (state: BattleState) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useBattleEvents(options: UseBattleEventsOptions) {
  const {
    battleId,
    onEvent,
    onRound,
    onScore,
    onEnd,
    onError,
    enabled = true,
  } = options;

  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const url = battleId ? `/api/events?battleId=${battleId}` : "/api/events";
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      setConnected(true);
    };

    source.onerror = () => {
      setConnected(false);
      source.close();
      // Reconnect after 2s
      reconnectTimer.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    // Handle typed events
    const eventTypes: SSEEventType[] = [
      "battle:start",
      "battle:event",
      "battle:round",
      "battle:score",
      "battle:end",
      "battle:error",
    ];

    for (const eventType of eventTypes) {
      source.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const msg: SSEMessage = JSON.parse(e.data);
          switch (msg.type) {
            case "battle:event":
              onEvent?.(msg.data as BattleEvent);
              break;
            case "battle:round":
              onRound?.((msg.data as { round: number }).round);
              break;
            case "battle:score":
              onScore?.(msg.data as BattleScore);
              break;
            case "battle:end":
              onEnd?.(msg.data as BattleState);
              break;
            case "battle:error":
              onError?.((msg.data as { error: string }).error);
              break;
          }
        } catch {
          // Ignore parse errors
        }
      });
    }
  }, [battleId, enabled, onEvent, onRound, onScore, onEnd, onError]);

  useEffect(() => {
    connect();
    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    setConnected(false);
  }, []);

  return { connected, disconnect };
}
