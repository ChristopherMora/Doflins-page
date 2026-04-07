import { type NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";

// ── JSON body parsing ───────────────────────────────────────────────────────

/**
 * Safely parse the request JSON body. Returns a tuple:
 * `[body, null]` on success, `[null, NextResponse]` on failure.
 */
export async function parseJsonBody<T = unknown>(
  request: Request | NextRequest,
): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = (await request.json()) as T;
    return [body, null];
  } catch {
    return [null, NextResponse.json({ error: "JSON inválido" }, { status: 400 })];
  }
}

// ── Integer param parsing ───────────────────────────────────────────────────

/**
 * Parse a string as a positive integer. Returns the number or `null`.
 */
export function parsePositiveInt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

// ── Rate limit helper ────────────────────────────────────────────────────────

/**
 * Apply rate limiting. Returns `null` if allowed, or a 429 `NextResponse` if blocked.
 */
export function applyRateLimit(
  request: NextRequest,
  feature: string,
  limit: number,
  windowMs = 60_000,
): NextResponse | null {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`${feature}:${ip}`, limit, windowMs);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  return null;
}

// ── Error responses ──────────────────────────────────────────────────────────

export function unauthorized(message = "No autenticado"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "No encontrado"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Error interno del servidor"): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}
