import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { userCollectionProgress, userProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
// 3 minutos de caché en CDN, actualización en background
export const revalidate = 180;

interface RankingRow {
  rank: number;
  supabaseUserId: string;
  displayName: string | null;
  userEmail: string;
  total: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "Coleccionista";
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();

    const rows = await db
      .select({
        supabaseUserId: userCollectionProgress.supabaseUserId,
        userEmail: userCollectionProgress.userEmail,
        displayName: userProfiles.displayName,
        total: sql<number>`CAST(COUNT(*) AS UNSIGNED)`,
      })
      .from(userCollectionProgress)
      .leftJoin(
        userProfiles,
        eq(userProfiles.supabaseUserId, userCollectionProgress.supabaseUserId),
      )
      .where(eq(userCollectionProgress.owned, true))
      .groupBy(userCollectionProgress.supabaseUserId, userCollectionProgress.userEmail, userProfiles.displayName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(50);

    const ranking: RankingRow[] = rows.map((r, i) => ({
      rank: i + 1,
      supabaseUserId: r.supabaseUserId,
      displayName: r.displayName ?? null,
      userEmail: maskEmail(r.userEmail),
      total: r.total,
    }));

    return NextResponse.json({ ranking });
  } catch (err) {
    console.error("[ranking]", err);
    return NextResponse.json({ error: "Error al obtener ranking" }, { status: 500 });
  }
}
