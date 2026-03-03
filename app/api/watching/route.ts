/**
 * SSE endpoint — "X personas mirando ahora"
 * Tracks concurrent visitors per universe using an in-memory Map.
 * Each connected client sends a heartbeat every 30s; disconnect = decrement.
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Module-level counters (one per worker process — fine for single-instance apps)
const viewers = new Map<string, number>();

function increment(key: string): number {
  const next = (viewers.get(key) ?? 0) + 1;
  viewers.set(key, next);
  return next;
}

function decrement(key: string): number {
  const next = Math.max(0, (viewers.get(key) ?? 1) - 1);
  viewers.set(next === 0 ? key : key, next);
  if (next === 0) viewers.delete(key);
  return next;
}

export async function GET(request: NextRequest): Promise<Response> {
  const universe = request.nextUrl.searchParams.get("universe") ?? "animals";
  const key = `shop:${universe}`;

  let count = increment(key);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (n: number) => {
        try {
          controller.enqueue(encoder.encode(`data: ${n}\n\n`));
        } catch {
          // ignore closed stream
        }
      };

      // Send initial count
      send(count);

      // Heartbeat every 25 seconds
      const heartbeat = setInterval(() => {
        send(viewers.get(key) ?? 0);
      }, 25_000);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        count = decrement(key);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
