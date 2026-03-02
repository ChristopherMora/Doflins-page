import { NextRequest, NextResponse } from "next/server";

import { getCartIdFromRequest, rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { hasPaidCartBase, syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { fetchCartById } from "@/lib/server/shopify-storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_checkout", 40, 60_000);
  if (limited) {
    return limited;
  }

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json(
      {
        status: "error",
        code: "cart_not_found",
        message: "Tu carrito está vacío.",
      },
      {
        status: 404,
      },
    );
  }

  try {
    const existingCart = await fetchCartById(cartId);
    const cart = existingCart ? await syncFreeGiftForCart(cartId, existingCart) : null;
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          code: "cart_empty",
          message: "Agrega al menos un producto antes de pagar.",
        },
        {
          status: 400,
        },
      );
    }

    if (!hasPaidCartBase(cart)) {
      return NextResponse.json(
        {
          status: "error",
          code: "free_gift_requires_paid_item",
          message: "El regalo gratis requiere al menos una bolsa de pago en el carrito.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      status: "ok",
      checkoutUrl: cart.checkoutUrl,
      cart,
    });
  } catch (error) {
    console.error("cart/checkout error", error);
    return toApiErrorResponse(error);
  }
}
