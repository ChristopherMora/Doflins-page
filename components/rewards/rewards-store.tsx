"use client";

import { useCallback, useEffect, useState } from "react";
import { StarIcon, GiftIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { getLevel, getNextLevel, getLevelProgress } from "@/lib/server/levels";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Reward {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  type: string;
  stock: number | null;
}

interface Transaction {
  id: number;
  amount: number;
  label: string;
  createdAt: string;
}

interface PointsData {
  balance: number;
  totalEarned: number;
  transactions: Transaction[];
}

const TYPE_LABEL: Record<string, string> = {
  discount_code: "🏷️ Cupón de descuento",
  physical: "📦 Producto físico",
  digital: "💾 Entrega digital",
  custom: "⭐ Recompensa especial",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function RewardsStore() {
  const [points, setPoints] = useState<PointsData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<"store" | "history">("store");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ptRes, rwRes] = await Promise.all([
        fetch("/api/points"),
        fetch("/api/rewards"),
      ]);

      if (ptRes.status === 401) {
        setPoints(null);
        setLoading(false);
        return;
      }

      if (ptRes.ok) setPoints(await ptRes.json() as PointsData);
      if (rwRes.ok) setRewards(((await rwRes.json()) as { rewards: Reward[] }).rewards);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const redeem = async (rewardId: number) => {
    setRedeeming(rewardId);
    setMessage(null);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      const json = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: json.error ?? "Error al canjear" });
      } else {
        setMessage({ type: "ok", text: json.message ?? "¡Canje exitoso!" });
        await load(); // actualizar saldo
      }
    } catch {
      setMessage({ type: "error", text: "Error de red" });
    } finally {
      setRedeeming(null);
    }
  };

  // ── Estado de carga ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-100)]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[var(--surface-100)]" />
          ))}
        </div>
      </div>
    );
  }

  // ── Sin sesión ──────────────────────────────────────────────────────────────
  if (!points) {
    return (
      <div className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)] px-6 py-10 text-center">
        <GiftIcon className="mx-auto mb-3 h-10 w-10 text-[var(--ink-300)]" />
        <p className="font-bold text-[var(--ink-800)]">Inicia sesión para ver tus puntos</p>
        <p className="mt-1 text-sm text-[var(--ink-400)]">
          Gana puntos coleccionando figuras y canjeálos por recompensas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-title text-2xl font-black text-[var(--ink-900)]">Tienda de Puntos</h1>
        <p className="mt-1 text-sm text-[var(--ink-400)]">
          Colecciona figuras para ganar puntos y canjea recompensas exclusivas.
        </p>
      </div>

      {/* Balance card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, #2e5c1b 0%, #4e6f2a 60%, #8ab84a 100%)" }}
      >
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            {(() => {
              const level = getLevel(points.totalEarned);
              const next = getNextLevel(points.totalEarned);
              const progress = getLevelProgress(points.totalEarned);
              return (
                <>
                  <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white">
                    {level.emoji} {level.label}
                  </span>
                  {next && (
                    <span className="text-xs text-[#c8f08a]">
                      → {next.emoji} {next.label} ({progress}%)
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8f08a]">Tus puntos</p>
          <p className="mt-1 font-title text-5xl font-black text-white">
            {points.balance.toLocaleString("es-MX")}
          </p>
          <p className="mt-0.5 text-sm text-[#a8d870]">
            Total acumulado: {points.totalEarned.toLocaleString("es-MX")} pts
          </p>
        </div>
        <StarIcon className="absolute right-4 top-4 h-20 w-20 text-white/10" />
      </div>

      {/* Cómo ganar puntos */}
      <details className="rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)]">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-[var(--ink-700)]">
          ¿Cómo gano puntos? ✨
        </summary>
        <ul className="space-y-1 px-4 pb-4 pt-2 text-sm text-[var(--ink-600)]">
          <li>🐾 <strong>+10 pts</strong> — Marcar una figura como obtenida por primera vez</li>
          <li>💎 <strong>+5 pts extra</strong> — Figura Rara</li>
          <li>🔥 <strong>+15 pts extra</strong> — Figura Épica</li>
          <li>⚡ <strong>+30 pts extra</strong> — Figura Legendaria</li>
          <li>🌟 <strong>+50 pts extra</strong> — Figura Ultra</li>
          <li>👑 <strong>+100 pts extra</strong> — Figura Mítica</li>
          <li>🛒 <strong>+5 pts</strong> — Por cada $100 MXN de compra en la tienda</li>
          <li>🎁 <strong>+50 pts</strong> — Por cada persona que uses tu código de referido</li>
        </ul>
      </details>

      {/* Mensaje feedback */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl p-4 text-sm ${
            message.type === "ok"
              ? "bg-[#eef5df] text-[#2d4915] border border-[#c5dca0]"
              : "bg-[#fff0f0] text-[#8b1a1a] border border-[#fcc]"
          }`}
        >
          {message.type === "ok"
            ? <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            : <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--surface-200)]">
        {(["store", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-b-2 border-[#4e6f2a] text-[#4e6f2a]"
                : "text-[var(--ink-400)] hover:text-[var(--ink-600)]"
            }`}
          >
            {t === "store" ? "🏪 Recompensas" : "📜 Historial"}
          </button>
        ))}
      </div>

      {/* Tienda */}
      {tab === "store" && (
        rewards.length === 0 ? (
          <div className="rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] px-4 py-10 text-center text-sm text-[var(--ink-400)]">
            <SparklesIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
            Pronto habrá recompensas disponibles. ¡Sigue coleccionando!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rewards.map((r) => {
              const canAfford = points.balance >= r.pointsCost;
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    canAfford
                      ? "border-[#b8d493] bg-white hover:shadow-md"
                      : "border-[var(--surface-200)] bg-[var(--surface-50)] opacity-70"
                  }`}
                >
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageUrl}
                      alt={r.title}
                      className="mb-3 h-24 w-full rounded-xl object-cover"
                    />
                  )}

                  <p className="text-xs text-[var(--ink-400)]">{TYPE_LABEL[r.type] ?? r.type}</p>
                  <p className="mt-0.5 font-bold text-[var(--ink-900)]">{r.title}</p>
                  {r.description && (
                    <p className="mt-1 text-xs text-[var(--ink-500)]">{r.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <StarIcon className="h-4 w-4 text-[#8ab84a]" />
                      <span className="font-title text-sm font-black text-[#4e6f2a]">
                        {r.pointsCost.toLocaleString("es-MX")} pts
                      </span>
                    </div>
                    <button
                      disabled={!canAfford || redeeming === r.id}
                      onClick={() => void redeem(r.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                        canAfford
                          ? "bg-[#4e6f2a] text-white hover:bg-[#3d5a20]"
                          : "cursor-not-allowed bg-[var(--surface-200)] text-[var(--ink-400)]"
                      }`}
                    >
                      {redeeming === r.id ? "Canjeando…" : canAfford ? "Canjear" : "Puntos insuficientes"}
                    </button>
                  </div>

                  {r.stock !== null && (
                    <p className="mt-1.5 text-xs text-[var(--ink-400)]">
                      {r.stock} disponibles
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Historial */}
      {tab === "history" && (
        points.transactions.length === 0 ? (
          <div className="rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] px-4 py-8 text-center text-sm text-[var(--ink-400)]">
            <ClockIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
            Aún no tienes movimientos de puntos.
          </div>
        ) : (
          <div className="space-y-1.5">
            {points.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-800)]">{tx.label}</p>
                  <p className="text-xs text-[var(--ink-400)]">{formatDate(tx.createdAt)}</p>
                </div>
                <span
                  className={`font-title text-base font-black ${
                    tx.amount >= 0 ? "text-[#4e6f2a]" : "text-[#b84a4a]"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}{tx.amount} pts
                </span>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
