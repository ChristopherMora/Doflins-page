import { NextRequest, NextResponse } from "next/server";

import { cartCreateBodySchema } from "@/lib/validation/shopify";
import { createCart } from "@/lib/server/shopify-storefront";
import { syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { rateLimitResponse, setCartCookie, toApiErrorResponse } from "@/lib/server/shopify-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "cart_create", 40, 60_000);
  if (limited) {
    return limited;
  }

  let rawPayload: unknown = {};
  try {
    rawPayload = await request.json();
  } catch {
    rawPayload = {};
  }

  const parsed = cartCreateBodySchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
        message: "Payload inválido para crear carrito.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const createdCart = await createCart(parsed.data.lines ?? []);
    const cart = await syncFreeGiftForCart(createdCart.id, createdCart);
    const response = NextResponse.json({
      status: "ok",
      cart,
    });
    setCartCookie(response, cart.id);
    return response;
  } catch (error) {
    console.error("cart/create error", error);
    return toApiErrorResponse(error);
  }
}
