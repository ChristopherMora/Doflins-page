"use client";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayerEvent(
  eventName: "ViewContent" | "PurchaseIntent",
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
