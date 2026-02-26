"use client";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayerEvent(
  eventName:
    | "ViewContent"
    | "PurchaseIntent"
    | "universe_switch"
    | "filter_apply"
    | "card_open"
    | "view_3d",
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload,
  });
}
