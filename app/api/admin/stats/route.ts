import { and, count, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getDb } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins, scanEvents } from "@/lib/db/schema";
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

  const [revealsByDay, eventsByType, stockByDoflin] = await Promise.all([
    // Reveals per day (last 30 days)
    db
      .select({
        date: sql<string>`DATE(${scanEvents.createdAt})`,
        count: count(),
      })
      .from(scanEvents)
      .where(
        and(
          sql`${scanEvents.eventType} = 'reveal_success'`,
          gte(scanEvents.createdAt, since30),
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

    // Remaining bags per doflin (low stock warning ≤ 5)
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
        ),
      )
      .groupBy(doflins.id, doflins.nombre, doflins.rareza),
  ]);

  const lowStock = stockByDoflin
    .filter((row) => row.remaining <= 5)
    .sort((a, b) => a.remaining - b.remaining);

  const revealSuccessCount =
    eventsByType.find((e) => e.eventType === "reveal_success")?.count ?? 0;
  const purchaseIntentCount =
    eventsByType.find((e) => e.eventType === "purchase_intent")?.count ?? 0;
  const conversionRate =
    revealSuccessCount > 0
      ? Math.round((purchaseIntentCount / revealSuccessCount) * 1000) / 10
      : 0;

  return NextResponse.json({
    revealsByDay,
    eventsByType,
    lowStock,
    totalReveals30d: revealsByDay.reduce((sum, r) => sum + r.count, 0),
    totalEvents30d: eventsByType.reduce((sum, r) => sum + r.count, 0),
    conversionRate,
    purchaseIntentCount,
    revealSuccessCount,
  });
}
