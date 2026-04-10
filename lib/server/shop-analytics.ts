import { getDb, type Database } from "@/lib/db/client";
import { shopEvents } from "@/lib/db/schema";

export type ShopEventType =
  | "shop_view"
  | "product_view"
  | "product_click"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_view"
  | "checkout_start"
  | "checkout_complete"
  | "search"
  | "filter"
  | "wishlist_add"
  | "wishlist_remove"
  | "quick_view_open"
  | "quick_view_close"
  | "promo_click"
  | "discount_apply";

export interface LogShopEventInput {
  sessionId: string;
  eventType: ShopEventType;
  productHandle?: string;
  productTitle?: string;
  variantId?: string;
  universe?: string;
  priceCents?: number;
  quantity?: number;
  cartTotalCents?: number;
  cartItemCount?: number;
  searchQuery?: string;
  filterValue?: string;
  referrer?: string;
  ipHash: string;
  userAgent: string;
  database?: Database;
}

export async function logShopEvent(input: LogShopEventInput): Promise<void> {
  const db = input.database ?? getDb();

  await db.insert(shopEvents).values({
    sessionId: input.sessionId.slice(0, 64),
    eventType: input.eventType,
    productHandle: input.productHandle?.slice(0, 120),
    productTitle: input.productTitle?.slice(0, 200),
    variantId: input.variantId?.slice(0, 64),
    universe: input.universe?.slice(0, 32),
    priceCents: input.priceCents,
    quantity: input.quantity,
    cartTotalCents: input.cartTotalCents,
    cartItemCount: input.cartItemCount,
    searchQuery: input.searchQuery?.slice(0, 120),
    filterValue: input.filterValue?.slice(0, 80),
    referrer: input.referrer?.slice(0, 200),
    ipHash: input.ipHash,
    userAgent: (input.userAgent || "unknown").slice(0, 255),
  });
}
