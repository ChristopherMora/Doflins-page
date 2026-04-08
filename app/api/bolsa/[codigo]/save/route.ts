import { and, eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import {
  codigosBolsa,
  codigosBolsaItems,
  doflins,
  userCollectionProgress,
  userProfiles,
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

  // Verificar cuáles ya tiene ESTE USUARIO para no duplicar
  // IMPORTANTE: filtrar también por supabaseUserId, de lo contrario si otro
  // usuario ya tiene esos doflins se contarían como "ya tuyos" y no se guardarían.
  const alreadyOwned = await db
    .select({ doflinId: userCollectionProgress.doflinId })
    .from(userCollectionProgress)
    .where(
      and(
        eq(userCollectionProgress.supabaseUserId, user.id),
        inArray(userCollectionProgress.doflinId, doflinIds),
      ),
    )
    .then((rows) => new Set(rows.map((r) => r.doflinId)));

  const toInsert = doflinIds.filter((id) => !alreadyOwned.has(id));
  const toIncrement = doflinIds.filter((id) => alreadyOwned.has(id));

  // Obtener el email y nombre de Google del usuario
  const userEmail = user.email ?? "";
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  // ── Actualizar racha de reveals ────────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0]!; // "YYYY-MM-DD"
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().split("T")[0]!;

  void (async () => {
    try {
      const [profile] = await db
        .select({
          currentStreak: userProfiles.currentStreak,
          longestStreak: userProfiles.longestStreak,
          lastRevealDate: userProfiles.lastRevealDate,
        })
        .from(userProfiles)
        .where(eq(userProfiles.supabaseUserId, user.id))
        .limit(1);

      if (profile) {
        let newStreak = profile.currentStreak;
        if (profile.lastRevealDate === todayStr) {
          // misma jornada, sin cambio en la racha
        } else if (profile.lastRevealDate === yesterdayStr) {
          newStreak++;
        } else {
          newStreak = 1;
        }
        const newLongest = Math.max(newStreak, profile.longestStreak);
        await db
          .update(userProfiles)
          .set({ currentStreak: newStreak, longestStreak: newLongest, lastRevealDate: todayStr })
          .where(eq(userProfiles.supabaseUserId, user.id));
      }
    } catch {
      // No bloquear el flujo principal
    }
  })();

  // Guardar nombre de Google silenciosamente (se actualiza en cada scan)
  if (displayName) {
    void db
      .insert(userProfiles)
      .values({ supabaseUserId: user.id, displayName })
      .onDuplicateKeyUpdate({ set: { displayName } })
      .catch(() => { /* no bloquear el flujo principal */ });
  }

  // Incrementar quantity para figuras ya poseídas
  if (toIncrement.length > 0) {
    await db
      .update(userCollectionProgress)
      .set({ quantity: sql`${userCollectionProgress.quantity} + 1` })
      .where(
        and(
          eq(userCollectionProgress.supabaseUserId, user.id),
          inArray(userCollectionProgress.doflinId, toIncrement),
        ),
      )
      .catch((err) => { console.error("[bolsa save] quantity increment failed:", err); });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ saved: 0, alreadyOwned: toIncrement.length, duplicateQuantity: toIncrement.length });
  }

  // Insertar en la colección del usuario con upsert idempotente.
  // onDuplicateKeyUpdate evita el duplicate key error cuando dos requests
  // concurrentes (getUser + onAuthStateChange) pasan el check de alreadyOwned
  // casi al mismo tiempo antes de que alguna fila haya sido insertada.
  await db
    .insert(userCollectionProgress)
    .values(
      toInsert.map((doflinId) => ({
        supabaseUserId: user.id,
        userEmail,
        doflinId,
        owned: true,
        quantity: 1,
      })),
    )
    .onDuplicateKeyUpdate({ set: { owned: true, quantity: sql`${userCollectionProgress.quantity} + 1` } });

  // Obtener nombres de las figuras guardadas para la respuesta
  const savedDoflins = await db
    .select({ id: doflins.id, nombre: doflins.nombre, rareza: doflins.rareza })
    .from(doflins)
    .where(inArray(doflins.id, toInsert));

  return NextResponse.json({
    saved: toInsert.length,
    alreadyOwned: toIncrement.length,
    duplicateQuantity: toIncrement.length,
    doflins: savedDoflins,
  });
}
