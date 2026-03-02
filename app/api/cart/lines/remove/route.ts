import { NextRequest, NextResponse } from "next/server";

import { cartLineRemoveBodySchema } from "@/lib/validation/shopify";
import { getCartIdFromRequest, rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { fetchCartById, removeCartLines } from "@/lib/server/shopify-storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_lines_remove", 60, 60_000);
  if (limited) {
    return limited;
  }

  const cartId = getCartIdFromRequest(request);
  if (!cartId) {
    return NextResponse.json(
      {
        status: "error",
        code: "cart_not_found",
        message: "No hay carrito activo para remover líneas.",
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

  const parsed = cartLineRemoveBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
        message: "Payload inválido para eliminar líneas.",
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

    const updatedCart = await removeCartLines(cartId, parsed.data.lineIds);
    const cart = await syncFreeGiftForCart(cartId, updatedCart);
    return NextResponse.json({
      status: "ok",
      cart,
    });
  } catch (error) {
    console.error("cart/lines/remove error", error);
    return toApiErrorResponse(error);
  }
}
