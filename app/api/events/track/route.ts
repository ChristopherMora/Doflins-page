import { NextRequest, NextResponse } from "next/server";

import { getClientIp, hashIp } from "@/lib/server/request";
import { logScanEvent } from "@/lib/server/reveal-service";
import { uxEventPayloadSchema } from "@/lib/validation/reveal";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = uxEventPayloadSchema.parse(await request.json());
    const ip = getClientIp(request);
    const codeInput =
      payload.codeInput ??
      `${payload.eventType.toUpperCase().slice(0, 12)}:${payload.source.toUpperCase().slice(0, 16)}`;

    await logScanEvent({
      eventType: payload.eventType,
      codeInput: codeInput.slice(0, 32),
      ipHash: hashIp(ip),
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
      },
      {
        status: 400,
      },
    );
  }
}
