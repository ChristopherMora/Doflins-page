"use client";

import {
  SHOP_ANALYTICS_LAST_VISIT_KEY,
  SHOP_ANALYTICS_SESSION_KEY,
  SHOP_ANALYTICS_VISIT_COUNT_KEY,
  SHOP_ANALYTICS_VISITOR_KEY,
} from "@/lib/shop/shop-analytics-shared";

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

export interface ShopEventPayload {
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
  scrollPercent?: number;
  durationMs?: number;
  metricName?: string;
  metricValue?: string;
}

export interface ShopAnalyticsContext {
  sessionId: string;
  visitorId?: string;
  visitNumber?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  viewportWidth?: number;
}

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SHOP_ANALYTICS_VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SHOP_ANALYTICS_VISITOR_KEY, id);
  }
  return id;
}

function getAndIncrementVisitNumber(): number {
  if (typeof window === "undefined") return 1;

  const now = Date.now();
  const lastVisit = Number(localStorage.getItem(SHOP_ANALYTICS_LAST_VISIT_KEY) || "0");
  let count = Number(localStorage.getItem(SHOP_ANALYTICS_VISIT_COUNT_KEY) || "0");

  if (now - lastVisit > 30 * 60 * 1000) {
    count += 1;
    localStorage.setItem(SHOP_ANALYTICS_VISIT_COUNT_KEY, String(count));
  }

  localStorage.setItem(SHOP_ANALYTICS_LAST_VISIT_KEY, String(now));
  return count;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SHOP_ANALYTICS_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SHOP_ANALYTICS_SESSION_KEY, id);
  }
  return id;
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getUtmParams(): Pick<ShopAnalyticsContext, "utmSource" | "utmMedium" | "utmCampaign"> {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") ?? undefined;
  const utmMedium = params.get("utm_medium") ?? undefined;
  const utmCampaign = params.get("utm_campaign") ?? undefined;

  if (utmSource) sessionStorage.setItem("doflins_utm_source", utmSource);
  if (utmMedium) sessionStorage.setItem("doflins_utm_medium", utmMedium);
  if (utmCampaign) sessionStorage.setItem("doflins_utm_campaign", utmCampaign);

  return {
    utmSource: utmSource ?? sessionStorage.getItem("doflins_utm_source") ?? undefined,
    utmMedium: utmMedium ?? sessionStorage.getItem("doflins_utm_medium") ?? undefined,
    utmCampaign: utmCampaign ?? sessionStorage.getItem("doflins_utm_campaign") ?? undefined,
  };
}

export function getShopAnalyticsContext(): ShopAnalyticsContext | null {
  if (typeof window === "undefined") return null;

  const sessionId = getOrCreateSessionId();
  if (!sessionId) return null;

  return {
    sessionId,
    visitorId: getOrCreateVisitorId(),
    visitNumber: getAndIncrementVisitNumber(),
    ...getUtmParams(),
    deviceType: getDeviceType(),
    viewportWidth: window.innerWidth,
  };
}

export function sendShopEvent(payload: ShopEventPayload): void {
  if (typeof window === "undefined") return;

  const analytics = getShopAnalyticsContext();
  if (!analytics) return;

  const body = {
    ...analytics,
    ...payload,
    referrer: document.referrer?.slice(0, 200) || undefined,
  };

  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  const sent = navigator.sendBeacon("/api/events/shop", blob);

  if (!sent) {
    fetch("/api/events/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      // Analytics failures should never break the storefront.
    });
  }
}
