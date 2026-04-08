import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { pointTransactions } from "@/lib/db/schema";
import { POINTS, awardPoints } from "@/lib/server/points";
import { checkRateLimit } from "@/lib/server/rate-limit";
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

  const rl = checkRateLimit(`achievement:${user.id}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo después." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = (await request.json()) as { achievementId?: string };

  if (!body.achievementId || typeof body.achievementId !== "string") {
    return NextResponse.json({ error: "achievementId requerido" }, { status: 400 });
  }

  // Validar que el achievementId no sea demasiado largo ni tenga caracteres inválidos
  if (body.achievementId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(body.achievementId)) {
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
