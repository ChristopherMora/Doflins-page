"use client";

import { useCallback, useEffect, useRef } from "react";
import { sendShopEvent } from "@/lib/shop/shop-analytics-client";

// ─── Debounce utility ───────────────────────────────────────────────────────

function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delayMs);
    },
    [callback, delayMs],
  );
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

export function useShopAnalytics(universe?: string) {
  const trackShopView = useCallback(
    () => {
      sendShopEvent({ eventType: "shop_view", universe });
    },
    [universe],
  );

  const trackProductView = useCallback(
    (handle: string, title: string, priceCents?: number) => {
      sendShopEvent({ eventType: "product_view", productHandle: handle, productTitle: title, priceCents, universe });
    },
    [universe],
  );

  const trackProductClick = useCallback(
    (handle: string, title: string) => {
      sendShopEvent({ eventType: "product_click", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackAddToCart = useCallback(
    (handle: string, title: string, variantId: string, priceCents: number, quantity: number) => {
      sendShopEvent({
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
      sendShopEvent({ eventType: "remove_from_cart", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackCartView = useCallback(
    (cartTotalCents: number, cartItemCount: number) => {
      sendShopEvent({ eventType: "cart_view", cartTotalCents, cartItemCount, universe });
    },
    [universe],
  );

  const trackCheckoutStart = useCallback(
    (cartTotalCents: number, cartItemCount: number) => {
      sendShopEvent({ eventType: "checkout_start", cartTotalCents, cartItemCount, universe });
    },
    [universe],
  );

  const trackSearch = useDebouncedCallback(
    useCallback(
      (query: string) => {
        if (query.length >= 2) {
          sendShopEvent({ eventType: "search", searchQuery: query, universe });
        }
      },
      [universe],
    ),
    800,
  );

  const trackFilter = useCallback(
    (filterValue: string) => {
      sendShopEvent({ eventType: "filter", filterValue, universe });
    },
    [universe],
  );

  const trackWishlistAdd = useCallback(
    (handle: string, title: string) => {
      sendShopEvent({ eventType: "wishlist_add", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackWishlistRemove = useCallback(
    (handle: string, title: string) => {
      sendShopEvent({ eventType: "wishlist_remove", productHandle: handle, productTitle: title, universe });
    },
    [universe],
  );

  const trackQuickViewOpen = useCallback(
    (handle: string, title: string, priceCents?: number) => {
      sendShopEvent({ eventType: "quick_view_open", productHandle: handle, productTitle: title, priceCents, universe });
    },
    [universe],
  );

  const trackQuickViewClose = useCallback(
    (handle: string) => {
      sendShopEvent({ eventType: "quick_view_close", productHandle: handle, universe });
    },
    [universe],
  );

  const trackPromoClick = useCallback(
    () => {
      sendShopEvent({ eventType: "promo_click", universe });
    },
    [universe],
  );

  const trackDiscountApply = useCallback(
    (code: string) => {
      sendShopEvent({ eventType: "discount_apply", filterValue: code, universe });
    },
    [universe],
  );

  return {
    trackShopView,
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
