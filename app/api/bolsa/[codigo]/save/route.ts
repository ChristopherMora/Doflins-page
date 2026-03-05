import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import {
  codigosBolsa,
  codigosBolsaItems,
  doflins,
  userCollectionProgress,
} from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { codigo } = await params;
  const codigoNorm = codigo.toUpperCase();

  const db = getDb();

  // Buscar la bolsa
  const [bag] = await db
    .select({ id: codigosBolsa.id, status: codigosBolsa.status })
    .from(codigosBolsa)
    .where(eq(codigosBolsa.codigo, codigoNorm))
    .limit(1);

  if (!bag || bag.status === "blocked") {
    return NextResponse.json({ error: "Bolsa no encontrada" }, { status: 404 });
  }

  // Obtener los doflin IDs de la bolsa
  const items = await db
    .select({ doflinId: codigosBolsaItems.doflinId })
    .from(codigosBolsaItems)
    .where(eq(codigosBolsaItems.codigoBolsaId, bag.id));

  if (items.length === 0) {
    return NextResponse.json({ saved: 0 });
  }

  const doflinIds = items.map((i) => i.doflinId);

  // Verificar cuáles ya tiene el usuario para no duplicar
  const alreadyOwned = await db
    .select({ doflinId: userCollectionProgress.doflinId })
    .from(userCollectionProgress)
    .where(
      inArray(userCollectionProgress.doflinId, doflinIds),
    )
    .then((rows) => new Set(rows.map((r) => r.doflinId)));

  const toInsert = doflinIds.filter((id) => !alreadyOwned.has(id));

  if (toInsert.length === 0) {
    return NextResponse.json({ saved: 0, alreadyOwned: doflinIds.length });
  }

  // Obtener el email del usuario para guardarlo
  const userEmail = user.email ?? "";

  // Insertar en la colección del usuario
  await db.insert(userCollectionProgress).values(
    toInsert.map((doflinId) => ({
      supabaseUserId: user.id,
      userEmail,
      doflinId,
      owned: true,
    })),
  );

  // Obtener nombres de las figuras guardadas para la respuesta
  const savedDoflins = await db
    .select({ id: doflins.id, nombre: doflins.nombre, rareza: doflins.rareza })
    .from(doflins)
    .where(inArray(doflins.id, toInsert));

  return NextResponse.json({
    saved: toInsert.length,
    alreadyOwned: alreadyOwned.size,
    doflins: savedDoflins,
  });
}
