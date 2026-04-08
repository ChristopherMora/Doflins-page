import { eq, count, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { doflins, userCollectionProgress, userProfiles } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";
import { computeAchievements, ACHIEVEMENTS, type AchievementInput } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();

  // All 4 queries are independent — run in parallel
  const [profileRows, totalRows, ownedRows, rarityTotals] = await Promise.all([
    db
      .select({ createdAt: userProfiles.createdAt })
      .from(userProfiles)
      .where(eq(userProfiles.supabaseUserId, user.id))
      .limit(1),
    db
      .select({ total: count() })
      .from(doflins)
      .where(eq(doflins.activo, true)),
    db
      .select({
        rareza: doflins.rareza,
        serie: doflins.serie,
      })
      .from(userCollectionProgress)
      .innerJoin(doflins, eq(doflins.id, userCollectionProgress.doflinId))
      .where(
        and(
          eq(userCollectionProgress.supabaseUserId, user.id),
          eq(userCollectionProgress.owned, true)
        )
      ),
    db
      .select({
        rareza: doflins.rareza,
        total: count(),
      })
      .from(doflins)
      .where(eq(doflins.activo, true))
      .groupBy(doflins.rareza),
  ]);

  const profile = profileRows[0];
  const totalResult = totalRows[0];

  // Build achievement input
  const ownedByRarity: Record<string, number> = {};
  const seriesSet = new Set<string>();
  for (const row of ownedRows) {
    const r = row.rareza.toLowerCase();
    ownedByRarity[r] = (ownedByRarity[r] ?? 0) + 1;
    if (row.serie) seriesSet.add(row.serie);
  }

  const totalByRarity: Record<string, number> = {};
  for (const row of rarityTotals) {
    totalByRarity[row.rareza.toLowerCase()] = row.total;
  }

  const achievementInput: AchievementInput = {
    totalOwned: ownedRows.length,
    totalDoflins: totalResult?.total ?? 0,
    ownedByRarity,
    totalByRarity,
    series: Array.from(seriesSet),
  };

  const computed = computeAchievements(achievementInput);
  const unlockedCount = computed.filter((a) => a.unlocked).length;

  return NextResponse.json({
    memberSince: profile?.createdAt?.toISOString() ?? null,
    totalOwned: ownedRows.length,
    totalDoflins: totalResult?.total ?? 0,
    unlockedAchievements: unlockedCount,
    totalAchievements: ACHIEVEMENTS.length,
  });
}
