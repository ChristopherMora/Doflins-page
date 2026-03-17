import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { awardPoints, getPointsData, type PointReason } from "@/lib/server/points";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/points
 * Otorga o descuenta puntos a un usuario manualmente.
 * Body: { supabaseUserId, amount, reason?, note? }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json()) as {
    supabaseUserId?: string;
    amount?: number;
    note?: string;
  };

  if (!body.supabaseUserId || typeof body.supabaseUserId !== "string") {
    return NextResponse.json({ error: "supabaseUserId requerido" }, { status: 400 });
  }
  if (typeof body.amount !== "number" || body.amount === 0) {
    return NextResponse.json({ error: "amount debe ser un número distinto de 0" }, { status: 400 });
  }
  if (Math.abs(body.amount) > 100_000) {
    return NextResponse.json({ error: "amount fuera de rango" }, { status: 400 });
  }

  const reason: PointReason = "manual_award";
  const { newBalance } = await awardPoints(
    body.supabaseUserId,
    body.amount,
    reason,
    { note: body.note ?? "", grantedBy: user.email },
  );

  return NextResponse.json({ ok: true, newBalance });
}

/**
 * GET /api/admin/points?userId=...
 * Consulta el saldo y transacciones de un usuario.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const data = await getPointsData(userId);
  return NextResponse.json(data);
}
