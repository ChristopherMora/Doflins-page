import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicConfig } from "@/lib/supabase/config";
import { getDb } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";

function sanitizeNextPath(rawValue: string | null): string {
  if (!rawValue) return "/reveal";
  // Bloquear open redirect: //evil.com empieza con / pero es URL absoluta.
  // También bloquear /\ que algunos navegadores interpretan como absoluta.
  const trimmed = rawValue.replace(/^[/\\]+/, "/");
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/reveal";
  }
  // No permitir rutas admin desde el callback de usuarios
  if (trimmed.startsWith("/admin")) return "/reveal";
  return trimmed;
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
    return NextResponse.redirect(new URL("/reveal", baseUrl));
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
    return NextResponse.redirect(new URL("/reveal", baseUrl));
  }

  try {
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/reveal?auth=oauth_error", baseUrl));
    }

    // Guardar display_name de Google automáticamente (fire and forget)
    const user = sessionData.user;
    if (user) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null;
      if (displayName) {
        const db = getDb();
        void db
          .insert(userProfiles)
          .values({ supabaseUserId: user.id, displayName })
          .onDuplicateKeyUpdate({ set: { displayName } })
          .catch(() => {});
      }
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/reveal?auth=oauth_error", baseUrl));
  }
}
