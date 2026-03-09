import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { doflins, userCollectionProgress } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/collection/history
 * Devuelve las últimas figuras obtenidas por el usuario autenticado,
 * ordenadas por fecha de adquisición descendente.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "Auth no configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();

  const rows = await db
    .select({
      id: userCollectionProgress.id,
      doflinId: userCollectionProgress.doflinId,
      obtainedAt: userCollectionProgress.createdAt,
      nombre: doflins.nombre,
      rareza: doflins.rareza,
      imagenUrl: doflins.imagenUrl,
      serie: doflins.serie,
      numeroColeccion: doflins.numeroColeccion,
    })
    .from(userCollectionProgress)
    .innerJoin(doflins, eq(userCollectionProgress.doflinId, doflins.id))
    .where(eq(userCollectionProgress.supabaseUserId, user.id))
    .orderBy(desc(userCollectionProgress.createdAt))
    .limit(50);

  return NextResponse.json({ history: rows });
}
