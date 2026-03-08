import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: nombre de Google guardado automáticamente en cada scan/save

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) return NextResponse.json({ displayName: null });

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const db = getDb();
  const [row] = await db
    .select({ displayName: userProfiles.displayName })
    .from(userProfiles)
    .where(eq(userProfiles.supabaseUserId, user.id))
    .limit(1);

  return NextResponse.json({ displayName: row?.displayName ?? null });
}

// PUT: el usuario guarda su nickname personalizado para el ranking

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) return NextResponse.json({ error: "No configurado" }, { status: 503 });
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { displayName?: unknown };
  try {
    body = (await request.json()) as { displayName?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (displayName.length < 3 || displayName.length > 30) {
    return NextResponse.json({ error: "El nombre debe tener entre 3 y 30 caracteres" }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(userProfiles)
    .values({ supabaseUserId: user.id, displayName })
    .onDuplicateKeyUpdate({ set: { displayName } });

  return NextResponse.json({ displayName });
}