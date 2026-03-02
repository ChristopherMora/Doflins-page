import { NextRequest, NextResponse } from "next/server";

import { cartDiscountBodySchema } from "@/lib/validation/shopify";
import { getCartIdFromRequest, rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { fetchCartById, updateCartDiscountCodes } from "@/lib/server/shopify-storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_discount", 40, 60_000);
  if (limited) {
    return limited;
  }

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json(
      {
        status: "error",
        code: "cart_not_found",
        message: "No hay carrito activo para aplicar descuento.",
      },
      {
        status: 404,
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const parsed = cartDiscountBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
        message: "Payload inválido para descuento.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const existing = await fetchCartById(cartId);
    if (!existing) {
      return NextResponse.json(
        {
          status: "error",
          code: "cart_not_found",
          message: "Tu carrito ya no existe en Shopify.",
        },
        {
          status: 404,
        },
      );
    }

    const discountedCart = await updateCartDiscountCodes(cartId, [parsed.data.code]);
    const cart = await syncFreeGiftForCart(cartId, discountedCart);
    const applied = cart.discountCodes.find((discount) => discount.code.toLowerCase() === parsed.data.code.toLowerCase());

    return NextResponse.json({
      status: "ok",
      cart,
      coupon: {
        code: parsed.data.code,
        applied: Boolean(applied?.applicable),
      },
    });
  } catch (error) {
    console.error("cart/discount error", error);
    return toApiErrorResponse(error);
  }
}
