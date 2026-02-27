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

function getBaseUrl(request: NextRequest): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const baseUrl = getBaseUrl(request);

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(new URL("/admin/login?error=config", baseUrl));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  const response = NextResponse.redirect(new URL(nextPath, baseUrl));

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
    return NextResponse.redirect(new URL("/admin/login", baseUrl));
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/admin/login?error=oauth", baseUrl));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", baseUrl));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=oauth", baseUrl));
  }
}
