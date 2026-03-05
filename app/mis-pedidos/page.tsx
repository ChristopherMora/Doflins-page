"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ClipboardDocumentIcon,
  ShoppingBagIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import type { User } from "@supabase/supabase-js";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { UserAuthModal } from "@/components/auth/user-auth-modal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface OrderLineItem {
  id: number;
  title: string;
  variantTitle: string | null;
  quantity: number;
  price: string;
}

interface OrderTracking {
  company: string | null;
  number: string | null;
  url: string | null;
  status: string;
}

interface Order {
  id: number;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  totalPrice: string;
  currency: string;
  lineItems: OrderLineItem[];
  tracking: OrderTracking | null;
}

// ─── Helpers de UI ─────────────────────────────────────────────────────────────

const FULFILLMENT_LABELS: Record<string, string> = {
  fulfilled: "Enviado",
  partial: "Env. parcial",
  restocked: "Reabastecido",
  unfulfilled: "Preparando",
  null: "Preparando",
};

const FINANCIAL_LABELS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  refunded: "Reembolsado",
  voided: "Cancelado",
  authorized: "Autorizado",
};

function StatusRow({ financial, fulfillment }: { financial: string; fulfillment: string | null }) {
  const isPaid = financial === "paid";
  const isRefunded = financial === "refunded" || financial === "voided";
  const isFulfilled = fulfillment === "fulfilled";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Pago */}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          isPaid
            ? "bg-[#e8f5e0] text-[#2e5a10]"
            : isRefunded
              ? "bg-[#fde8e8] text-[#7a1010]"
              : "bg-[#f0f0f0] text-[#555]"
        }`}
      >
        {isPaid ? (
          <CheckCircleIcon className="h-3 w-3" />
        ) : isRefunded ? (
          <XCircleIcon className="h-3 w-3" />
        ) : (
          <ClockIcon className="h-3 w-3" />
        )}
        {FINANCIAL_LABELS[financial] ?? financial}
      </span>

      {/* Envío */}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          isFulfilled
            ? "bg-[#e8f5e0] text-[#2e5a10]"
            : "bg-[#fef3cd] text-[#7d5a00]"
        }`}
      >
        {isFulfilled ? <TruckIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
        {FULFILLMENT_LABELS[fulfillment ?? "null"] ?? "Preparando"}
      </span>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function MisPedidosPage(): React.JSX.Element {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    void fetch("/api/orders")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al obtener pedidos");
        const data = (await res.json()) as { orders: Order[] };
        setOrders(data.orders);
      })
      .catch((e: unknown) => {
        setError((e as Error).message ?? "Error desconocido");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (user === undefined) {
    return (
      <>
        <main className="mx-auto min-h-screen max-w-2xl px-5 py-16 pb-28 flex items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
        </main>
        <BottomNav />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-5 pb-28 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f8e0]">
            <ShoppingBagIcon className="h-8 w-8 text-[#4e6f2a]" />
          </div>
          <div>
            <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">Mis pedidos</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Inicia sesión para ver tu historial de compras y rastrear envíos.
            </p>
          </div>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-6"
          >
            Iniciar sesión
          </Button>
        </main>
        <BottomNav />
        {authModalOpen ? <UserAuthModal onClose={() => setAuthModalOpen(false)} /> : null}
      </>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 pb-28 sm:px-6">
        <h1 className="font-title mb-6 text-2xl font-black text-[var(--ink-900)]">Mis pedidos</h1>

        {error ? (
          <div className="mb-4 rounded-2xl bg-[#fde8e8] px-4 py-3 text-sm text-[#7a1010]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="h-28 animate-pulse rounded-2xl bg-[var(--surface-100)]" />
            ))}
          </div>
        ) : null}

        {!loading && !error && orders?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f8e0]">
              <ShoppingBagIcon className="h-8 w-8 text-[#4e6f2a]" />
            </div>
            <p className="text-sm text-[var(--ink-500)]">Aún no tienes pedidos registrados.</p>
            <Button asChild className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] px-6">
              <Link href="/#compras">Ver la tienda</Link>
            </Button>
          </div>
        ) : null}

        {!loading && orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : null}
      </main>
      <BottomNav />
    </>
  );
}

// ─── Card individual de pedido ─────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const date = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(order.createdAt));

  const price = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: order.currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(order.totalPrice));

  const totalItems = order.lineItems.reduce((s, li) => s + li.quantity, 0);

  function copyTracking() {
    if (!order.tracking?.number) return;
    void navigator.clipboard.writeText(order.tracking.number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--surface-200)] bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-title text-base font-black text-[var(--ink-900)]">{order.name}</p>
            <span className="text-xs text-[var(--ink-400)]">{date}</span>
          </div>
          <div className="mt-1.5">
            <StatusRow financial={order.financialStatus} fulfillment={order.fulfillmentStatus} />
          </div>
        </div>
        <p className="font-title shrink-0 text-lg font-black text-[#4e6f2a]">{price}</p>
      </div>

      {/* Toggle artículos */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs text-[var(--ink-400)] transition hover:bg-[var(--surface-50)]"
      >
        <span>
          {totalItems} {totalItems === 1 ? "artículo" : "artículos"} ·{" "}
          {order.lineItems.length === 1
            ? order.lineItems[0]!.title
            : `${order.lineItems[0]!.title}${order.lineItems.length > 1 ? ` +${order.lineItems.length - 1} más` : ""}`}
        </span>
        {expanded ? (
          <ChevronUpIcon className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 shrink-0" />
        )}
      </button>

      {/* Lista de artículos expandible */}
      {expanded ? (
        <div className="border-t border-[var(--surface-200)] px-4 py-2 space-y-1.5">
          {order.lineItems.map((li) => {
            const itemPrice = new Intl.NumberFormat("es-MX", {
              style: "currency",
              currency: order.currency,
              minimumFractionDigits: 0,
            }).format(parseFloat(li.price));
            return (
              <div key={li.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--ink-700)] truncate">
                  {li.title}
                  {li.variantTitle && li.variantTitle !== "Default Title" ? (
                    <span className="ml-1 text-[var(--ink-400)]">· {li.variantTitle}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-[var(--ink-400)]">
                  ×{li.quantity} · {itemPrice}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Rastreo */}
      {order.tracking ? (
        <div className="flex items-center justify-between gap-3 border-t border-[var(--surface-200)] bg-[#f4f8ed] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <TruckIcon className="h-4 w-4 shrink-0 text-[#4e6f2a]" />
            <div className="min-w-0">
              {order.tracking.company ? (
                <p className="text-xs font-semibold text-[var(--ink-700)]">{order.tracking.company}</p>
              ) : null}
              {order.tracking.number ? (
                <button
                  onClick={copyTracking}
                  className="flex items-center gap-1 font-mono text-[11px] text-[var(--ink-500)] hover:text-[#4e6f2a] transition"
                  title="Copiar número de guía"
                >
                  {order.tracking.number}
                  <ClipboardDocumentIcon className="h-3 w-3 shrink-0" />
                  {copied ? <span className="text-[#4e6f2a] not-italic normal-case font-sans">¡Copiado!</span> : null}
                </button>
              ) : null}
            </div>
          </div>
          {order.tracking.url ? (
            <a
              href={order.tracking.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#4e6f2a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3d5720]"
            >
              Rastrear <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

