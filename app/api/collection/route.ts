import { NextResponse } from "next/server";

import { FALLBACK_COLLECTION } from "@/lib/constants/fallback-catalog";
import { getCollection } from "@/lib/server/reveal-service";

// ISR: la DB se consulta como máximo 1 vez por minuto en el edge
export const revalidate = 60;

export async function GET(): Promise<NextResponse> {
  try {
    const collection = await getCollection();

    return NextResponse.json({ status: "ok", collection });
  } catch {
    return NextResponse.json({
      status: "ok",
      collection: FALLBACK_COLLECTION,
      source: "fallback",
      message: "Colección cargada en modo respaldo temporal.",
    });
  }
}
