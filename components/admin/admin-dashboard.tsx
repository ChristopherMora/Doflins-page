"use client";

import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  GiftIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RevealByDay {
  date: string;
  count: number;
}

interface EventByType {
  eventType: string;
  count: number;
}

interface LowStockItem {
  doflinId: number;
  name: string;
  rarity: string;
  remaining: number;
}

interface RevealByDoflin {
  doflinId: number;
  name: string;
  rarity: string;
  revealCount: number;
}

interface StatsData {
  revealsByDay: RevealByDay[];
  eventsByType: EventByType[];
  lowStock: LowStockItem[];
  revealsByDoflin: RevealByDoflin[];
  totalReveals30d: number;
  totalEvents30d: number;
  conversionRate: number;
  purchaseIntentCount: number;
  revealSuccessCount: number;
  totalProfiles: number;
  activeCollectors: number;
  activeReferralCodes: number;
  totalReferralUses: number;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "bg-[#e8f2d6] text-[#2f5b1f]",
  RARE: "bg-[#dbe4ff] text-[#24336c]",
  EPIC: "bg-[#f0dbff] text-[#5a1a8a]",
  LEGENDARY: "bg-[#ffe9b5] text-[#5e4300]",
  ULTRA: "bg-[#ffd6d6] text-[#7a1a1a]",
  MYTHIC: "bg-[#ffd6f5] text-[#6b006b]",
};

const EVENT_LABELS: Record<string, string> = {
  reveal_success: "Reveals exitosos",
  scan: "Escaneos",
  invalid: "Códigos inválidos",
  purchase_intent: "Intentos de compra",
  rate_limited: "Rate limit",
  card_open: "Cards abiertas",
  view_3d: "Vistas 3D",
  universe_switch: "Cambios universo",
  filter_apply: "Filtros aplicados",
};

