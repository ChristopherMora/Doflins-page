import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { scanEvents, codigosBolsa, doflins } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function timeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        nombre: doflins.nombre,
        rareza: doflins.rareza,
        serie: doflins.serie,
        createdAt: scanEvents.createdAt,
      })
      .from(scanEvents)
      .innerJoin(codigosBolsa, eq(scanEvents.codigoBolsaId, codigosBolsa.id))
      .innerJoin(doflins, eq(codigosBolsa.doflinId, doflins.id))
      .where(sql`${scanEvents.eventType} = 'reveal_success'`)
      .orderBy(desc(scanEvents.createdAt))
      .limit(6);

    const now = Date.now();
    const items = rows.map((r) => ({
      nombre: r.nombre,
      rareza: r.rareza,
      serie: r.serie,
      timeAgo: timeAgo(now - (r.createdAt?.getTime() ?? now)),
    }));

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
