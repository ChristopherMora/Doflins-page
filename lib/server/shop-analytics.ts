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
  | "discount_apply"
  | "scroll_depth"
  | "web_vital"
  | "page_exit";

export interface LogShopEventInput {
  sessionId: string;
  visitorId?: string;
  visitNumber?: number;
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
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  viewportWidth?: number;
  scrollPercent?: number;
  durationMs?: number;
  metricName?: string;
  metricValue?: string;
  ipHash: string;
  userAgent: string;
  database?: Database;
}

export async function logShopEvent(input: LogShopEventInput): Promise<void> {
  const db = input.database ?? getDb();

  await db.insert(shopEvents).values({
    sessionId: input.sessionId.slice(0, 64),
    visitorId: input.visitorId?.slice(0, 64),
    visitNumber: input.visitNumber,
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
    utmSource: input.utmSource?.slice(0, 80),
    utmMedium: input.utmMedium?.slice(0, 80),
    utmCampaign: input.utmCampaign?.slice(0, 120),
    deviceType: input.deviceType,
    viewportWidth: input.viewportWidth,
    scrollPercent: input.scrollPercent,
    durationMs: input.durationMs,
    metricName: input.metricName?.slice(0, 40),
    metricValue: input.metricValue?.slice(0, 20),
    ipHash: input.ipHash,
    userAgent: (input.userAgent || "unknown").slice(0, 255),
  });
}
