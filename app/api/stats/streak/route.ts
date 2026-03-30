import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = createSupabaseServerClientForRoute(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const db = getDb();
  const [profile] = await db
    .select({
      currentStreak: userProfiles.currentStreak,
      longestStreak: userProfiles.longestStreak,
      lastRevealDate: userProfiles.lastRevealDate,
    })
    .from(userProfiles)
    .where(eq(userProfiles.supabaseUserId, user.id))
    .limit(1);

  return NextResponse.json({
    currentStreak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    lastRevealDate: profile?.lastRevealDate ?? null,
  });
}
