import { NextResponse } from "next/server";

import { FALLBACK_COLLECTION } from "@/lib/constants/fallback-catalog";
import { getCollection } from "@/lib/server/reveal-service";

// ISR: la DB se consulta como máximo 1 vez por minuto en el edge
export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  const cacheHeaders = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" };

  try {
    const collection = await getCollection();

    return NextResponse.json({ status: "ok", collection }, { headers: cacheHeaders });
  } catch {
    return NextResponse.json({
      status: "ok",
      collection: FALLBACK_COLLECTION,
      source: "fallback",
      message: "Colección cargada en modo respaldo temporal.",
    }, { headers: cacheHeaders });
  }
}
