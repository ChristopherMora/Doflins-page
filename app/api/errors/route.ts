import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ClientErrorPayload {
  message?: string;
  digest?: string;
  stack?: string;
  url?: string;
  ua?: string;
  ts?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ClientErrorPayload;
    // Sanitize: never log more than needed
    const safe = {
      message: String(body.message ?? "").slice(0, 500),
      digest: String(body.digest ?? "").slice(0, 64),
      stack: String(body.stack ?? "").slice(0, 800),
      url: String(body.url ?? "").slice(0, 256),
      ts: body.ts ?? new Date().toISOString(),
    };
    console.error("[CLIENT_ERROR]", JSON.stringify(safe));
  } catch {
    // Ignore parse errors
  }
  return NextResponse.json({ ok: true });
}
