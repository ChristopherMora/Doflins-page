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
        className="flex h-full w-[min(100vw,420px)] flex-col gap-0 p-0"
        side="right"
      >
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-[#dde5ce] bg-[#f6faf0] px-5 py-4">
          <SheetHeader className="space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#4a7a4a,#6a9a5a)]">
                <ShoppingCartIcon className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold leading-tight text-[#1a2010]">
                  Tu carrito
                </SheetTitle>
                <SheetDescription className="text-xs text-[#6b7565]">
                  {cartItemCount > 0
                    ? `${cartItemCount} pack${cartItemCount === 1 ? "" : "s"} · ${formatMoney(cart?.total)}`
                    : "Agrega packs para empezar"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-32">

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl bg-[#f3f8e7] px-4 py-3 text-sm text-[#4a5542]">
              <ArrowPathIcon className="h-4 w-4 animate-spin text-[#4a7a4a]" />
              <span>Cargando carrito…</span>
            </div>
          ) : null}

          {!isLoading && !hasLines ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#c8d8b0] bg-[#f6faf0] py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e4f0d0]">
                <ShoppingCartIcon className="h-7 w-7 text-[#6a9a5a]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a2010]">Tu carrito está vacío</p>
                <p className="mt-0.5 text-xs text-[#6b7565]">Elige un pack para comenzar tu colección</p>
              </div>
            </div>
          ) : null}

          {/* ── Line items ── */}
          {cart?.lines.map((line) => {
            const isFree = Number(line.pricePerUnit.amount) <= 0;
            const isMut = mutatingLineIds.has(line.id);
            return (
              <article
                key={line.id}
                className={`flex gap-3 rounded-2xl border p-3 transition-opacity ${isMut ? "opacity-50" : ""} ${
                  isFree
                    ? "border-[#b8d494] bg-[#ecf7d8]"
                    : "border-[#dde5ce] bg-white"
                }`}
              >
                {line.imageUrl ? (
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-[#dde5ce] bg-[#f3f8e7]">
                    <Image
                      src={line.imageUrl}
                      alt={line.imageAlt ?? line.productTitle}
                      fill
                      sizes="72px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="truncate text-sm font-bold text-[#1a2010] leading-tight">
                      {line.productTitle}
                    </p>
                    {!isFree ? (
                      <button
                        aria-label="Eliminar producto"
                        className="shrink-0 rounded-full p-1 text-[#9aa390] transition hover:bg-red-50 hover:text-red-500"
                        disabled={isMut}
                        onClick={() => void removeLine(line.id)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <LockClosedIcon className="h-4 w-4 shrink-0 text-[#4a7a2a] opacity-40" />
                    )}
                  </div>
                  {isFree ? (
                    <span className="mt-1 inline-block rounded-full bg-[#d4efb4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2f5b1f]">
                      🎁 Gratis
                    </span>
                  ) : (
                    <p className="mt-0.5 text-base font-bold text-[#1a2010]">{formatMoney(line.lineTotal)}</p>
                  )}
                  {!isFree ? (
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        aria-label="Reducir"
                        disabled={isMut || line.quantity <= 1}
                        onClick={() => void updateQuantity(line.id, Math.max(1, line.quantity - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#cdd8bb] bg-[#f3f8e7] text-[#4a5542] transition hover:bg-[#e4f0d0] disabled:opacity-30"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-bold text-[#1a2010]">
                        {line.quantity}
                      </span>
                      <button
                        aria-label="Aumentar"
                        disabled={isMut}
                        onClick={() => void updateQuantity(line.id, line.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#cdd8bb] bg-[#f3f8e7] text-[#4a5542] transition hover:bg-[#e4f0d0]"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                      {isMut ? (
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-[#4a7a4a]" />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}

          {/* ── Free shipping bar ── */}
          {freeShippingProgress && hasLines ? (
            <div className="overflow-hidden rounded-2xl border border-[#b8d494] bg-[#ecf7d8]">
              <div className="relative h-2 w-full bg-[#d4e8c0]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${freeShippingProgress.percent}%`,
                    background: "linear-gradient(90deg,#4a7a4a,#7ab85a)",
                  }}
                />
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3">
                <TruckIcon className="h-5 w-5 shrink-0 text-[#3a6a2a]" />
                <div>
                  <p className="text-sm font-bold text-[#2f5b1f]">
                    {freeShippingProgress.unlocked
                      ? "¡Envío gratis desbloqueado! 🎉"
                      : `Faltan ${formatAmount(freeShippingProgress.remaining, currencyCode)} para envío gratis`}
                  </p>
                  {!freeShippingProgress.unlocked ? (
                    <p className="text-[11px] text-[#5a7a4a]">
                      {formatAmount(freeShippingProgress.paidSubtotal, currencyCode)} de {formatAmount(FREE_GIFT_MIN_SUBTOTAL ?? 0, currencyCode)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Totals ── */}
          {hasLines ? (
            <div className="rounded-2xl border border-[#dde5ce] bg-white p-4 text-sm">
              <div className="flex items-center justify-between text-[#5a6555]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1a2010]">{formatMoney(cart?.subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-[#6b7565]">
                <span>Envío</span>
                <span>Se calcula en checkout</span>
              </div>
              <div className="mt-2 border-t border-[#eaefde] pt-2 flex items-center justify-between">
                <span className="font-semibold text-[#1a2010]">Total estimado</span>
                <span className="font-bold text-lg text-[#1a2010]">{formatMoney(cart?.total)}</span>
              </div>
            </div>
          ) : null}

          {/* ── Discount code ── */}
          {hasLines ? (
            <div className="flex gap-2">
              <label htmlFor="gc-discount-code" className="sr-only">Código de descuento</label>
              <Input
                id="gc-discount-code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Código de descuento"
                disabled={isMutating}
                className="flex-1 rounded-full"
              />
              <Button
                variant="secondary"
                className="rounded-full"
                disabled={isMutating || !discountCode.trim()}
                onClick={() => void applyDiscount()}
              >
                Aplicar
              </Button>
            </div>
          ) : null}

          {/* ── Gift note ── */}
          {hasLines ? (
            <div className="space-y-1.5">
              <label htmlFor="gc-gift-note" className="text-xs font-medium text-[#5a6555]">
                🎁 ¿Es un regalo? Agrega una nota (opcional)
              </label>
              <textarea
                id="gc-gift-note"
                rows={2}
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Ej: ¡Feliz cumpleaños! Esta figura es especial para ti."
                className="w-full resize-none rounded-2xl border border-[#cdd8bb] bg-[#f6faf0] px-3 py-2.5 text-sm text-[#1a2010] placeholder:text-[#9aa390] outline-none focus:ring-1 focus:ring-[#4a7a4a]"
                maxLength={280}
              />
            </div>
          ) : null}

          {/* ── Trust signals — compact horizontal ── */}
          <div className="rounded-2xl border border-[#dde5ce] bg-[#f6faf0] p-4">
            <div className="flex flex-col gap-2">
              {[
                { icon: ShieldCheckIcon, text: "Pago seguro en Shopify Checkout" },
                { icon: TruckIcon, text: "Envío calculado antes de pagar" },
                { icon: ClockIcon, text: "Soporte por WhatsApp" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-[#4a5542]">
                  <Icon className="h-4 w-4 shrink-0 text-[#4a7a4a]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <a
              href={SUPPORT_WHATSAPP_URL}
              rel="noreferrer"
              target="_blank"
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#2f5b1f] hover:underline"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Hablar con soporte
            </a>
          </div>
        </div>

        {/* ── Sticky checkout footer ── */}
        {hasLines ? (
          <div className="shrink-0 border-t border-[#dde5ce] bg-white px-4 pb-6 pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.07)]">
            <Button
              className="h-13 w-full rounded-2xl text-base font-bold shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#4a7a4a,#6aaa5a)", height: "52px" }}
              disabled={isMutating}
              onClick={() => void goToCheckout()}
            >
              {isMutating ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5" />
                  Pagar ahora · {formatMoney(cart?.total)}
                </>
              )}
            </Button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-[#7a8a70]">
              <LockClosedIcon className="h-3 w-3" />
              Pago protegido por Shopify
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
