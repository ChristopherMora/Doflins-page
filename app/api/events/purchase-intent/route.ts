import { NextRequest, NextResponse } from "next/server";

import { getClientIp, hashIp } from "@/lib/server/request";
import { logPurchaseIntent } from "@/lib/server/reveal-service";
import { purchaseIntentPayloadSchema } from "@/lib/validation/reveal";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = purchaseIntentPayloadSchema.parse(await request.json());
    const ip = getClientIp(request);

    await logPurchaseIntent({
      code: payload.code,
      doflinId: payload.doflinId,
      doflinIds: payload.doflinIds,
      ipHash: hashIp(ip),
      userAgent: request.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({
      status: "ok",
    });
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
