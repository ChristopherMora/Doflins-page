import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/config";

function sanitizeNextPath(rawValue: string | null): string {
  if (!rawValue || !rawValue.startsWith("/")) {
    return "/reveal";
  }

  return rawValue;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(new URL("/reveal", request.url));
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
    return NextResponse.redirect(new URL("/reveal", request.url));
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/reveal?auth=oauth_error", request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/reveal?auth=oauth_error", request.url));
  }
}
