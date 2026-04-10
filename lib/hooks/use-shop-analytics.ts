"use client";

import { useCallback, useEffect, useRef } from "react";

type ShopEventType =
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

interface ShopEventPayload {
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

// ─── Persistent Visitor ID ──────────────────────────────────────────────────

const VISITOR_KEY = "doflins_visitor_id";
const VISIT_COUNT_KEY = "doflins_visit_count";
const SESSION_KEY = "doflins_shop_session";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getAndIncrementVisitNumber(): number {
  if (typeof window === "undefined") return 1;
  const LAST_VISIT_KEY = "doflins_last_visit_ts";
  const now = Date.now();
  const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || "0");
  let count = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
  // Count a new visit only if >30 min since last
  if (now - lastVisit > 30 * 60 * 1000) {
    count++;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
  }
  localStorage.setItem(LAST_VISIT_KEY, String(now));
  return count;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ─── UTM & Device Detection ────────────────────────────────────────────────

function getUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") ?? undefined;
  const utmMedium = params.get("utm_medium") ?? undefined;
  const utmCampaign = params.get("utm_campaign") ?? undefined;
  // Store in session so subsequent events preserve UTM
  if (utmSource) sessionStorage.setItem("doflins_utm_source", utmSource);
  if (utmMedium) sessionStorage.setItem("doflins_utm_medium", utmMedium);
  if (utmCampaign) sessionStorage.setItem("doflins_utm_campaign", utmCampaign);
  return {
    utmSource: utmSource ?? sessionStorage.getItem("doflins_utm_source") ?? undefined,
    utmMedium: utmMedium ?? sessionStorage.getItem("doflins_utm_medium") ?? undefined,
    utmCampaign: utmCampaign ?? sessionStorage.getItem("doflins_utm_campaign") ?? undefined,
  };
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// ─── Event Sender ───────────────────────────────────────────────────────────

function sendEvent(payload: ShopEventPayload): void {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  const utm = getUtmParams();
  const body = {
    sessionId,
    visitorId: getOrCreateVisitorId(),
    visitNumber: getAndIncrementVisitNumber(),
    ...payload,
    referrer: document.referrer?.slice(0, 200) || undefined,
    ...utm,
    deviceType: getDeviceType(),
    viewportWidth: window.innerWidth,
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
      // Silent fail — analytics should never break the app
    });
  }
}

// ─── Debounce utility ───────────────────────────────────────────────────────

function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  return useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delayMs);
    }) as T,
    [callback, delayMs],
  );
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

export function useShopAnalytics(universe?: string) {
  const hasFiredShopView = useRef(false);

  // Fire shop_view once on mount
  useEffect(() => {
    if (hasFiredShopView.current) return;
    hasFiredShopView.current = true;
    sendEvent({ eventType: "shop_view", universe });
  }, [universe]);

  const trackProductView = useCallback(
    (handle: string, title: string, priceCents?: number) => {
      sendEvent({ eventType: "product_view", productHandle: handle, productTitle: title, priceCents, universe });
    },
    [universe],
  );

  const trackProductClick = useCallback(
    (handle: string, title: string) => {
      sendEvent({ eventType: "product_click", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackAddToCart = useCallback(
    (handle: string, title: string, variantId: string, priceCents: number, quantity: number) => {
      sendEvent({
        eventType: "add_to_cart",
        productHandle: handle,
        productTitle: title,
        variantId,
        priceCents,
        quantity,
        universe,
      });
    },
    [universe],
  );

  const trackRemoveFromCart = useCallback(
    (handle: string, title: string) => {
      sendEvent({ eventType: "remove_from_cart", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackCartView = useCallback(
    (cartTotalCents: number, cartItemCount: number) => {
      sendEvent({ eventType: "cart_view", cartTotalCents, cartItemCount, universe });
    },
    [universe],
  );

  const trackCheckoutStart = useCallback(
    (cartTotalCents: number, cartItemCount: number) => {
      sendEvent({ eventType: "checkout_start", cartTotalCents, cartItemCount, universe });
    },
    [universe],
  );

  const trackSearch = useDebouncedCallback(
    useCallback(
      (query: string) => {
        if (query.length >= 2) {
          sendEvent({ eventType: "search", searchQuery: query, universe });
        }
      },
      [universe],
    ),
    800,
  );

  const trackFilter = useCallback(
    (filterValue: string) => {
      sendEvent({ eventType: "filter", filterValue, universe });
    },
    [universe],
  );

  const trackWishlistAdd = useCallback(
    (handle: string, title: string) => {
      sendEvent({ eventType: "wishlist_add", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackWishlistRemove = useCallback(
    (handle: string, title: string) => {
      sendEvent({ eventType: "wishlist_remove", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackQuickViewOpen = useCallback(
    (handle: string, title: string, priceCents?: number) => {
      sendEvent({ eventType: "quick_view_open", productHandle: handle, productTitle: title, priceCents, universe });
    },
    [universe],
  );

  const trackQuickViewClose = useCallback(
    (handle: string) => {
      sendEvent({ eventType: "quick_view_close", productHandle: handle, universe });
    },
    [universe],
  );

  const trackPromoClick = useCallback(
    () => {
      sendEvent({ eventType: "promo_click", universe });
    },
    [universe],
  );

  const trackDiscountApply = useCallback(
    (code: string) => {
      sendEvent({ eventType: "discount_apply", filterValue: code, universe });
    },
    [universe],
  );

  return {
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartView,
    trackCheckoutStart,
    trackSearch,
    trackFilter,
    trackWishlistAdd,
    trackWishlistRemove,
    trackQuickViewOpen,
    trackQuickViewClose,
    trackPromoClick,
    trackDiscountApply,
  };
}
