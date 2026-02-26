import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/config";

function sanitizeNextPath(rawValue: string | null): string {
  if (!rawValue || !rawValue.startsWith("/")) {
    return "/admin/doflins";
  }

  return rawValue;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  const response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/admin/login?error=oauth", request.url));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=oauth", request.url));
  }
}
