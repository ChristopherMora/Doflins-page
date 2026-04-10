"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, ShoppingCartIcon, XCircleIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import type { ShopCart } from "@/lib/shopify/types";
import { writeCartSnapshot } from "@/components/shop/shop-utils";
import { sendShopEvent } from "@/lib/shop/shop-analytics-client";

interface AddToCartAnalyticsPayload {
  productHandle: string;
  priceCents: number;
  quantity?: number;
  universe?: string | null;
}

interface AddToCartButtonProps {
  variantId: string;
  productTitle: string;
  isSoldOut: boolean;
  className?: string;
  label?: string;
  onClick?: () => void;
  analytics?: AddToCartAnalyticsPayload;
}

export function AddToCartButton({
  variantId,
  productTitle,
  isSoldOut,
  className,
  label,
  onClick,
  analytics,
}: AddToCartButtonProps): React.JSX.Element {
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle");

  const handleClick = async () => {
    if (state === "adding" || isSoldOut) return;
    onClick?.();
    setState("adding");
    try {
      const res = await fetch("/api/cart/lines/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: [{ merchandiseId: variantId, quantity: 1 }] }),
      });
      if (!res.ok) throw new Error("cart_error");
      const data = (await res.json()) as { cart?: ShopCart };
      if (data.cart) {
        writeCartSnapshot(data.cart);
        window.dispatchEvent(new Event("doflins:cart-updated"));
      }
      if (analytics) {
        sendShopEvent({
          eventType: "add_to_cart",
          productHandle: analytics.productHandle,
          productTitle,
          variantId,
          priceCents: analytics.priceCents,
          quantity: analytics.quantity ?? 1,
          universe: analytics.universe ?? undefined,
        });
      }
      setState("added");
      setTimeout(() => setState("idle"), 3500);
      toast.success(`${productTitle} agregado al carrito 🛒`, {
        action: {
          label: "Ver carrito",
          onClick: () => {
            window.location.href = "/#compras";
          },
        },
        duration: 5000,
      });
    } catch {
      setState("error");
      toast.error("No se pudo agregar al carrito. Intenta de nuevo.");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  if (isSoldOut) {
    return (
      <Button className="h-12 w-full" disabled>
        <XCircleIcon className="h-5 w-5" /> Agotado
      </Button>
    );
  }

  return (
    <Button
      onClick={() => void handleClick()}
      disabled={state === "adding"}
      className={`h-12 w-full transition-all duration-300 ${
        state === "added"
          ? "bg-[linear-gradient(135deg,#2a5a18,#4a7c28)]"
          : state === "error"
            ? "bg-[linear-gradient(135deg,#8a2020,#b03030)]"
            : (className ?? "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] hover:brightness-110")
      }`}
    >
      {state === "adding" ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Agregando…
        </>
      ) : state === "added" ? (
        <>
          <CheckCircleIcon className="h-5 w-5" /> ¡En el carrito!
        </>
      ) : state === "error" ? (
        <>
          <XCircleIcon className="h-5 w-5" /> Error — Reintentar
        </>
      ) : (
        <>
          <ShoppingCartIcon className="h-5 w-5" /> {label ?? "Agregar al carrito"}
        </>
      )}
    </Button>
  );
}
