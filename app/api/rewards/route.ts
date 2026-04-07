import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { rewards, rewardRedemptions } from "@/lib/db/schema";
import { awardPoints, getBalance, hasStock } from "@/lib/server/points";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/rewards — catálogo público de recompensas activas
export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(rewards)
      .where(eq(rewards.active, true))
      .orderBy(rewards.pointsCost);

    return NextResponse.json({
      rewards: rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        pointsCost: r.pointsCost,
        type: r.type,
        stock: r.stock,
      })),
    });
  } catch (err) {
    console.error("[rewards GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/rewards — canjear una recompensa
const redeemSchema = z.object({
  rewardId: z.number().int().positive(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "Auth no configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const parsed = redeemSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "rewardId inválido" }, { status: 400 });
  }

  const db = getDb();
  const { rewardId } = parsed.data;

  // Cargar recompensa
  const [reward] = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.active, true)))
    .limit(1);

  if (!reward) {
    return NextResponse.json({ error: "Recompensa no disponible" }, { status: 404 });
  }

  // Verificar stock
  const inStock = await hasStock(rewardId, reward.stock);
  if (!inStock) {
    return NextResponse.json({ error: "Recompensa agotada" }, { status: 409 });
  }

  // Verificar saldo suficiente
  const balance = await getBalance(user.id);
  if (balance < reward.pointsCost) {
    return NextResponse.json(
      { error: `Puntos insuficientes. Tienes ${balance} pts, necesitas ${reward.pointsCost} pts.` },
      { status: 422 },
    );
  }

  // Descontar puntos (atómico)
  await awardPoints(user.id, -reward.pointsCost, "redeem", {
    rewardId: reward.id,
    rewardTitle: reward.title,
  });

  // Registrar el canje
  const [inserted] = await db
    .insert(rewardRedemptions)
    .values({
      supabaseUserId: user.id,
      rewardId: reward.id,
      pointsSpent: reward.pointsCost,
      status: "pending",
    })
    .$returningId();

  return NextResponse.json({
    ok: true,
    redemptionId: inserted?.id,
    message: "¡Canje realizado! El equipo DOFLINS procesará tu recompensa pronto.",
  });
}
