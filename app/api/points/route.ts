import { NextRequest, NextResponse } from "next/server";

import { getPointsData } from "@/lib/server/points";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";
import { REASON_LABEL } from "@/lib/server/points";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`points_get:${ip}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ balance: 0, totalEarned: 0, transactions: [] });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const data = await getPointsData(user.id);

    return NextResponse.json({
      balance: data.balance,
      totalEarned: data.totalEarned,
      transactions: data.transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        reason: tx.reason,
        label: REASON_LABEL[tx.reason as keyof typeof REASON_LABEL] ?? tx.reason,
        meta: tx.meta ? JSON.parse(tx.meta) : null,
        createdAt: tx.createdAt,
      })),
    });
  } catch (err) {
    console.error("[points GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
