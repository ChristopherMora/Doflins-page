import { NextRequest, NextResponse } from "next/server";

import { cartLineAddBodySchema } from "@/lib/validation/shopify";
import { addCartLines, createCart, fetchCartById } from "@/lib/server/shopify-storefront";
import { syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { getCartIdFromRequest, rateLimitResponse, setCartCookie, toApiErrorResponse } from "@/lib/server/shopify-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_lines_add", 60, 60_000);
  if (limited) {
    return limited;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const parsed = cartLineAddBodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
        message: "Payload inválido para agregar productos.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const cartId = getCartIdFromRequest(request);
    let cart;

    if (!cartId) {
      cart = await createCart(parsed.data.lines);
    } else {
      const existing = await fetchCartById(cartId);
      if (!existing) {
        cart = await createCart(parsed.data.lines);
      } else {
        cart = await addCartLines(cartId, parsed.data.lines);
      }
    }

    const syncedCart = await syncFreeGiftForCart(cart.id, cart);

    const response = NextResponse.json({
      status: "ok",
      cart: syncedCart,
    });
    setCartCookie(response, syncedCart.id);
    return response;
  } catch (error) {
    console.error("cart/lines/add error", error);
    return toApiErrorResponse(error);
  }
}
