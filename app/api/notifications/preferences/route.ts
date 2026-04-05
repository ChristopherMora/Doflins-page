import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db/client";
import { notificationPreferences } from "@/lib/db/schema";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: fetch notification preferences for current user
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
  const [row] = await db
    .select({
      emailNewFigure: notificationPreferences.emailNewFigure,
      emailWeeklyDigest: notificationPreferences.emailWeeklyDigest,
      emailRewardAvailable: notificationPreferences.emailRewardAvailable,
      emailTradeRequest: notificationPreferences.emailTradeRequest,
      pushEnabled: notificationPreferences.pushEnabled,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.supabaseUserId, user.id))
    .limit(1);

  // Return defaults if no preferences exist
  const preferences = row ?? {
    emailNewFigure: true,
    emailWeeklyDigest: true,
    emailRewardAvailable: true,
    emailTradeRequest: true,
    pushEnabled: false,
  };

  return NextResponse.json({ preferences });
}

interface PreferencesBody {
  emailNewFigure?: boolean;
  emailWeeklyDigest?: boolean;
  emailRewardAvailable?: boolean;
  emailTradeRequest?: boolean;
  pushEnabled?: boolean;
}

// PUT: update notification preferences
export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: PreferencesBody;
  try {
    body = (await request.json()) as PreferencesBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Build update object with only provided fields
  const updateData: Partial<{
    emailNewFigure: boolean;
    emailWeeklyDigest: boolean;
    emailRewardAvailable: boolean;
    emailTradeRequest: boolean;
    pushEnabled: boolean;
  }> = {};

  if (typeof body.emailNewFigure === "boolean") updateData.emailNewFigure = body.emailNewFigure;
  if (typeof body.emailWeeklyDigest === "boolean") updateData.emailWeeklyDigest = body.emailWeeklyDigest;
  if (typeof body.emailRewardAvailable === "boolean") updateData.emailRewardAvailable = body.emailRewardAvailable;
  if (typeof body.emailTradeRequest === "boolean") updateData.emailTradeRequest = body.emailTradeRequest;
  if (typeof body.pushEnabled === "boolean") updateData.pushEnabled = body.pushEnabled;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No hay cambios que aplicar" }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(notificationPreferences)
    .values({
      supabaseUserId: user.id,
      ...updateData,
    })
    .onDuplicateKeyUpdate({ set: updateData });

  return NextResponse.json({ success: true });
}
