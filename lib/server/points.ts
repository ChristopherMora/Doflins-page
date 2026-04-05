/**
 * Sistema de puntos — lógica central.
 * Todas las operaciones son atómicas con SQL directo para evitar race conditions.
 */

import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { doflins, pointTransactions, userCollectionProgress, userPoints } from "@/lib/db/schema";
import type { Rarity } from "@/lib/types/doflin";

// ─── Configuración de puntos ─────────────────────────────────────────────────

export const POINTS = {
  revealScan: 10,
  rarityBonus: {
    COMMON: 0,
    RARE: 5,
    EPIC: 15,
    LEGENDARY: 30,
    ULTRA: 50,
    MYTHIC: 100,
  } satisfies Record<Rarity, number>,
  /** Puntos por cada $100 MXN gastados en Shopify */
  purchasePer100Mxn: 5,
  /** Puntos para quien refirió un usuario */
  referralUsed: 50,
  /** Puntos base por desbloquear un logro */
  achievement: 20,
} as const;

export type PointReason =
  | "reveal_scan"
  | "rarity_bonus"
  | "purchase"
  | "referral_used"
  | "achievement"
  | "manual_award"
  | "redeem"
  | "daily_claim"
  | "streak_bonus";

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Otorga (o descuenta) puntos a un usuario de forma atómica.
 * Para canjeos usa amount negativo.
 * Soporta multiplicador temporal via env POINTS_MULTIPLIER (default 1).
 */
export async function awardPoints(
  supabaseUserId: string,
  amount: number,
  reason: PointReason,
  meta?: Record<string, unknown>,
): Promise<{ newBalance: number }> {
  // Aplicar multiplicador solo a puntos positivos (no a canjeos)
  const multiplier = amount > 0
    ? Math.max(1, parseFloat(process.env.POINTS_MULTIPLIER ?? "1"))
    : 1;
  const finalAmount = amount > 0 ? Math.round(amount * multiplier) : amount;

  if (finalAmount === 0) {
    const current = await getBalance(supabaseUserId);
    return { newBalance: current };
  }

  const db = getDb();

  // Crear registro si no existe
  await db
    .insert(userPoints)
    .values({ supabaseUserId, balance: 0, totalEarned: 0 })
    .onDuplicateKeyUpdate({ set: { supabaseUserId } });

  const earned = finalAmount > 0 ? finalAmount : 0;

  await db
    .update(userPoints)
    .set({
      balance: sql`balance + ${finalAmount}`,
      totalEarned: sql`total_earned + ${earned}`,
      updatedAt: new Date(),
    })
    .where(eq(userPoints.supabaseUserId, supabaseUserId));

  await db.insert(pointTransactions).values({
    supabaseUserId,
    amount: finalAmount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reason: reason as any,
    meta: meta ? JSON.stringify(meta) : null,
    expiresAt: finalAmount > 0 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
  });

  const [row] = await db
    .select({ balance: userPoints.balance })
    .from(userPoints)
    .where(eq(userPoints.supabaseUserId, supabaseUserId))
    .limit(1);

  return { newBalance: row?.balance ?? 0 };
}

// ─── Consultas ────────────────────────────────────────────────────────────────

export async function getBalance(supabaseUserId: string): Promise<number> {
  const [row] = await getDb()
    .select({ balance: userPoints.balance })
    .from(userPoints)
    .where(eq(userPoints.supabaseUserId, supabaseUserId))
    .limit(1);
  return row?.balance ?? 0;
}

export async function getPointsData(supabaseUserId: string) {
  const db = getDb();

  const [pointsRow, txRows] = await Promise.all([
    db
      .select()
      .from(userPoints)
      .where(eq(userPoints.supabaseUserId, supabaseUserId))
      .limit(1),
    db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.supabaseUserId, supabaseUserId))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(30),
  ]);

  return {
    balance: pointsRow[0]?.balance ?? 0,
    totalEarned: pointsRow[0]?.totalEarned ?? 0,
    transactions: txRows,
  };
}

// ─── Hook: otorgar puntos al marcar una figura como obtenida ──────────────────

