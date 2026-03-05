"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
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
  partial: "Enviado parcialmente",
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

function FulfillmentBadge({ status }: { status: string | null }) {
  const label = FULFILLMENT_LABELS[status ?? "null"] ?? "Procesando";
  if (status === "fulfilled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e0] px-2.5 py-0.5 text-xs font-semibold text-[#2e5a10]">
        <TruckIcon className="h-3.5 w-3.5" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3cd] px-2.5 py-0.5 text-xs font-semibold text-[#7d5a00]">
      <ClockIcon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function FinancialBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e0] px-2.5 py-0.5 text-xs font-semibold text-[#2e5a10]">
        <CheckCircleIcon className="h-3.5 w-3.5" /> {FINANCIAL_LABELS[status]}
      </span>
    );
  }
  if (status === "refunded" || status === "voided") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fde8e8] px-2.5 py-0.5 text-xs font-semibold text-[#7a1010]">
        <XCircleIcon className="h-3.5 w-3.5" /> {FINANCIAL_LABELS[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f0f0] px-2.5 py-0.5 text-xs font-semibold text-[#555]">
      {FINANCIAL_LABELS[status] ?? status}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function MisPedidosPage(): React.JSX.Element {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: d }) => setUser(d.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cargar pedidos cuando tenemos usuario
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

  // ── Cargando auth ──────────────────────────────────────────────────────────
  if (user === undefined) {
    return (
      <>
        <main className="mx-auto min-h-screen max-w-2xl px-5 py-16 pb-28">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
          </div>
        </main>
        <BottomNav />
      </>
    );
  }

  // ── No autenticado ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 pb-28 text-center">
          <ShoppingBagIcon className="h-14 w-14 text-[#c5dca0]" />
          <div>
            <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">Mis pedidos</h1>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Inicia sesión para ver el historial de tus compras y el seguimiento de envíos.
            </p>
          </div>
          <Button
            onClick={() => setAuthModalOpen(true)}
            className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
          >
            Iniciar sesión
          </Button>
        </main>
        <BottomNav />
        {authModalOpen ? (
          <UserAuthModal onClose={() => setAuthModalOpen(false)} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-6">
        <h1 className="font-title mb-6 text-3xl font-black text-[var(--ink-900)]">Mis pedidos</h1>

        {/* Error */}
        {error ? (
          <div className="rounded-2xl bg-[#fde8e8] p-4 text-sm text-[#7a1010]">{error}</div>
        ) : null}

        {/* Cargando pedidos */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((k) => (
              <div key={k} className="h-36 animate-pulse rounded-3xl bg-[var(--surface-100)]" />
            ))}
          </div>
        ) : null}

        {/* Sin pedidos */}
        {!loading && !error && orders?.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBagIcon className="h-14 w-14 text-[#c5dca0]" />
            <p className="text-[var(--ink-500)]">Aún no tienes pedidos registrados.</p>
            <Button asChild className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
              <Link href="/#compras">Ver la tienda</Link>
            </Button>
          </div>
        ) : null}

        {/* Lista de pedidos */}
        {!loading && orders && orders.length > 0 ? (
          <div className="space-y-4">
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
  const date = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(order.createdAt));

  const price = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: order.currency,
    minimumFractionDigits: 0,
  }).format(parseFloat(order.totalPrice));

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--surface-200)] bg-[var(--background)] shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-title text-lg font-black text-[var(--ink-900)]">{order.name}</p>
          <p className="text-xs text-[var(--ink-400)]">{date}</p>
        </div>
        <p className="font-title shrink-0 text-xl font-black text-[#4e6f2a]">{price}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 px-5 pb-3">
        <FinancialBadge status={order.financialStatus} />
        <FulfillmentBadge status={order.fulfillmentStatus} />
      </div>

      {/* Artículos */}
      <div className="space-y-1 border-t border-[var(--surface-200)] px-5 py-3">
        {order.lineItems.map((li) => (
          <div key={li.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--ink-700)]">
              {li.title}
              {li.variantTitle && li.variantTitle !== "Default Title" ? (
                <span className="ml-1 text-[var(--ink-400)]">({li.variantTitle})</span>
              ) : null}
            </span>
            <span className="shrink-0 text-[var(--ink-500)]">×{li.quantity}</span>
          </div>
        ))}
      </div>

      {/* Rastreo */}
      {order.tracking ? (
        <div className="border-t border-[var(--surface-200)] bg-[#f4f8ed] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 shrink-0 text-[#4e6f2a]" />
              <div>
                {order.tracking.company ? (
                  <p className="text-sm font-semibold text-[var(--ink-800)]">
                    {order.tracking.company}
                  </p>
                ) : null}
                {order.tracking.number ? (
                  <p className="font-mono text-xs text-[var(--ink-500)]">{order.tracking.number}</p>
                ) : null}
              </div>
            </div>
            {order.tracking.url ? (
              <a
                href={order.tracking.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#4e6f2a] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3d5720]"
              >
                Rastrear <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
