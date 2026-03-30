import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";

export const revalidate = 3600; // 1 hora

const RARITY_RANK: Record<string, number> = {
  MYTHIC: 6, ULTRA: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1,
};

const SERIES_MAP: Record<string, string> = {
  animals: "Animals",
  mega: "MegaAnimals",
  multiverse: "Multiverse",
};

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();

    const rows = await db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        serie: doflins.serie,
        rareza: doflins.rareza,
        imagenUrl: doflins.imagenUrl,
      })
      .from(doflins)
      .where(eq(doflins.activo, true));

    const featured: Record<string, { id: number; imagenUrl: string; nombre: string; rareza: string }[]> = {};

    for (const [key, serieName] of Object.entries(SERIES_MAP)) {
      featured[key] = rows
        .filter((r) => r.serie === serieName)
        .sort((a, b) => (RARITY_RANK[b.rareza] ?? 0) - (RARITY_RANK[a.rareza] ?? 0))
        .slice(0, 3);
    }

    return NextResponse.json({ featured });
  } catch {
    return NextResponse.json({ featured: { animals: [], mega: [], multiverse: [] } });
  }
}
