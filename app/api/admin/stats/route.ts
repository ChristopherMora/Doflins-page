import { and, count, countDistinct, eq, gte, sql, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import {
  codigosBolsa,
  codigosBolsaItems,
  doflins,
  referralCodes,
  scanEvents,
  userCollectionProgress,
  userProfiles,
} from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Filtro opcional por serie/universo (Animals | Multiverse)
  const serie = request.nextUrl.searchParams.get("serie") as "Animals" | "Multiverse" | null;
  const serieWhere = serie ? eq(doflins.serie, serie) : undefined;

  const [revealsByDay, eventsByType, stockByDoflin, referralStats, userStats, revealsByDoflin, revealsByHour] = await Promise.all([
    // Reveals per day (last 30 days) — with optional serie filter via codigosBolsa → doflins join
    db
      .select({
        date: sql<string>`DATE(${scanEvents.createdAt})`,
        count: count(),
      })
      .from(scanEvents)
      .innerJoin(codigosBolsa, sql`${scanEvents.codigoBolsaId} = ${codigosBolsa.id}`)
      .innerJoin(doflins, eq(codigosBolsa.doflinId, doflins.id))
      .where(
        and(
          sql`${scanEvents.eventType} = 'reveal_success'`,
          gte(scanEvents.createdAt, since30),
          serieWhere,
        ),
      )
      .groupBy(sql`DATE(${scanEvents.createdAt})`),

    // Events by type (last 30 days)
    db
      .select({
        eventType: scanEvents.eventType,
        count: count(),
      })
      .from(scanEvents)
      .where(gte(scanEvents.createdAt, since30))
      .groupBy(scanEvents.eventType),

    // Remaining bags per doflin (low stock warning ≤ 5) — with optional serie filter
    db
      .select({
        doflinId: doflins.id,
        name: doflins.nombre,
        rarity: doflins.rareza,
        remaining: count(),
      })
      .from(codigosBolsaItems)
      .innerJoin(codigosBolsa, sql`${codigosBolsaItems.codigoBolsaId} = ${codigosBolsa.id}`)
      .innerJoin(doflins, sql`${codigosBolsaItems.doflinId} = ${doflins.id}`)
      .where(
        and(
          sql`${codigosBolsa.usado} = 0`,
          sql`${codigosBolsa.status} = 'active'`,
          serieWhere,
        ),
      )
      .groupBy(doflins.id, doflins.nombre, doflins.rareza),

    // Referral summary: active codes + total uses
    db
      .select({
        activeCodes: count(),
        totalUses: sum(referralCodes.usesCount),
      })
      .from(referralCodes)
      .where(sql`${referralCodes.active} = 1`),

    // User counts
    Promise.all([
      db.select({ total: count() }).from(userProfiles),
      db.select({ total: countDistinct(userCollectionProgress.supabaseUserId) }).from(userCollectionProgress),
    ]),

    // Reveals per doflin (last 30 days) — muestra distribución real de reveals
    db
      .select({
        doflinId: doflins.id,
        name: doflins.nombre,
        rarity: doflins.rareza,
        revealCount: count(),
      })
      .from(scanEvents)
      .innerJoin(codigosBolsa, sql`${scanEvents.codigoBolsaId} = ${codigosBolsa.id}`)
      .innerJoin(doflins, sql`${codigosBolsa.doflinId} = ${doflins.id}`)
      .where(
        and(
          sql`${scanEvents.eventType} = 'reveal_success'`,
          gte(scanEvents.createdAt, since30),
          serieWhere,
        ),
      )
      .groupBy(doflins.id, doflins.nombre, doflins.rareza)
      .orderBy(sql`count(*) DESC`)
      .limit(20),

    // Reveals by hour of day (last 30 days) — para mapa de calor
    db
      .select({
        hour: sql<number>`HOUR(${scanEvents.createdAt})`,
        count: count(),
      })
      .from(scanEvents)
      .innerJoin(codigosBolsa, sql`${scanEvents.codigoBolsaId} = ${codigosBolsa.id}`)
      .innerJoin(doflins, eq(codigosBolsa.doflinId, doflins.id))
      .where(
        and(
          sql`${scanEvents.eventType} = 'reveal_success'`,
          gte(scanEvents.createdAt, since30),
          serieWhere,
        ),
      )
      .groupBy(sql`HOUR(${scanEvents.createdAt})`),
  ]);

  const lowStock = stockByDoflin
    .filter((row) => row.remaining <= 5)
    .sort((a, b) => a.remaining - b.remaining);

  const [profileStats, collectorStats] = userStats;
  const totalProfiles = profileStats[0]?.total ?? 0;
  const activeCollectors = collectorStats[0]?.total ?? 0;
  const activeReferralCodes = referralStats[0]?.activeCodes ?? 0;
  const totalReferralUses = Number(referralStats[0]?.totalUses ?? 0);

  const revealSuccessCount =
    eventsByType.find((e) => e.eventType === "reveal_success")?.count ?? 0;
  const purchaseIntentCount =
    eventsByType.find((e) => e.eventType === "purchase_intent")?.count ?? 0;
  const conversionRate =
    revealSuccessCount > 0
      ? Math.round((purchaseIntentCount / revealSuccessCount) * 1000) / 10
      : 0;

  return NextResponse.json({
    serie: serie ?? "all",
    revealsByDay,
    eventsByType,
    lowStock,
    revealsByDoflin,
    revealsByHour,
    totalReveals30d: revealsByDay.reduce((sum, r) => sum + r.count, 0),
    totalEvents30d: eventsByType.reduce((sum, r) => sum + r.count, 0),
    conversionRate,
    purchaseIntentCount,
    revealSuccessCount,
    totalProfiles,
    activeCollectors,
    activeReferralCodes,
    totalReferralUses,
  });
}
