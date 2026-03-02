import { NextRequest, NextResponse } from "next/server";

import { clearCartCookie, getCartIdFromRequest, rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { fetchCartById } from "@/lib/server/shopify-storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_get", 60, 60_000);
  if (limited) {
    return limited;
  }

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json({
      status: "ok",
      cart: null,
    });
  }

  try {
    const cart = await fetchCartById(cartId);
    if (!cart) {
      const response = NextResponse.json({
        status: "ok",
        cart: null,
      });
      clearCartCookie(response);
      return response;
    }

    const syncedCart = await syncFreeGiftForCart(cartId, cart);

    return NextResponse.json({
      status: "ok",
      cart: syncedCart,
    });
  } catch (error) {
    console.error("cart/get error", error);
    return toApiErrorResponse(error);
  }
}