function BarChart({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) {
  return (
    <div className="flex items-end gap-1 h-24 w-full overflow-x-auto pb-1">
      {data.map((item) => {
        const height = maxValue > 0 ? Math.max(4, (item.value / maxValue) * 96) : 4;
        return (
          <div key={item.label} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: "12px" }}>
            <span className="text-[9px] text-[var(--ink-600)] font-bold">{item.value > 0 ? item.value : ""}</span>
            <div
              className={`w-3 rounded-t-sm transition-all duration-500 ${color}`}
              style={{ height: `${height}px` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error("Error cargando estadísticas");
      }
      const data = (await res.json()) as StatsData;
      setStats(data);
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  // Build a 30-day array filling missing dates with 0
  const revealChartData = (() => {
    if (!stats) return [];
    const map = new Map(stats.revealsByDay.map((r) => [r.date, r.count]));
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      return { label: key.slice(5), value: map.get(key) ?? 0 };
    });
  })();

  const maxReveals = Math.max(...revealChartData.map((d) => d.value), 1);

  const topEvents = stats?.eventsByType
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 8) ?? [];

  const maxEventCount = Math.max(...topEvents.map((e) => e.count), 1);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
          <p className="text-sm text-[var(--ink-600)]">Cargando estadísticas…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-400" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            className="mt-2 rounded-full bg-[#4e6f2a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3d5a20]"
            onClick={() => void fetchStats()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-title text-3xl text-[var(--ink-900)]">Dashboard</h1>
          {lastRefreshed && (
            <p className="text-xs text-[var(--ink-600)] mt-0.5">
              Actualizado {lastRefreshed.toLocaleTimeString("es-MX")}
            </p>
          )}
        </div>
        <button
          onClick={() => void fetchStats()}
          className="flex items-center gap-2 rounded-full border border-[#d8d2b4] bg-white px-4 py-2 text-sm font-medium text-[var(--ink-800)] hover:bg-[#f4f6e8] transition"
        >
          <ArrowPathIcon className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {/* KPI Cards — fila 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Reveals (30d)",
            value: stats.totalReveals30d,
            icon: <SparklesIcon className="h-6 w-6 text-[#4e6f2a]" />,
            bg: "bg-[#eef5df]",
          },
          {
            label: "Eventos totales (30d)",
            value: stats.totalEvents30d,
            icon: <ChartBarIcon className="h-6 w-6 text-[#4a3c8c]" />,
            bg: "bg-[#ede8ff]",
          },
          {
            label: "Stock crítico (≤5)",
            value: stats.lowStock.length,
            icon: <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />,
            bg: "bg-[#fff8e5]",
          },
          {
            label: "Tasa de conversión",
            value: `${stats.conversionRate.toFixed(1)}%`,
            icon: <FireIcon className="h-6 w-6 text-red-500" />,
            bg: "bg-[#fff0f0]",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className={`border border-[#d8d2b4] ${kpi.bg} shadow-sm`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-white/80 p-3 shadow-sm">{kpi.icon}</div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">{kpi.label}</p>
                <p className="font-title text-3xl text-[var(--ink-900)]">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPI Cards — fila 2: usuarios y referidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Perfiles creados",
            value: stats.totalProfiles,
            icon: <UserGroupIcon className="h-6 w-6 text-[#1a7a4a]" />,
            bg: "bg-[#e8faf0]",
          },
          {
            label: "Coleccionistas activos",
            value: stats.activeCollectors,
            icon: <SparklesIcon className="h-6 w-6 text-[#b46a2d]" />,
            bg: "bg-[#fff4e8]",
          },
          {
            label: "Códigos referido activos",
            value: stats.activeReferralCodes,
            icon: <GiftIcon className="h-6 w-6 text-[#9b1fae]" />,
            bg: "bg-[#fde8f5]",
          },
          {
            label: "Usos de referido",
            value: stats.totalReferralUses,
            icon: <GiftIcon className="h-6 w-6 text-[#3b5bdb]" />,
            bg: "bg-[#e8f0fe]",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className={`border border-[#d8d2b4] ${kpi.bg} shadow-sm`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-white/80 p-3 shadow-sm">{kpi.icon}</div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-600)]">{kpi.label}</p>
                <p className="font-title text-3xl text-[var(--ink-900)]">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reveals chart */}
      <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
        <CardContent className="p-6 space-y-3">
          <h2 className="font-title text-xl text-[var(--ink-900)]">Reveals por día (últimos 30 días)</h2>
          <BarChart data={revealChartData} maxValue={maxReveals} color="bg-[#6d8a3a]" />
          <div className="flex justify-between text-[10px] text-[var(--ink-500)]">
            <span>Hace 30 días</span>
            <span>Hoy</span>
          </div>
        </CardContent>
      </Card>

      {/* Events by type + Low stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Events by type */}
        <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-title text-xl text-[var(--ink-900)]">Eventos (30d)</h2>
            <div className="space-y-2">
              {topEvents.map((ev) => (
                <div key={ev.eventType} className="flex items-center gap-3">
                  <span className="w-36 text-xs text-[var(--ink-700)] truncate">
                    {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                  </span>
                  <div className="flex-1 rounded-full bg-[#e8edd8] h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4a3c8c] transition-all duration-700"
                      style={{ width: `${(ev.count / maxEventCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-[var(--ink-900)]">{ev.count}</span>
                </div>
              ))}
              {topEvents.length === 0 && (
                <p className="text-sm text-[var(--ink-500)]">Sin eventos en los últimos 30 días.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-title text-xl text-[var(--ink-900)] flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" /> Stock crítico
            </h2>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">Todos los ítems tienen stock suficiente ✓</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {stats.lowStock.map((item) => (
                  <div
                    key={item.doflinId}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      item.remaining <= 1
                        ? "border-red-300 bg-red-50"
                        : item.remaining <= 3
                          ? "border-orange-300 bg-orange-50"
                          : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${RARITY_COLORS[item.rarity] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {item.rarity}
                      </Badge>
                      <span className="font-medium text-[var(--ink-900)] truncate">{item.name}</span>
                    </div>
                    <span
                      className={`shrink-0 ml-3 font-bold tabular-nums ${
                        item.remaining <= 1 ? "text-red-700" : item.remaining <= 3 ? "text-orange-700" : "text-amber-700"
                      }`}
                    >
                      {item.remaining} restante{item.remaining === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reveals por doflin (distribución) */}
      {stats.revealsByDoflin.length > 0 && (
        <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-title text-xl text-[var(--ink-900)]">
              Distribución de reveals por figura (30d)
            </h2>
            <p className="text-xs text-[var(--ink-500)]">
              Top {stats.revealsByDoflin.length} figuras más reveladas. Compara la distribución real contra la rareza teórica.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.revealsByDoflin.map((item) => {
                const maxCount = stats.revealsByDoflin[0]?.revealCount ?? 1;
                const pct = Math.round((item.revealCount / stats.totalReveals30d) * 1000) / 10;
                const barWidth = maxCount > 0 ? (item.revealCount / maxCount) * 100 : 0;
                return (
                  <div key={item.doflinId} className="flex items-center gap-3">
                    <div className="flex w-44 shrink-0 items-center gap-2 min-w-0">
                      <Badge
                        className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${RARITY_COLORS[item.rarity] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {item.rarity.slice(0, 3)}
                      </Badge>
                      <span className="truncate text-xs text-[var(--ink-800)]">{item.name}</span>
                    </div>
                    <div className="flex-1 rounded-full bg-[#e8edd8] h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#4e6f2a] transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-[var(--ink-900)]">
                      {item.revealCount} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
