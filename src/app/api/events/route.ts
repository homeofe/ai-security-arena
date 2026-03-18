import { eventBus, type SSEMessage } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

/**
 * SSE endpoint for real-time battle events.
 *
 * Usage:
 *   GET /api/events?battleId=battle-123
 *   GET /api/events (all battles)
 *
 * Sends events as SSE text/event-stream.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const battleId = url.searchParams.get("battleId");

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectMsg = `data: ${JSON.stringify({ type: "connected", battleId: battleId ?? "all" })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      const handler = (msg: SSEMessage) => {
        try {
          const payload = `event: ${msg.type}\ndata: ${JSON.stringify(msg)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream may be closed
        }
      };

      if (battleId) {
        unsubscribe = eventBus.subscribe(battleId, handler);
      } else {
        unsubscribe = eventBus.subscribeAll(handler);
      }

      // Keep-alive ping every 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30_000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
