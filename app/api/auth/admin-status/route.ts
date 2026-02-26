import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForRoute } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json(
      {
        status: "ok",
        isAuthenticated: false,
        isAdmin: false,
        userEmail: null,
      },
      { status: 200 },
    );
  }

  try {
    const supabase = createSupabaseServerClientForRoute(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json(
      {
        status: "ok",
        isAuthenticated: Boolean(user),
        isAdmin: isAdminEmail(user?.email),
        userEmail: user?.email ?? null,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "ok",
        isAuthenticated: false,
        isAdmin: false,
        userEmail: null,
      },
      { status: 200 },
    );
  }
}
