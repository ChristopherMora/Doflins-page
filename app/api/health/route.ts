import { NextResponse } from "next/server";

import { pingDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const now = new Date().toISOString();

  try {
    await pingDb();

    return NextResponse.json({
      status: "ok",
      app: "up",
      db: "up",
      timestamp: now,
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        app: "up",
        db: "down",
        timestamp: now,
      },
      {
        status: 503,
      },
    );
  }
}
