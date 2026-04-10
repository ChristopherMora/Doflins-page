import { eq, sql, gte, and, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import {
  doflins,
  notificationPreferences,
  tradeOffers,
  userCollectionProgress,
  userPoints,
  userProfiles,
} from "@/lib/db/schema";
import { sendWeeklyDigest } from "@/lib/server/emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/cron/weekly-digest
 *
 * Envía el resumen semanal a todos los usuarios que lo tengan habilitado.
 * Protegido por CRON_SECRET para que solo lo llame un cron job externo.
 *
 * Configurar en cron (cada lunes a las 10am):
 *   curl -X POST https://doflins.dofer.mx/api/cron/weekly-digest \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Get all users with weekly digest enabled
  const subscribedUsers = await db
    .select({
      supabaseUserId: notificationPreferences.supabaseUserId,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.emailWeeklyDigest, true));

  // Get total figures count for completion percentage
  const [totalRow] = await db
    .select({ total: count() })
    .from(doflins)
    .where(eq(doflins.activo, true));
  const totalFigures = totalRow?.total ?? 0;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let sent = 0;
  let failed = 0;

  for (const { supabaseUserId } of subscribedUsers) {
    try {
      // Get user's email
      const [emailRow] = await db
        .select({ userEmail: userCollectionProgress.userEmail })
        .from(userCollectionProgress)
        .where(eq(userCollectionProgress.supabaseUserId, supabaseUserId))
        .limit(1);

      if (!emailRow?.userEmail) continue;

      // Get user profile (displayName)
      const [profile] = await db
        .select({ displayName: userProfiles.displayName })
        .from(userProfiles)
        .where(eq(userProfiles.supabaseUserId, supabaseUserId))
        .limit(1);

      // Get points balance
      const [points] = await db
        .select({ balance: userPoints.balance })
        .from(userPoints)
        .where(eq(userPoints.supabaseUserId, supabaseUserId))
        .limit(1);

      // Get collection count
      const [collectionRow] = await db
        .select({ count: count() })
        .from(userCollectionProgress)
        .where(
          and(
            eq(userCollectionProgress.supabaseUserId, supabaseUserId),
            eq(userCollectionProgress.owned, true),
          ),
        );

      // Get new trade offers in the last week
      const [tradeRow] = await db
        .select({ count: count() })
        .from(tradeOffers)
        .where(
          and(
            eq(tradeOffers.offererUserId, supabaseUserId),
            eq(tradeOffers.status, "pending"),
            gte(tradeOffers.createdAt, oneWeekAgo),
          ),
        );

      // Get best rarity owned
      const [rarityRow] = await db
        .select({ rareza: doflins.rareza })
        .from(userCollectionProgress)
        .innerJoin(doflins, eq(doflins.id, userCollectionProgress.doflinId))
        .where(
          and(
            eq(userCollectionProgress.supabaseUserId, supabaseUserId),
            eq(userCollectionProgress.owned, true),
          ),
        )
        .orderBy(
          sql`FIELD(${doflins.rareza}, 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'ULTRA', 'MYTHIC') DESC`,
        )
        .limit(1);

      const ok = await sendWeeklyDigest({
        to: emailRow.userEmail,
        displayName: profile?.displayName ?? "",
        pointsBalance: points?.balance ?? 0,
        collectionCount: collectionRow?.count ?? 0,
        totalFigures,
        newTradeOffers: tradeRow?.count ?? 0,
        topRarity: rarityRow?.rareza ?? undefined,
      });

      if (ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: subscribedUsers.length,
    sent,
    failed,
  });
}
