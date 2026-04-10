"use client";

import { useEffect, useState } from "react";
import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { readCartSnapshot } from "./shop-utils";

const DISMISSED_KEY = "doflins_cart_reminder_dismissed";
/** Only show reminder if cart snapshot is older than 30 minutes */
const MIN_ABANDONED_AGE_MS = 30 * 60 * 1000;
/** Don't show if snapshot is older than 14 days (stale) */
const MAX_ABANDONED_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function AbandonedCartReminder(): React.JSX.Element | null {
  const [show, setShow] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    try {
      const dismissedAt = Number(sessionStorage.getItem(DISMISSED_KEY) || "0");
      if (dismissedAt > 0) return; // Already dismissed this session

      const snapshot = readCartSnapshot();
      if (!snapshot || snapshot.lines.length === 0) return;

      const age = Date.now() - snapshot.updatedAt;
      if (age < MIN_ABANDONED_AGE_MS || age > MAX_ABANDONED_AGE_MS) return;

      setItemCount(snapshot.lines.reduce((sum, l) => sum + l.quantity, 0));
      setShow(true);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore
    }
  };

  const openCart = () => {
    dismiss();
    window.dispatchEvent(new CustomEvent("doflins:open-cart"));
  };

  return (
    <div className="animate-in slide-in-from-top-4 fade-in duration-500 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <ShoppingCartIcon className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">
            ¡Tienes {itemCount} {itemCount === 1 ? "producto" : "productos"} esperándote!
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Tu carrito sigue aquí. Completa tu compra antes de que se agoten.
          </p>
          <button
            onClick={openCart}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
          >
            <ShoppingCartIcon className="h-3.5 w-3.5" />
            Ver mi carrito
          </button>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-amber-400 transition hover:bg-amber-100 hover:text-amber-600"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
