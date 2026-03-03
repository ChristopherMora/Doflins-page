import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { doflins, userCollectionProgress } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const [allDoflins, ownedRows] = await Promise.all([
    db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        modeloBase: doflins.modeloBase,
        variante: doflins.variante,
        slug: doflins.slug,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
        rareza: doflins.rareza,
        probabilidad: doflins.probabilidad,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
      })
      .from(doflins)
      .where(eq(doflins.activo, true)),

    db
      .select({ doflinId: userCollectionProgress.doflinId })
      .from(userCollectionProgress)
      .where(eq(userCollectionProgress.supabaseUserId, user.id)),
  ]);

  const ownedIds = ownedRows.map((r) => r.doflinId);

  return NextResponse.json({
    doflins: allDoflins,
    ownedIds,
    userId: user.id,
    userEmail: user.email ?? "",
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { doflinId: number; owned: boolean };
  const { doflinId, owned } = body;

  if (!doflinId || typeof owned !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();

  if (owned) {
    await db
      .insert(userCollectionProgress)
      .values({
        supabaseUserId: user.id,
        userEmail: user.email ?? "",
        doflinId,
        owned: true,
      })
      .onDuplicateKeyUpdate({ set: { owned: true } });
  } else {
    await db
      .delete(userCollectionProgress)
      .where(
        eq(userCollectionProgress.supabaseUserId, user.id),
      );
  }

  return NextResponse.json({ ok: true });
}
