"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  GiftIcon,
  PhotoIcon,
  PresentationChartLineIcon,
  QrCodeIcon,
  SparklesIcon,
  StarIcon,
  TicketIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailTestingPanel } from "@/components/admin/email-testing-panel";

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

interface RevealByHour {
  hour: number;
  count: number;
}

interface StatsData {
  serie: "Animals" | "Multiverse" | "all";
  revealsByDay: RevealByDay[];
  eventsByType: EventByType[];
  lowStock: LowStockItem[];
  revealsByDoflin: RevealByDoflin[];
  revealsByHour: RevealByHour[];
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

const PANEL_CLASS_NAME = "border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]";

const QUICK_ACTIONS: Array<{
  href: string;
  label: string;
  description: string;
  Icon: React.ElementType;
  accentClassName: string;
}> = [
  {
    href: "/admin/doflins",
    label: "Alta figuras",
    description: "Crea, edita o revisa el catalogo principal de Doflins.",
    Icon: SparklesIcon,
    accentClassName: "from-[#eef7de] to-[#d8ebb3] text-[#35561b]",
  },
  {
    href: "/admin/bolsas",
    label: "Bolsas / QR",
    description: "Genera bolsas, revisa inventario y valida codigos QR.",
    Icon: QrCodeIcon,
    accentClassName: "from-[#fff3dd] to-[#f6d59a] text-[#7a4c11]",
  },
  {
    href: "/admin/codigos",
    label: "Codigos",
    description: "Administra lotes, codigos activos y flujo de generacion.",
    Icon: TicketIcon,
    accentClassName: "from-[#e9efff] to-[#cbd8ff] text-[#2745a0]",
  },
  {
    href: "/admin/rewards",
    label: "Recompensas",
    description: "Organiza el catalogo de canje y ajusta costos de puntos.",
    Icon: StarIcon,
    accentClassName: "from-[#fff0f8] to-[#f6c9e8] text-[#8a1f72]",
  },
  {
    href: "/admin/analytics",
    label: "Analytics tienda",
    description: "Abre el embudo de Shopify y el comportamiento de compra.",
    Icon: PresentationChartLineIcon,
    accentClassName: "from-[#edf2ff] to-[#d1dcff] text-[#334fa5]",
  },
  {
    href: "#herramientas",
    label: "Herramientas",
    description: "Prueba correos y optimiza imagenes sin salir del dashboard.",
    Icon: WrenchScrewdriverIcon,
    accentClassName: "from-[#f2efe6] to-[#e2dbc7] text-[#5d563f]",
  },
] as const;

// ─── Mapa de calor por hora ────────────────────────────────────────────────────

function HourHeatMap({ data }: { data: { hour: number; count: number }[] }) {
  const map = new Map(data.map((d) => [d.hour, d.count]));
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: map.get(h) ?? 0,
  }));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-1">
        {hours.map(({ hour, count }) => {
          const intensity = count / maxCount;
          const opacity = count === 0 ? 0.07 : 0.18 + intensity * 0.82;
          const label = `${String(hour).padStart(2, "0")}:00 — ${count} reveal${count !== 1 ? "s" : ""}`;
          return (
            <div
              key={hour}
              title={label}
              className="flex aspect-square flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-300 cursor-default select-none"
              style={{ background: `rgba(78,111,42,${opacity})`, color: intensity > 0.5 ? "#fff" : "#4e6f2a" }}
            >
              {hour}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--ink-500)]">
        <span>00:00</span>
        <span className="flex items-center gap-1">
          Intensidad:
          <span className="inline-flex gap-0.5">
            {[0.08, 0.3, 0.55, 0.8, 1].map((o) => (
              <span key={o} className="h-3 w-5 rounded-sm" style={{ background: `rgba(78,111,42,${o})` }} />
            ))}
          </span>
        </span>
        <span>23:00</span>
      </div>
    </div>
  );
}

// ─── Exportar CSV ──────────────────────────────────────────────────────────────

