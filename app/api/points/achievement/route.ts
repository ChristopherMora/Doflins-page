import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { pointTransactions } from "@/lib/db/schema";
import { POINTS, awardPoints } from "@/lib/server/points";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { achievementId?: string };

  if (!body.achievementId || typeof body.achievementId !== "string") {
    return NextResponse.json({ error: "achievementId requerido" }, { status: 400 });
  }

  // Validar que el achievementId no sea demasiado largo (evitar abusos)
  if (body.achievementId.length > 64) {
    return NextResponse.json({ error: "achievementId inválido" }, { status: 400 });
  }

  const db = getDb();

  // Deduplicar: solo pagar una vez por logro
  const [existing] = await db
    .select({ id: pointTransactions.id })
    .from(pointTransactions)
    .where(
      and(
        eq(pointTransactions.supabaseUserId, user.id),
        eq(pointTransactions.reason, "achievement"),
        sql`JSON_EXTRACT(meta, '$.achievementId') = ${body.achievementId}`,
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ ok: true, pointsEarned: 0 });
  }

  await awardPoints(user.id, POINTS.achievement, "achievement", {
    achievementId: body.achievementId,
  });

  return NextResponse.json({ ok: true, pointsEarned: POINTS.achievement });
}
