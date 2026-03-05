import { NextResponse } from "next/server";

import { pingDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const now = new Date().toISOString();

  // En producción solo devolvemos el estado, sin detallar qué componente falló
  const isProd = process.env.NODE_ENV === "production";

  try {
    await pingDb();

    return NextResponse.json({
      status: "ok",
      timestamp: now,
      ...(isProd ? {} : { app: "up", db: "up" }),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: now,
        ...(isProd ? {} : { app: "up", db: "down" }),
      },
      { status: 503 },
    );
  }
}
