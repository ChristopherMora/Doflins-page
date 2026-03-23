"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";

import type { ShopCart, ShopifyMoney } from "@/lib/shopify/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SUPPORT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL?.trim() ??
  "https://wa.me/521234567890";

const FREE_GIFT_MIN_SUBTOTAL_ENV = Number(
  process.env.NEXT_PUBLIC_FREE_GIFT_MIN_SUBTOTAL ?? 250,
);
const FREE_GIFT_MIN_SUBTOTAL =
  Number.isFinite(FREE_GIFT_MIN_SUBTOTAL_ENV) && FREE_GIFT_MIN_SUBTOTAL_ENV > 0
    ? FREE_GIFT_MIN_SUBTOTAL_ENV
    : null;

function formatMoney(money: ShopifyMoney | null | undefined): string {
  if (!money) return "$0.00";
  const amount = Number.parseFloat(money.amount);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: money.currencyCode || "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatAmount(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currencyCode || "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface CartResponse {
  status: "ok";
  cart: ShopCart | null;
}
interface CheckoutResponse {
  status: "ok";
  checkoutUrl: string;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? "Error inesperado");
  }
  return data as T;
}

export function GlobalCartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [mutatingLineIds, setMutatingLineIds] = useState<Set<string>>(new Set());
  const [discountCode, setDiscountCode] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const cartRef = useRef<ShopCart | null>(null);
  cartRef.current = cart;

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", { method: "GET", cache: "no-store" });
      const data = await parseResponse<CartResponse>(res);
      setCart(data.cart);
    } catch {
      // ignorar error silencioso
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Abrir desde cualquier parte de la app
  useEffect(() => {
    const onOpen = () => {
      setIsOpen(true);
      void loadCart();
    };
    window.addEventListener("doflins:open-cart", onOpen);
    return () => window.removeEventListener("doflins:open-cart", onOpen);
  }, [loadCart]);

  // Refrescar cuando se agrega algo al carrito
  useEffect(() => {
    const onUpdated = () => {
      void loadCart();
    };
    window.addEventListener("doflins:cart-updated", onUpdated);
    return () => window.removeEventListener("doflins:cart-updated", onUpdated);
  }, [loadCart]);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    const prev = cartRef.current;
    setMutatingLineIds((s) => new Set(s).add(lineId));
    setCart((c) =>
      c
        ? {
            ...c,
            lines: c.lines.map((l) =>
              l.id === lineId
                ? {
                    ...l,
                    quantity,
                    lineTotal: {
                      ...l.lineTotal,
                      amount: String(
                        (Number(l.pricePerUnit.amount) * quantity).toFixed(2),
                      ),
                    },
                  }
                : l,
            ),
          }
        : c,
    );
    try {
      const res = await fetch("/api/cart/lines/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: [{ id: lineId, quantity }] }),
      });
      const data = await parseResponse<CartResponse>(res);
      setCart(data.cart);
    } catch {
      setCart(prev);
    } finally {
      setMutatingLineIds((s) => {
        const next = new Set(s);
        next.delete(lineId);
        return next;
      });
    }
  }, []);

  const removeLine = useCallback(async (lineId: string) => {
    const prev = cartRef.current;
    setMutatingLineIds((s) => new Set(s).add(lineId));
    setCart((c) =>
      c ? { ...c, lines: c.lines.filter((l) => l.id !== lineId) } : c,
    );
    try {
      const res = await fetch("/api/cart/lines/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineIds: [lineId] }),
      });
      const data = await parseResponse<CartResponse>(res);
      setCart(data.cart);
    } catch {
      setCart(prev);
    } finally {
      setMutatingLineIds((s) => {
        const next = new Set(s);
        next.delete(lineId);
        return next;
      });
    }
  }, []);

  const applyDiscount = useCallback(async () => {
    const code = discountCode.trim();
    if (!code) return;
    setIsMutating(true);
    try {
      const res = await fetch("/api/cart/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await parseResponse<CartResponse>(res);
      if (data.cart) setCart(data.cart);
    } catch {
      // ignorar
    } finally {
      setIsMutating(false);
    }
  }, [discountCode]);

  const goToCheckout = useCallback(async () => {
    setIsMutating(true);
    try {
      const res = await fetch("/api/cart/checkout", { method: "POST" });
      const data = await parseResponse<CheckoutResponse>(res);
      let url = data.checkoutUrl;
      if (giftNote.trim()) {
        url += (url.includes("?") ? "&" : "?") + `note=${encodeURIComponent(giftNote.trim())}`;
      }
      setIsOpen(false);
      window.location.href = url;
    } catch {
      // ignorar
    } finally {
      setIsMutating(false);
    }
  }, [giftNote]);

  const cartItemCount = cart?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;
  const currencyCode = cart?.subtotal.currencyCode ?? "MXN";

  const freeShippingProgress = useMemo(() => {
    if (!FREE_GIFT_MIN_SUBTOTAL || !cart) return null;
    const paidSubtotal = cart.lines
      .filter((l) => Number(l.pricePerUnit.amount) > 0)
      .reduce((sum, l) => sum + Number(l.lineTotal.amount), 0);
    const percent = Math.min(100, (paidSubtotal / FREE_GIFT_MIN_SUBTOTAL) * 100);
    const remaining = Math.max(0, FREE_GIFT_MIN_SUBTOTAL - paidSubtotal);
    return { paidSubtotal, percent, remaining, unlocked: paidSubtotal >= FREE_GIFT_MIN_SUBTOTAL };
  }, [cart]);

  const hasLines = Boolean(cart?.lines.length);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        className="flex h-full w-[min(100vw,460px)] flex-col p-0"
        side="right"
      >
        <div className="flex-1 space-y-3 overflow-y-auto p-5 pb-28">
          <SheetHeader className="space-y-0.5">
            <SheetTitle>Tu carrito DOFLINS</SheetTitle>
            <SheetDescription>
              {cartItemCount > 0
                ? `${cartItemCount} pack${cartItemCount === 1 ? "" : "s"} · ${formatMoney(cart?.total)}`
                : "Agrega packs y paga en Shopify Checkout"}
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--ink-700)]">
              <ArrowPathIcon className="h-4 w-4 animate-spin text-[var(--shop-primary-from,#4a7a4a)]" />
              <span>Cargando carrito…</span>
            </div>
          ) : null}

          {!isLoading && !hasLines ? (
            <div className="rounded-2xl border p-5 text-center" style={{ borderColor: "var(--shop-card-border,#d4ddc2)", background: "var(--shop-control-bg,#f9faf7)" }}>
              <ShoppingCartIcon className="mx-auto mb-2 h-7 w-7 text-[var(--ink-400,#9aa390)]" />
              <p className="text-sm font-medium text-[var(--ink-700,#4a5542)]">Tu carrito está vacío</p>
              <p className="mt-0.5 text-xs text-[var(--ink-500,#6b7565)]">
                Elige un pack para comenzar tu colección
              </p>
            </div>
          ) : null}

          {cart?.lines.map((line) => {
            const isFree = Number(line.pricePerUnit.amount) <= 0;
            const isMut = mutatingLineIds.has(line.id);
            return (
              <article
                key={line.id}
                className={`rounded-2xl border p-3 transition-opacity ${isMut ? "opacity-60" : ""} ${isFree ? "border-[var(--shop-chip-ring,#b8d494)] bg-[var(--shop-chip-bg,#ecf7d8)]" : "border-[var(--shop-card-border,#d4ddc2)] bg-[var(--shop-control-bg,#f9faf7)]"}`}
              >
                {isFree ? (
                  <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[var(--shop-chip-text,#4a7a2a)]">
                    🎁 Regalo gratis — se agrega al checkout
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  {line.imageUrl ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: "var(--shop-card-border,#d4ddc2)" }}>
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt ?? line.productTitle}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--ink-900,#1a2010)]">
                          {line.productTitle}
                        </p>
                        {line.variantTitle && line.variantTitle !== "Default Title" ? (
                          <p className="text-xs text-[var(--ink-500,#6b7565)]">{line.variantTitle}</p>
                        ) : null}
                        <p className="mt-0.5">
                          {isFree ? (
                            <span className="rounded-full bg-[var(--shop-chip-bg,#ecf7d8)] px-2 py-0.5 text-xs font-bold text-[var(--shop-chip-text,#4a7a2a)] ring-1 ring-[var(--shop-chip-ring,#b8d494)]">
                              Gratis
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-[var(--ink-900,#1a2010)]">
                              {formatMoney(line.lineTotal)}
                            </span>
                          )}
                        </p>
                      </div>
                      {!isFree ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 shrink-0 p-0 text-[var(--ink-400,#9aa390)] hover:text-red-500"
                          disabled={isMut}
                          onClick={() => void removeLine(line.id)}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <LockClosedIcon className="h-4 w-4 shrink-0 text-[var(--shop-chip-text,#4a7a2a)] opacity-50" />
                      )}
                    </div>
                    {!isFree ? (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={isMut || line.quantity <= 1}
                          onClick={() => void updateQuantity(line.id, Math.max(1, line.quantity - 1))}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-[1.75rem] text-center text-sm font-bold text-[var(--ink-900,#1a2010)]">
                          {line.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 p-0"
                          disabled={isMut}
                          onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </Button>
                        {isMut ? (
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-[var(--shop-primary-from,#4a7a4a)]" />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          {freeShippingProgress && hasLines ? (
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--shop-chip-ring,#b8d494)", background: "var(--shop-chip-bg,#ecf7d8)" }}>
              <div className="h-1.5 w-full" style={{ background: "var(--shop-card-border,#d4ddc2)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${freeShippingProgress.percent}%`,
                    background: "linear-gradient(90deg,var(--shop-primary-from,#4a7a4a),var(--shop-primary-to,#6a9a5a))",
                  }}
                />
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-[var(--shop-chip-text,#4a7a2a)]">
                  {freeShippingProgress.unlocked
                    ? "🚚 ¡Envío gratis desbloqueado!"
                    : `🚚 Faltan ${formatAmount(freeShippingProgress.remaining, currencyCode)} para envío gratis`}
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-600,#5a6555)]">
                  {formatAmount(freeShippingProgress.paidSubtotal, currencyCode)} de{" "}
                  {formatAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, currencyCode)}
                </p>
              </div>
            </div>
          ) : null}

          {hasLines ? (
            <div className="space-y-2 rounded-2xl border p-4 text-sm text-[var(--ink-700,#4a5542)]" style={{ borderColor: "var(--shop-card-border,#d4ddc2)", background: "var(--shop-control-bg,#f9faf7)" }}>
              <p className="flex items-center justify-between">
                <span>Subtotal</span>
                <strong className="text-[var(--ink-900,#1a2010)]">{formatMoney(cart?.subtotal)}</strong>
              </p>
              <p className="flex items-center justify-between text-base">
                <span>Total estimado</span>
                <strong className="text-[var(--ink-900,#1a2010)]">{formatMoney(cart?.total)}</strong>
              </p>
            </div>
          ) : null}

          {hasLines ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor="gc-discount-code" className="sr-only">Código de descuento</label>
                <Input
                  id="gc-discount-code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Cupón"
                  disabled={isMutating}
                />
              </div>
              <Button
                variant="secondary"
                disabled={isMutating || !discountCode.trim()}
                onClick={() => void applyDiscount()}
              >
                Aplicar
              </Button>
            </div>
          ) : null}

          {hasLines ? (
            <div className="space-y-1.5">
              <label htmlFor="gc-gift-note" className="text-xs font-medium text-[var(--ink-700,#4a5542)]">
                🎁 ¿Es un regalo? Agrega una nota (opcional)
              </label>
              <textarea
                id="gc-gift-note"
                rows={2}
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Ej: ¡Feliz cumpleaños! Esta figura es especial para ti."
                className="w-full resize-none rounded-xl border border-[var(--shop-control-border,#c8d4bc)] bg-[var(--shop-control-bg,#f9faf7)] px-3 py-2.5 text-sm text-[var(--ink-900,#1a2010)] placeholder:text-[var(--ink-500,#6b7565)] outline-none focus:ring-1 focus:ring-[var(--shop-primary-from,#4a7a4a)]"
                maxLength={280}
              />
            </div>
          ) : null}

          <div className="space-y-3 rounded-2xl border border-[#d4ddc2] bg-[#f3f8e7] p-4 text-sm text-[var(--ink-700,#4a5542)]">
            <p className="font-semibold text-[var(--ink-900,#1a2010)]">Compra con confianza</p>
            <div className="space-y-2">
              {[
                { icon: ShieldCheckIcon, title: "Pago protegido", detail: "Tu pago se procesa en Shopify Checkout con conexión segura." },
                { icon: TruckIcon, title: "Envío claro", detail: "Costos y tiempos se muestran antes de confirmar el pago." },
                { icon: ClockIcon, title: "Soporte rápido", detail: "Te atendemos por WhatsApp para cualquier duda de tu pedido." },
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="rounded-xl border border-[#d2ddba] bg-white/70 p-3">
                  <p className="flex items-center gap-2 font-medium text-[var(--ink-900,#1a2010)]">
                    <Icon className="h-4 w-4 text-[var(--shop-primary-from,#4a7a4a)]" />
                    {title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-700,#4a5542)]">{detail}</p>
                </div>
              ))}
            </div>
            <a
              className="inline-flex items-center gap-2 font-medium text-[var(--ink-900,#1a2010)] underline underline-offset-2"
              href={SUPPORT_WHATSAPP_URL}
              rel="noreferrer"
              target="_blank"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--shop-primary-from,#4a7a4a)]" />
              Hablar con soporte por WhatsApp
            </a>
          </div>
        </div>

        {hasLines ? (
          <div className="border-t p-4" style={{ borderColor: "var(--shop-card-border,#d4ddc2)", background: "var(--shop-control-bg,#f9faf7)" }}>
            <div className="mb-2 flex items-center justify-between text-sm text-[var(--ink-700,#4a5542)]">
              <span>Total estimado</span>
              <strong className="text-base text-[var(--ink-900,#1a2010)]">{formatMoney(cart?.total)}</strong>
            </div>
            <Button
              className="h-12 w-full"
              style={{ background: "linear-gradient(135deg,var(--shop-primary-from,#4a7a4a),var(--shop-primary-to,#6a9a5a))" }}
              disabled={isMutating}
              onClick={() => void goToCheckout()}
            >
              {isMutating ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCartIcon className="h-5 w-5" />
              )}
              Pagar en Shopify
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[var(--ink-700,#4a5542)]">
              <LockClosedIcon className="h-3.5 w-3.5 text-[var(--shop-primary-from,#4a7a4a)]" />
              Pago protegido en Shopify Checkout
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
