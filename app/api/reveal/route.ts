import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp, hashIp } from "@/lib/server/request";
import { RevealServiceError, logScanEvent, revealDoflin } from "@/lib/server/reveal-service";
import { normalizeRevealCode } from "@/lib/validation/reveal";

export const dynamic = "force-dynamic";

function errorResponse(
  status: number,
  code: "invalid_format" | "code_not_found" | "code_blocked" | "rate_limited" | "internal_error",
  message: string,
  retryAfter?: number,
): NextResponse {
  const headers = retryAfter
    ? {
        "Retry-After": String(retryAfter),
      }
    : undefined;

  return NextResponse.json(
    {
      status: "error",
      code,
      message,
    },
    {
      status,
      headers,
    },
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const rawCode = request.nextUrl.searchParams.get("code");
  const normalizedCode = normalizeRevealCode(rawCode);

  const rateLimit = checkRateLimit(`reveal:${ip}`);
  if (!rateLimit.success) {
    await logScanEvent({
      eventType: "rate_limited",
      codeInput: rawCode?.trim().toUpperCase() || "N/A",
      ipHash,
      userAgent,
    }).catch(() => null);

    return errorResponse(
      429,
      "rate_limited",
      "Has alcanzado el límite temporal de intentos. Intenta de nuevo en un minuto.",
      rateLimit.retryAfter,
    );
  }

  if (!normalizedCode) {
    await logScanEvent({
      eventType: "invalid",
      codeInput: rawCode?.trim().toUpperCase() || "N/A",
      ipHash,
      userAgent,
    }).catch(() => null);

    return errorResponse(
      400,
      "invalid_format",
      "El código debe tener entre 6 y 12 caracteres alfanuméricos.",
    );
  }

  try {
    const reveal = await revealDoflin({
      code: normalizedCode,
      ipHash,
      userAgent,
    });

    return NextResponse.json(reveal, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return errorResponse(
        503,
        "internal_error",
        "Servicio temporalmente no disponible. La base de datos no está configurada.",
      );
    }

    if (error instanceof RevealServiceError) {
      return errorResponse(error.statusCode, error.errorCode, error.message);
    }

    return errorResponse(500, "internal_error", "No fue posible procesar el reveal en este momento.");
  }
}
