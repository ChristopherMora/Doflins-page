import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";

import { getClientIp, hashIp } from "@/lib/server/request";
import { rateLimitResponse } from "@/lib/server/shopify-api";
import { logShopEvent } from "@/lib/server/shop-analytics";

export const dynamic = "force-dynamic";

const shopEventPayloadSchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  eventType: z.enum([
    "shop_view",
    "product_view",
    "product_click",
    "add_to_cart",
    "remove_from_cart",
    "cart_view",
    "checkout_start",
    "checkout_complete",
    "search",
    "filter",
    "wishlist_add",
    "wishlist_remove",
    "quick_view_open",
    "quick_view_close",
    "promo_click",
    "discount_apply",
  ]),
  productHandle: z.string().trim().max(120).optional(),
  productTitle: z.string().trim().max(200).optional(),
  variantId: z.string().trim().max(64).optional(),
  universe: z.string().trim().max(32).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  cartTotalCents: z.number().int().nonnegative().optional(),
  cartItemCount: z.number().int().nonnegative().optional(),
  searchQuery: z.string().trim().max(120).optional(),
  filterValue: z.string().trim().max(80).optional(),
  referrer: z.string().trim().max(200).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = rateLimitResponse(request, "events_shop", 60, 60_000);
  if (limited) return limited;

  try {
    const payload = shopEventPayloadSchema.parse(await request.json());
    const ip = getClientIp(request);

    after(async () => {
      await logShopEvent({
        ...payload,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent") ?? "unknown",
      });
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { status: "error", code: "invalid_payload" },
      { status: 400 },
    );
  }
}
