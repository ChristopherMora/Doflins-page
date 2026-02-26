import { NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth-admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClientForMiddleware } from "@/lib/supabase/server";

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  const isAdminPage = path.startsWith("/admin");
  const isAdminApi = path.startsWith("/api/admin");
  const isLoginPage = path === "/admin/login";

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!hasSupabasePublicConfig()) {
    return response;
  }

  let userEmail: string | null = null;
  try {
    const supabase = createSupabaseServerClientForMiddleware(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    return response;
  }

  const isAdmin = isAdminEmail(userEmail);

  if (isLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/admin/doflins", request.url));
  }

  if ((isAdminPage && !isLoginPage) || isAdminApi) {
    if (!isAdmin) {
      if (isAdminApi) {
        return NextResponse.json(
          {
            status: "error",
            message: "No autorizado.",
          },
          { status: 401 },
        );
      }

      return buildLoginRedirect(request);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
