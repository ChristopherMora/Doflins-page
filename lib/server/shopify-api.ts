import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp, hashIp } from "@/lib/server/request";
import { ShopifyStorefrontError } from "@/lib/server/shopify-storefront";

export const SHOPIFY_CART_COOKIE = "doflins_cart_id";
const SHOPIFY_CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function setCartCookie(response: NextResponse, cartId: string): void {
  response.cookies.set({
    name: SHOPIFY_CART_COOKIE,
    value: cartId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SHOPIFY_CART_COOKIE_MAX_AGE,
  });
}

export function clearCartCookie(response: NextResponse): void {
  response.cookies.set({
    name: SHOPIFY_CART_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getCartIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SHOPIFY_CART_COOKIE)?.value ?? null;
}

export function rateLimitResponse(
  request: NextRequest,
  bucket: string,
  limit = 45,
  windowMs = 60_000,
): NextResponse | null {
  const ipHash = hashIp(getClientIp(request));
  const result = checkRateLimit(`${bucket}:${ipHash}`, limit, windowMs);
  if (result.success) {
    return null;
  }

  return NextResponse.json(
    {
      status: "error",
      code: "rate_limited",
      message: "Demasiadas solicitudes, intenta de nuevo en un minuto.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
      },
    },
  );
}

export function toApiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ShopifyStorefrontError) {
    return NextResponse.json(
      {
        status: "error",
        code: error.code,
        message: error.message,
      },
      {
        status: error.statusCode,
      },
    );
  }

  return NextResponse.json(
    {
      status: "error",
      code: "internal_error",
      message: "No se pudo completar la operación con Shopify.",
    },
    {
      status: 500,
    },
  );
}

