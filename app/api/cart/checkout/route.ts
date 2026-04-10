import { NextRequest, NextResponse } from "next/server";

import { getCartIdFromRequest, rateLimitResponse, toApiErrorResponse } from "@/lib/server/shopify-api";
import { hasPaidCartBase, syncFreeGiftForCart } from "@/lib/server/cart-promotions";
import { cartCheckoutBodySchema } from "@/lib/validation/shopify";
import { fetchCartById, updateCartAttributes } from "@/lib/server/shopify-storefront";

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

  let rawPayload: unknown = {};
  try {
    rawPayload = await request.json();
  } catch {
    rawPayload = {};
  }

  const parsed = cartCheckoutBodySchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "error",
        code: "invalid_payload",
        message: "Payload inválido para checkout.",
      },
      {
        status: 400,
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

    let checkoutCart = cart;
    const analytics = parsed.data.analytics;

    if (analytics) {
      const analyticsAttributes = [
        { key: "doflins_session_id", value: analytics.sessionId },
        ...(analytics.visitorId ? [{ key: "doflins_visitor_id", value: analytics.visitorId }] : []),
        ...(typeof analytics.visitNumber === "number"
          ? [{ key: "doflins_visit_number", value: String(analytics.visitNumber) }]
          : []),
        ...(analytics.utmSource ? [{ key: "doflins_utm_source", value: analytics.utmSource }] : []),
        ...(analytics.utmMedium ? [{ key: "doflins_utm_medium", value: analytics.utmMedium }] : []),
        ...(analytics.utmCampaign ? [{ key: "doflins_utm_campaign", value: analytics.utmCampaign }] : []),
        ...(analytics.deviceType ? [{ key: "doflins_device_type", value: analytics.deviceType }] : []),
        ...(analytics.universe ? [{ key: "doflins_universe", value: analytics.universe }] : []),
      ];

      try {
        checkoutCart = await updateCartAttributes(cart.id, analyticsAttributes);
      } catch (error) {
        console.error("cart/checkout analytics attribute sync error", error);
      }
    }

    return NextResponse.json({
      status: "ok",
      checkoutUrl: checkoutCart.checkoutUrl,
      cart: checkoutCart,
    });
  } catch (error) {
    console.error("cart/checkout error", error);
    return toApiErrorResponse(error);
  }
}
