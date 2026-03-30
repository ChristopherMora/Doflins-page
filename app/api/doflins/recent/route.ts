import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";

export const revalidate = 1800; // 30 minutos

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
        slug: doflins.slug,
        createdAt: doflins.createdAt,
      })
      .from(doflins)
      .where(eq(doflins.activo, true))
      .orderBy(desc(doflins.createdAt))
      .limit(10);

    return NextResponse.json({ figures: rows });
  } catch {
    return NextResponse.json({ figures: [] });
  }
}
