"use client";

import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  CursorArrowRaysIcon,
} from "@heroicons/react/24/solid";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FunnelStep {
  label: string;
  key: string;
  count: number;
  dropoffRate: number;
  conversionRate: number;
}

interface ProductConversion {
  productHandle: string;
  productTitle: string;
  views: number;
  addToCart: number;
  removed: number;
  conversionRate: number;
}

interface TopSearch {
  query: string;
  count: number;
}

interface DailyEvent {
  date: string;
  eventType: string;
  count: number;
}

interface UniverseBreakdown {
  universe: string;
  count: number;
}

interface AnalyticsData {
  days: number;
  funnel: FunnelStep[];
  funnelTotals: Record<string, number>;
  dailyEvents: DailyEvent[];
  productConversion: ProductConversion[];
  topSearches: TopSearch[];
  hourlyActivity: { hour: number; count: number }[];
  universeBreakdown: UniverseBreakdown[];
  totalSessions: number;
  overallConversion: number;
  _notice?: string;
}

const FUNNEL_COLORS = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-green-600",
];

const FUNNEL_ICONS = [
  EyeIcon,
  CursorArrowRaysIcon,
  ShoppingCartIcon,
  ShoppingCartIcon,
  FunnelIcon,
  ChartBarIcon,
];

// ─── Funnel Chart ──────────────────────────────────────────────────────────────

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const Icon = FUNNEL_ICONS[i] ?? EyeIcon;
        const widthPercent = Math.max(8, (step.count / maxCount) * 100);
        return (
          <div key={step.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--ink-500)]" />
                <span className="font-medium text-[var(--ink-800)]">{step.label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-[var(--ink-900)]">
                  {step.count.toLocaleString("es-MX")}
                </span>
                {i > 0 && step.dropoffRate > 0 ? (
                  <span className="flex items-center gap-0.5 text-red-600">
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                    -{step.dropoffRate}%
                  </span>
                ) : null}
                <Badge
                  variant="neutral"
                  className="text-[10px] px-1.5 py-0"
                >
                  {step.conversionRate}%
                </Badge>
              </div>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-full bg-[#f5f4ef]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${FUNNEL_COLORS[i] ?? "bg-gray-400"}`}
                style={{ width: `${widthPercent}%`, opacity: 0.85 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Daily Trend Mini Chart ────────────────────────────────────────────────────

function DailyTrendChart({ data }: { data: DailyEvent[] }) {
  // Group by date, aggregate key funnel events
  const byDate = new Map<string, { views: number; carts: number; checkouts: number }>();
  for (const row of data) {
    const entry = byDate.get(row.date) ?? { views: 0, carts: 0, checkouts: 0 };
    if (row.eventType === "shop_view") entry.views += row.count;
    if (row.eventType === "add_to_cart") entry.carts += row.count;
    if (row.eventType === "checkout_start") entry.checkouts += row.count;
    byDate.set(row.date, entry);
  }

  const dates = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14); // show last 14 days

  const maxVal = Math.max(...dates.map(([, d]) => Math.max(d.views, d.carts)), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Visitas</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Add to cart</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> Checkout</span>
      </div>
      <div className="flex items-end gap-1 h-28 w-full overflow-x-auto">
        {dates.map(([date, values]) => (
          <div key={date} className="flex flex-col items-center gap-0.5 flex-shrink-0" style={{ minWidth: "24px" }}>
            <div className="flex items-end gap-px h-20">
              <div
                className="w-2 rounded-t-sm bg-blue-400 transition-all"
                style={{ height: `${Math.max(2, (values.views / maxVal) * 80)}px` }}
                title={`${date}: ${values.views} visitas`}
              />
              <div
                className="w-2 rounded-t-sm bg-emerald-400 transition-all"
                style={{ height: `${Math.max(2, (values.carts / maxVal) * 80)}px` }}
                title={`${date}: ${values.carts} add to cart`}
              />
              <div
                className="w-2 rounded-t-sm bg-orange-400 transition-all"
                style={{ height: `${Math.max(2, (values.checkouts / maxVal) * 80)}px` }}
                title={`${date}: ${values.checkouts} checkouts`}
              />
            </div>
            <span className="text-[8px] text-[var(--ink-400)]">
              {date.slice(8)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hour Heatmap ──────────────────────────────────────────────────────────────

function ShopHourHeatMap({ data }: { data: { hour: number; count: number }[] }) {
  const map = new Map(data.map((d) => [d.hour, d.count]));
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: map.get(h) ?? 0,
  }));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1">
        {hours.map(({ hour, count: c }) => {
          const intensity = c / maxCount;
          const opacity = c === 0 ? 0.07 : 0.18 + intensity * 0.82;
          return (
            <div
              key={hour}
              title={`${String(hour).padStart(2, "0")}:00 — ${c} evento${c !== 1 ? "s" : ""}`}
              className="flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all cursor-default select-none"
              style={{
                background: `rgba(59,130,246,${opacity})`,
                color: intensity > 0.5 ? "#fff" : "#3b82f6",
              }}
            >
              {hour}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--ink-500)]">
        <span>00:00</span>
        <span>Actividad por hora</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function ShopAnalyticsDashboard(): React.JSX.Element {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shop-analytics?days=${d}`);
      if (!res.ok) throw new Error("Error cargando analytics");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(days);
  }, [days]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-[var(--ink-400)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <p className="text-red-600">{error ?? "Sin datos"}</p>
        <button
          onClick={() => void load(days)}
          className="mt-4 rounded-full border px-4 py-2 text-sm hover:bg-black/5"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-28 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-900)]">
            📊 Analytics de Tienda
          </h1>
          <p className="text-sm text-[var(--ink-500)]">
            Embudo de compra y comportamiento de usuarios
          </p>
        </div>

        {data._notice ? (
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ {data._notice}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                days === d
                  ? "bg-[#4e6f2a] text-white"
                  : "bg-[#f5f4ef] text-[var(--ink-700)] hover:bg-[#e8e6dc]"
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => void load(days)}
            className="ml-2 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs hover:bg-black/5"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Sesiones totales"
          value={data.totalSessions.toLocaleString("es-MX")}
          icon={EyeIcon}
          color="text-blue-600"
        />
        <KpiCard
          label="Tasa de checkout"
          value={`${data.overallConversion}%`}
          icon={FunnelIcon}
          color="text-orange-600"
          subtitle="visitas → checkout"
        />
        <KpiCard
          label="Add to cart"
          value={(data.funnelTotals.add_to_cart ?? 0).toLocaleString("es-MX")}
          icon={ShoppingCartIcon}
          color="text-emerald-600"
        />
        <KpiCard
          label="Búsquedas"
          value={(data.funnelTotals.search ?? 0).toLocaleString("es-MX")}
          icon={MagnifyingGlassIcon}
          color="text-purple-600"
        />
      </div>

      {/* Main content: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Funnel */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--ink-900)]">
                <FunnelIcon className="h-5 w-5 text-[var(--ink-500)]" />
                Embudo de compra
              </h2>
              {data.funnel.length > 0 ? (
                <>
                  <FunnelChart steps={data.funnel} />
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-800">
                      💡 Mayor pérdida:{" "}
                      {(() => {
                        const worst = data.funnel
                          .filter((s) => s.dropoffRate > 0)
                          .sort((a, b) => b.dropoffRate - a.dropoffRate)[0];
                        if (!worst) return "Sin datos suficientes";
                        return `"${worst.label}" pierde el ${worst.dropoffRate}% de usuarios respecto al paso anterior.`;
                      })()}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Aún no hay datos de embudo.</p>
              )}
            </CardContent>
          </Card>

          {/* Daily trend */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--ink-900)]">
                📈 Tendencia diaria (últimos 14 días)
              </h2>
              {data.dailyEvents.length > 0 ? (
                <DailyTrendChart data={data.dailyEvents} />
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Sin datos aún.</p>
              )}
            </CardContent>
          </Card>

          {/* Product conversion */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-bold text-[var(--ink-900)]">
                🛍️ Conversión por producto
              </h2>
              <p className="mb-3 text-xs text-[var(--ink-500)]">
                ¿Qué productos ven pero NO agregan al carrito?
              </p>
              {data.productConversion.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs text-[var(--ink-500)]">
                        <th className="pb-2 pr-3">Producto</th>
                        <th className="pb-2 px-3 text-right">Vistas</th>
                        <th className="pb-2 px-3 text-right">Carrito</th>
                        <th className="pb-2 px-3 text-right">Removidos</th>
                        <th className="pb-2 pl-3 text-right">Conv. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.productConversion.map((p) => (
                        <tr key={p.productHandle} className="border-b last:border-0">
                          <td className="py-2 pr-3 max-w-[200px] truncate font-medium text-[var(--ink-800)]">
                            {p.productTitle ?? p.productHandle}
                          </td>
                          <td className="py-2 px-3 text-right">{p.views}</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-medium">{p.addToCart}</td>
                          <td className="py-2 px-3 text-right text-red-600">{p.removed}</td>
                          <td className="py-2 pl-3 text-right">
                            <Badge
                              className={`text-[10px] ${
                                p.conversionRate >= 20
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.conversionRate >= 5
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {p.conversionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Sin datos de productos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Top searches */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--ink-900)]">
                <MagnifyingGlassIcon className="h-5 w-5 text-[var(--ink-500)]" />
                Top búsquedas
              </h2>
              <p className="mb-3 text-xs text-[var(--ink-500)]">
                ¿Qué buscan los usuarios? Si no lo encuentran, es una oportunidad.
              </p>
              {data.topSearches.length > 0 ? (
                <div className="space-y-2">
                  {data.topSearches.slice(0, 10).map((s, i) => (
                    <div
                      key={s.query}
                      className="flex items-center justify-between rounded-lg bg-[#f9f8f4] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--ink-400)]">
                          {i + 1}.
                        </span>
                        <span className="text-sm text-[var(--ink-800)]">
                          &ldquo;{s.query}&rdquo;
                        </span>
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        {s.count}×
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Sin búsquedas registradas.</p>
              )}
            </CardContent>
          </Card>

          {/* Universe breakdown */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 text-lg font-bold text-[var(--ink-900)]">
                🌍 Actividad por universo
              </h2>
              {data.universeBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {data.universeBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map((u) => {
                      const total = data.universeBreakdown.reduce((s, x) => s + x.count, 0);
                      const pct = total > 0 ? Math.round((u.count / total) * 100) : 0;
                      return (
                        <div
                          key={u.universe}
                          className="flex items-center justify-between rounded-lg bg-[#f9f8f4] px-3 py-2"
                        >
                          <span className="text-sm capitalize font-medium text-[var(--ink-800)]">
                            {u.universe ?? "sin universo"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--ink-500)]">{pct}%</span>
                            <Badge variant="neutral" className="text-[10px]">
                              {u.count.toLocaleString("es-MX")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Sin datos por universo.</p>
              )}
            </CardContent>
          </Card>

          {/* Hourly heatmap */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 text-lg font-bold text-[var(--ink-900)]">
                🕐 Mapa de calor por hora
              </h2>
              <ShopHourHeatMap data={data.hourlyActivity} />
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-2 border-[#4e6f2a]/30">
            <CardContent className="p-6">
              <h2 className="mb-3 text-lg font-bold text-[var(--ink-900)]">
                💡 Insights automáticos
              </h2>
              <ul className="space-y-2 text-sm text-[var(--ink-700)]">
                {data.funnel.length >= 2 && (() => {
                  const worst = data.funnel
                    .filter((s) => s.dropoffRate > 0)
                    .sort((a, b) => b.dropoffRate - a.dropoffRate)[0];
                  if (!worst) return null;
                  const tips: Record<string, string> = {
                    productView: "Pocos usuarios exploran productos. Mejora la visibilidad del catálogo o agrega banners llamativos.",
                    addToCart: "Los usuarios ven productos pero no agregan al carrito. Revisa precios, imágenes y CTAs.",
                    cartView: "Agregan al carrito pero no lo abren. Haz el botón de carrito más visible.",
                    checkoutStart: "Abren el carrito pero no van a checkout. Revisa costos de envío, confianza y fricción.",
                    checkoutComplete: "Inician checkout pero no completan. Revisa métodos de pago y proceso de Shopify.",
                  };
                  return (
                    <li className="flex gap-2">
                      <span className="text-amber-500">⚠️</span>
                      <span>{tips[worst.key] ?? `El paso "${worst.label}" tiene ${worst.dropoffRate}% de abandono.`}</span>
                    </li>
                  );
                })()}
                {data.topSearches.length > 0 ? (
                  <li className="flex gap-2">
                    <span>🔍</span>
                    <span>
                      La búsqueda más popular es &ldquo;{data.topSearches[0].query}&rdquo; ({data.topSearches[0].count} veces).
                      Asegúrate de tener ese producto visible.
                    </span>
                  </li>
                ) : null}
                {data.productConversion.some((p) => p.views > 5 && p.conversionRate < 3) ? (
                  <li className="flex gap-2">
                    <span>📉</span>
                    <span>
                      Hay productos con muchas vistas pero baja conversión. Revisa sus precios, imágenes o descripciones.
                    </span>
                  </li>
                ) : null}
                {data.totalSessions === 0 ? (
                  <li className="flex gap-2">
                    <span>📭</span>
                    <span>No hay sesiones registradas aún. Los eventos empezarán a aparecer cuando los usuarios visiten la tienda.</span>
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f4ef] ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--ink-900)]">{value}</p>
          <p className="text-xs text-[var(--ink-500)]">{label}</p>
          {subtitle ? <p className="text-[10px] text-[var(--ink-400)]">{subtitle}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