function downloadCsv(stats: StatsData): void {
  const sections: string[] = [];

  sections.push("REVEALS POR DÍA (30d)");
  sections.push("Fecha,Reveals");
  sections.push(...stats.revealsByDay.map((r) => `${r.date},${r.count}`));

  sections.push("");
  sections.push("EVENTOS POR TIPO (30d)");
  sections.push("Tipo,Cantidad");
  sections.push(...stats.eventsByType.map((e) => `${e.eventType},${e.count}`));

  sections.push("");
  sections.push("REVEALS POR HORA DEL DÍA (30d)");
  sections.push("Hora,Reveals");
  const hourMap = new Map(stats.revealsByHour.map((h) => [h.hour, h.count]));
  sections.push(
    ...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00,${hourMap.get(h) ?? 0}`),
  );

  sections.push("");
  sections.push("STOCK CRÍTICO (≤5)");
  sections.push("ID,Nombre,Rareza,Restantes");
  sections.push(...stats.lowStock.map((s) => `${s.doflinId},"${s.name}",${s.rarity},${s.remaining}`));

  sections.push("");
  sections.push("TOP FIGURAS REVELADAS (30d)");
  sections.push("ID,Nombre,Rareza,Reveals");
  sections.push(
    ...stats.revealsByDoflin.map((d) => `${d.doflinId},"${d.name}",${d.rarity},${d.revealCount}`),
  );

  sections.push("");
  sections.push("RESUMEN GENERAL");
  sections.push("Métrica,Valor");
  sections.push(`Reveals totales (30d),${stats.totalReveals30d}`);
  sections.push(`Eventos totales (30d),${stats.totalEvents30d}`);
  sections.push(`Tasa de conversión,${stats.conversionRate}%`);
  sections.push(`Perfiles creados,${stats.totalProfiles}`);
  sections.push(`Coleccionistas activos,${stats.activeCollectors}`);
  sections.push(`Códigos referido activos,${stats.activeReferralCodes}`);
  sections.push(`Usos de referido,${stats.totalReferralUses}`);

  const csv = sections.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `doflins-stats-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Bar Chart ─────────────────────────────────────────────────────────────────

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [universeFilter, setUniverseFilter] = useState<"all" | "Animals" | "Multiverse">("all");

  const fetchStats = async (filter: "all" | "Animals" | "Multiverse" = universeFilter) => {
    const initialLoad = !stats;
    if (initialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const url = filter === "all" ? "/api/admin/stats" : `/api/admin/stats?serie=${filter}`;
      const res = await fetch(url, { cache: "no-store" });
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
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (filter: "all" | "Animals" | "Multiverse") => {
    setUniverseFilter(filter);
    void fetchStats(filter);
  };

  useEffect(() => {
    void fetchStats("all");
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (isLoading && !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d8d2b4] border-t-[#4e6f2a]" />
          <p className="text-sm text-[var(--ink-600)]">Cargando estadísticas…</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
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

  const topRevealedFigures = stats.revealsByDoflin.slice(0, 12);
  const busiestHour = stats.revealsByHour.reduce<RevealByHour | null>((current, entry) => {
    if (!current || entry.count > current.count) return entry;
    return current;
  }, null);
  const leadFigure = topRevealedFigures[0] ?? null;
  const dominantEvent = topEvents[0] ?? null;
  const overviewKpis = [
    {
      label: "Reveals (30d)",
      value: stats.totalReveals30d,
      hint: `${stats.revealSuccessCount} exitosos`,
      icon: <SparklesIcon className="h-5 w-5 text-[#42631f]" />,
      accentClassName: "bg-[#edf6dd]",
    },
    {
      label: "Eventos totales",
      value: stats.totalEvents30d,
      hint: `${topEvents.length} tipos activos`,
      icon: <ChartBarIcon className="h-5 w-5 text-[#3e4e99]" />,
      accentClassName: "bg-[#ececff]",
    },
    {
      label: "Conversion",
      value: `${stats.conversionRate.toFixed(1)}%`,
      hint: `${stats.purchaseIntentCount} intentos`,
      icon: <FireIcon className="h-5 w-5 text-[#b5472a]" />,
      accentClassName: "bg-[#fff0e7]",
    },
    {
      label: "Stock critico",
      value: stats.lowStock.length,
      hint: stats.lowStock.length > 0 ? "Requiere revision" : "Sin alertas",
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-[#a86604]" />,
      accentClassName: "bg-[#fff6de]",
    },
    {
      label: "Perfiles",
      value: stats.totalProfiles,
      hint: "Base total",
      icon: <UserGroupIcon className="h-5 w-5 text-[#1d7a54]" />,
      accentClassName: "bg-[#e8faef]",
    },
    {
      label: "Coleccionistas",
      value: stats.activeCollectors,
      hint: "Usuarios activos",
      icon: <SparklesIcon className="h-5 w-5 text-[#8a5a18]" />,
      accentClassName: "bg-[#fff2e4]",
    },
    {
      label: "Referidos activos",
      value: stats.activeReferralCodes,
      hint: "Codigos vigentes",
      icon: <GiftIcon className="h-5 w-5 text-[#8c247e]" />,
      accentClassName: "bg-[#feeaf7]",
    },
    {
      label: "Usos de referido",
      value: stats.totalReferralUses,
      hint: "Adopcion del programa",
      icon: <GiftIcon className="h-5 w-5 text-[#315ab8]" />,
      accentClassName: "bg-[#ebf2ff]",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border border-[#d9d2b4] bg-[radial-gradient(circle_at_top_right,rgba(214,244,142,0.42),transparent_30%),linear-gradient(135deg,#fffdf6_0%,#f3f7e7_52%,#eef3e8_100%)]">
        <CardContent className="space-y-6 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <Badge className="bg-[#e9f4cf] text-[#233411]">Centro de control</Badge>
              <div className="space-y-2">
                <h1 className="font-title text-3xl leading-none text-[var(--ink-900)] sm:text-4xl">Panel admin DOFLINS</h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--ink-700)] sm:text-[15px]">
                  Todo lo importante del panel en una sola vista: operacion, actividad, stock, accesos directos y herramientas que si usas diario.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--ink-600)]">
                <span className="rounded-full border border-[#d9d1b8] bg-white/70 px-3 py-1.5">
                  Ventana: ultimos 30 dias
                </span>
                <span className="rounded-full border border-[#d9d1b8] bg-white/70 px-3 py-1.5">
                  Filtro: {universeFilter === "all" ? "Todos" : universeFilter}
                </span>
                {lastRefreshed ? (
                  <span className="rounded-full border border-[#d9d1b8] bg-white/70 px-3 py-1.5">
                    Actualizado {lastRefreshed.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : null}
                {isRefreshing ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d3e5a9] bg-[#eff8da] px-3 py-1.5 text-[#365618]">
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    Actualizando
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => downloadCsv(stats)}
                className="inline-flex items-center gap-2 rounded-full border border-[#c8e0a0] bg-[#eef5df] px-4 py-2 text-sm font-semibold text-[#2f5b1f] transition hover:bg-[#ddefc7]"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={() => void fetchStats()}
                className="inline-flex items-center gap-2 rounded-full border border-[#d8d2b4] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--ink-800)] transition hover:bg-white"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-[#ddd6bf] bg-white/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
            {(["all", "Animals", "Multiverse"] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  universeFilter === f
                    ? "bg-[#243814] text-white shadow-[0_10px_26px_rgba(36,56,20,0.24)]"
                    : "text-[var(--ink-700)] hover:bg-[#f3f6ea]"
                }`}
              >
                {f === "all" ? "Todos los universos" : f}
              </button>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#d8d1bc] bg-white/78 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Atencion requerida</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[var(--ink-900)]">
                {stats.lowStock.length > 0 ? `${stats.lowStock.length} alertas de stock` : "Operacion estable"}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                {stats.lowStock.length > 0
                  ? "Hay figuras con inventario bajo que conviene revisar hoy."
                  : "No hay items criticos por debajo del umbral definido."}
              </p>
            </div>
            <div className="rounded-3xl border border-[#d8d1bc] bg-white/78 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Figura mas movida</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[var(--ink-900)]">
                {leadFigure ? leadFigure.name : "Sin reveals"}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                {leadFigure ? `${leadFigure.revealCount} reveals en la ventana actual.` : "Todavia no hay actividad suficiente para destacarla."}
              </p>
            </div>
            <div className="rounded-3xl border border-[#d8d1bc] bg-white/78 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Hora pico</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[var(--ink-900)]">
                {busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00` : "Sin datos"}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-600)]">
                {busiestHour ? `${busiestHour.count} reveals acumulados en ese bloque.` : "No hay datos suficientes de actividad por hora."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Accesos directos</p>
            <h2 className="font-title text-2xl text-[var(--ink-900)]">Trabaja mas rapido</h2>
          </div>
          <p className="max-w-xl text-sm text-[var(--ink-600)]">
            Lo mas usado del panel queda a un clic para que no dependas solo del menu superior.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, label, description, Icon, accentClassName }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-3xl border border-[#ddd6bf] bg-white/75 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#cddcab] hover:shadow-[0_18px_36px_rgba(42,62,22,0.12)]"
            >
              <span className={`inline-flex rounded-2xl bg-gradient-to-br p-3 shadow-sm ${accentClassName}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold tracking-tight text-[var(--ink-900)]">{label}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-600)]">{description}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#4d6f29] transition-transform group-hover:translate-x-1">
                Abrir
              </p>
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section id="resumen" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Resumen</p>
            <h2 className="font-title text-2xl text-[var(--ink-900)]">Lectura rapida del negocio</h2>
          </div>
          <p className="max-w-xl text-sm text-[var(--ink-600)]">
            Metricas clave compactas para detectar salud general, adopcion y carga operativa sin tener que bajar por todo el dashboard.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewKpis.map((kpi) => (
            <Card key={kpi.label} className="border border-[#d8d2b4] bg-white/78 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className={`inline-flex rounded-2xl p-3 ${kpi.accentClassName}`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">{kpi.label}</p>
                  <p className="mt-1 font-title text-3xl text-[var(--ink-900)]">{kpi.value}</p>
                  <p className="mt-1 text-xs text-[var(--ink-600)]">{kpi.hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="monitoreo" className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <Card className={PANEL_CLASS_NAME}>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Actividad</p>
                  <h2 className="font-title text-2xl text-[var(--ink-900)]">Reveals por dia</h2>
                </div>
                <p className="text-sm text-[var(--ink-600)]">
                  Tendencia de los ultimos 30 dias para detectar caidas o picos.
                </p>
              </div>
              <BarChart data={revealChartData} maxValue={maxReveals} color="bg-[#6d8a3a]" />
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">
                <span>Hace 30 dias</span>
                <span>Hoy</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className={PANEL_CLASS_NAME}>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Comportamiento</p>
                    <h2 className="font-title text-2xl text-[var(--ink-900)]">Eventos dominantes</h2>
                  </div>
                  {dominantEvent ? (
                    <span className="rounded-full border border-[#d6d1b9] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-600)]">
                      Top: {EVENT_LABELS[dominantEvent.eventType] ?? dominantEvent.eventType}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {topEvents.map((ev) => (
                    <div key={ev.eventType} className="flex items-center gap-3">
                      <span className="w-36 text-xs text-[var(--ink-700)] truncate">
                        {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e8edd8]">
                        <div
                          className="h-full rounded-full bg-[#4a3c8c] transition-all duration-700"
                          style={{ width: `${(ev.count / maxEventCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-[var(--ink-900)]">{ev.count}</span>
                    </div>
                  ))}
                  {topEvents.length === 0 ? (
                    <p className="text-sm text-[var(--ink-500)]">Sin eventos en los ultimos 30 dias.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className={PANEL_CLASS_NAME}>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Distribucion</p>
                    <h2 className="font-title text-2xl text-[var(--ink-900)]">Figuras mas reveladas</h2>
                  </div>
                  <span className="rounded-full border border-[#d6d1b9] bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink-600)]">
                    Top {topRevealedFigures.length}
                  </span>
                </div>
                {topRevealedFigures.length > 0 ? (
                  <div className="space-y-2">
                    {topRevealedFigures.map((item) => {
                      const maxCount = topRevealedFigures[0]?.revealCount ?? 1;
                      const pct = stats.totalReveals30d > 0
                        ? Math.round((item.revealCount / stats.totalReveals30d) * 1000) / 10
                        : 0;
                      const barWidth = maxCount > 0 ? (item.revealCount / maxCount) * 100 : 0;
                      return (
                        <div key={item.doflinId} className="flex items-center gap-3">
                          <div className="flex w-44 shrink-0 items-center gap-2 min-w-0">
                            <Badge
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] ${RARITY_COLORS[item.rarity] ?? "bg-gray-100 text-gray-700"}`}
                            >
                              {item.rarity.slice(0, 3)}
                            </Badge>
                            <span className="truncate text-xs text-[var(--ink-800)]">{item.name}</span>
                          </div>
                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e8edd8]">
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
                ) : (
                  <p className="text-sm text-[var(--ink-500)]">Aun no hay suficientes reveals para comparar figuras.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className={PANEL_CLASS_NAME}>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Operacion</p>
                <h2 className="font-title text-2xl text-[var(--ink-900)]">Estado rapido</h2>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[#d9d2bc] bg-white/70 p-4">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Stock bajo</p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-[var(--ink-900)]">{stats.lowStock.length}</p>
                  <p className="mt-1 text-xs text-[var(--ink-600)]">Figuras por debajo del umbral operativo.</p>
                </div>
                <div className="rounded-2xl border border-[#d9d2bc] bg-white/70 p-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-[#4a6b29]" />
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Hora mas activa</p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-[var(--ink-900)]">
                    {busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00` : "--:--"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-600)]">
                    {busiestHour ? `${busiestHour.count} reveals en el bloque mas fuerte.` : "Sin datos suficientes."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d9d2bc] bg-white/70 p-4">
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4 text-[#3b4a97]" />
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Evento dominante</p>
                  </div>
                  <p className="mt-2 text-lg font-black leading-tight text-[var(--ink-900)]">
                    {dominantEvent ? EVENT_LABELS[dominantEvent.eventType] ?? dominantEvent.eventType : "Sin actividad"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-600)]">
                    {dominantEvent ? `${dominantEvent.count} ocurrencias en la ventana actual.` : "Todavia no hay eventos registrados."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={PANEL_CLASS_NAME}>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                <h2 className="font-title text-2xl text-[var(--ink-900)]">Stock critico</h2>
              </div>
              {stats.lowStock.length === 0 ? (
                <p className="text-sm text-[var(--ink-500)]">Todos los items tienen stock suficiente.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {stats.lowStock.map((item) => (
                    <div
                      key={item.doflinId}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm ${
                        item.remaining <= 1
                          ? "border-red-300 bg-red-50"
                          : item.remaining <= 3
                            ? "border-orange-300 bg-orange-50"
                            : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Badge
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${RARITY_COLORS[item.rarity] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {item.rarity}
                        </Badge>
                        <span className="truncate font-medium text-[var(--ink-900)]">{item.name}</span>
                      </div>
                      <span
                        className={`ml-3 shrink-0 font-bold tabular-nums ${
                          item.remaining <= 1 ? "text-red-700" : item.remaining <= 3 ? "text-orange-700" : "text-amber-700"
                        }`}
                      >
                        {item.remaining}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={PANEL_CLASS_NAME}>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Actividad por hora</p>
                <h2 className="font-title text-2xl text-[var(--ink-900)]">Mapa de calor</h2>
              </div>
              {stats.revealsByHour.length > 0 ? (
                <HourHeatMap data={stats.revealsByHour} />
              ) : (
                <p className="text-sm text-[var(--ink-500)]">Sin datos de reveals en los ultimos 30 dias.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="herramientas" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-500)]">Herramientas</p>
            <h2 className="font-title text-2xl text-[var(--ink-900)]">Operaciones manuales</h2>
          </div>
          <p className="max-w-xl text-sm text-[var(--ink-600)]">
            Acciones que normalmente haces de forma puntual: validar correos, revisar optimizacion de imagenes y correr utilidades internas.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <EmailTestingPanel />
          <WebPConverter />
        </div>
      </section>
    </div>
  );
}

// ─── WebP Image Converter ──────────────────────────────────────────────────────

interface ConvertResult {
  doflin: string;
  field: string;
  from: string;
  to: string;
  savedKB: number;
  status: "converted" | "skipped" | "error";
  reason?: string;
}

interface ConvertResponse {
  status: string;
  dryRun: boolean;
  summary: {
    totalDoflins: number;
    converted: number;
    skipped: number;
    errors: number;
    savedMB: string;
  };
  results: ConvertResult[];
}

function WebPConverter(): React.JSX.Element {
  const [phase, setPhase] = useState<"idle" | "previewing" | "converting" | "done">("idle");
  const [preview, setPreview] = useState<ConvertResponse | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callEndpoint = async (dry: boolean) => {
    setError(null);
    const url = dry ? "/api/admin/convert-webp?dry=true" : "/api/admin/convert-webp";
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `Error ${res.status}`);
    }
    return (await res.json()) as ConvertResponse;
  };

  const handlePreview = async () => {
    setPhase("previewing");
    try {
      const data = await callEndpoint(true);
      setPreview(data);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPhase("idle");
    }
  };

  const handleConvert = async () => {
    setPhase("converting");
    try {
      const data = await callEndpoint(false);
      setResult(data);
      setPreview(null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setPhase("idle");
    }
  };

  const convertible = preview?.results.filter((r) => r.status === "converted") ?? [];
  const data = result ?? preview;

  return (
    <Card className="border border-[#d8d2b4] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)]">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <PhotoIcon className="h-6 w-6 text-[#4e6f2a]" />
          <div>
            <h2 className="font-title text-xl text-[var(--ink-900)]">Convertir imágenes a WebP</h2>
            <p className="text-xs text-[var(--ink-500)]">
              Convierte PNG/JPG existentes a WebP para reducir tamaño ~30-60%. Las nuevas subidas ya se convierten automáticamente.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!result && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={phase === "previewing" || phase === "converting"}
              className="inline-flex items-center gap-2 rounded-full bg-[#e8edd8] px-5 py-2.5 text-sm font-semibold text-[#2f5b1f] transition-colors hover:bg-[#dde5c8] disabled:opacity-50"
            >
              {phase === "previewing" ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PhotoIcon className="h-4 w-4" />
              )}
              {phase === "previewing" ? "Analizando…" : "Analizar imágenes"}
            </button>
          )}

          {preview && convertible.length > 0 && !result && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={phase === "converting"}
              className="inline-flex items-center gap-2 rounded-full bg-[#4e6f2a] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#3d5820] disabled:opacity-50"
            >
              {phase === "converting" ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {phase === "converting" ? "Convirtiendo…" : `Convertir ${convertible.length} imagen${convertible.length === 1 ? "" : "es"}`}
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={() => { setResult(null); setPreview(null); setPhase("idle"); }}
              className="inline-flex items-center gap-2 rounded-full bg-[#e8edd8] px-5 py-2.5 text-sm font-semibold text-[#2f5b1f] transition-colors hover:bg-[#dde5c8]"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Verificar de nuevo
            </button>
          )}
        </div>

        {data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[var(--ink-900)]">{data.summary.totalDoflins}</p>
                <p className="text-xs text-[var(--ink-500)]">Doflins total</p>
              </div>
              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[#4e6f2a]">{data.summary.converted}</p>
                <p className="text-xs text-[var(--ink-500)]">{data.dryRun ? "Por convertir" : "Convertidos"}</p>
              </div>
              <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[var(--ink-600)]">{data.summary.skipped}</p>
                <p className="text-xs text-[var(--ink-500)]">Ya optimizados</p>
              </div>
              {!data.dryRun && Number(data.summary.savedMB) > 0 && (
                <div className="rounded-xl bg-white/70 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#4e6f2a]">{data.summary.savedMB} MB</p>
                  <p className="text-xs text-[var(--ink-500)]">Espacio ahorrado</p>
                </div>
              )}
            </div>

            {data.results.filter((r) => r.status !== "skipped").length > 0 && (
              <details className="rounded-xl border border-[#d8d2b4] bg-white/50">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-[var(--ink-700)]">
                  Ver detalle ({data.results.filter((r) => r.status !== "skipped").length} archivos)
                </summary>
                <div className="max-h-64 overflow-y-auto px-4 pb-3 space-y-1">
                  {data.results
                    .filter((r) => r.status !== "skipped")
                    .map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={r.status === "converted" ? "text-[#4e6f2a]" : "text-red-600"}>
                          {r.status === "converted" ? "✓" : "✗"}
                        </span>
                        <span className="truncate text-[var(--ink-700)]">{r.doflin}</span>
                        <span className="text-[var(--ink-400)]">({r.field})</span>
                        {r.savedKB > 0 && (
                          <span className="ml-auto text-[#4e6f2a] font-medium">-{r.savedKB}KB</span>
                        )}
                        {r.reason && <span className="ml-auto text-[var(--ink-400)]">{r.reason}</span>}
                      </div>
                    ))}
                </div>
              </details>
            )}

            {data.summary.converted === 0 && data.summary.errors === 0 && (
              <p className="text-sm text-[#4e6f2a] font-medium">
                ✓ Todas las imágenes ya están en WebP o SVG. No hay nada que convertir.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