/**
 * Llama esto en el POST /api/progress cuando un usuario marca una figura como
 * obtenida POR PRIMERA VEZ. Revisa la rareza de la figura y da puntos base +
 * bonus de rareza.
 */
/**
 * Retorna el total de puntos otorgados (base + bonus).
 */
export async function awardRevealPoints(
  supabaseUserId: string,
  doflinId: number,
): Promise<number> {
  const db = getDb();

  // Verificar que la figura no fue ya contabilizada en puntos
  // (evita regalar puntos si el usuario desmarca y vuelve a marcar)
  const alreadyAwarded = await db
    .select({ id: pointTransactions.id })
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.supabaseUserId, supabaseUserId),
        eq(pointTransactions.reason, "reveal_scan"),
        sql`JSON_EXTRACT(meta, '$.doflinId') = ${doflinId}`,
      ),
    )
    .limit(1);

  if (alreadyAwarded.length > 0) return 0;

  // Obtener rareza
  const [figure] = await db
    .select({ rareza: doflins.rareza })
    .from(doflins)
    .where(eq(doflins.id, doflinId))
    .limit(1);

  if (!figure) return 0;

  const rareza = figure.rareza as Rarity;
  const base = POINTS.revealScan;
  const bonus = POINTS.rarityBonus[rareza] ?? 0;

  // Puntos base por el scan
  await awardPoints(supabaseUserId, base, "reveal_scan", { doflinId, rareza });

  // Bonus extra por rareza
  if (bonus > 0) {
    await awardPoints(supabaseUserId, bonus, "rarity_bonus", { doflinId, rareza });
  }

  return base + bonus;
}

// ─── Hook: otorgar puntos tras una compra en Shopify ─────────────────────────

/**
 * Calcula los puntos de una compra y los otorga.
 * amount es el total pagado en MXN (número, e.g. 350.00)
 */
export async function awardPurchasePoints(
  supabaseUserId: string,
  amountMxn: number,
  shopifyOrderId: string,
): Promise<void> {
  // Verificar que este pedido no fue ya contabilizado
  const db = getDb();
  const alreadyAwarded = await db
    .select({ id: pointTransactions.id })
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.supabaseUserId, supabaseUserId),
        eq(pointTransactions.reason, "purchase"),
        sql`JSON_EXTRACT(meta, '$.shopifyOrderId') = ${shopifyOrderId}`,
      ),
    )
    .limit(1);

  if (alreadyAwarded.length > 0) return;

  const pts = Math.floor(amountMxn / 100) * POINTS.purchasePer100Mxn;
  if (pts <= 0) return;

  await awardPoints(supabaseUserId, pts, "purchase", {
    shopifyOrderId,
    amountMxn,
  });
}

// ─── Helper: verificar stock ──────────────────────────────────────────────────

/**
 * Cuenta cuántos canjes activos (pending/processed) tiene una recompensa.
 * Retorna true si aún hay stock disponible.
 */
export async function hasStock(
  rewardId: number,
  stock: number | null,
): Promise<boolean> {
  if (stock === null) return true;

  const { rewardRedemptions } = await import("@/lib/db/schema");
  const { ne } = await import("drizzle-orm");

  const [row] = await getDb()
    .select({ count: sql<number>`CAST(COUNT(*) AS UNSIGNED)` })
    .from(rewardRedemptions)
    .where(
      and(
        eq(rewardRedemptions.rewardId, rewardId),
        ne(rewardRedemptions.status, "cancelled"),
      ),
    );

  return (row?.count ?? 0) < stock;
}

// ─── Mapa de etiquetas legibles para el historial ────────────────────────────

export const REASON_LABEL: Record<PointReason, string> = {
  reveal_scan: "Figura obtenida",
  rarity_bonus: "Bonus de rareza",
  purchase: "Compra en tienda",
  referral_used: "Código de referido",
  achievement: "Logro desbloqueado",
  manual_award: "Premio especial",
  redeem: "Canje de recompensa",
  daily_claim: "Figura del día",
  streak_bonus: "Bonus por racha",
};
