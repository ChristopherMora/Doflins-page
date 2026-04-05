"use client";

import { useEffect, useState } from "react";
import { TrophyIcon, CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface StatsData {
  memberSince: string | null;
  totalOwned: number;
  totalDoflins: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

function formatDays(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

function formatMemberDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

export function CollectorStats(): React.JSX.Element | null {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/stats")
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as StatsData;
          setStats(data);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface-100)]" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const collectionPercent =
    stats.totalDoflins > 0
      ? Math.round((stats.totalOwned / stats.totalDoflins) * 100)
      : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Días como coleccionista */}
      <div className="flex flex-col items-center rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-3 py-3 text-center">
        <CalendarDaysIcon className="h-5 w-5 text-[var(--brand-primary)]" />
        <p className="mt-1 text-lg font-bold text-[var(--ink-900)]">
          {stats.memberSince ? formatDays(stats.memberSince) : "—"}
        </p>
        <p className="text-[10px] text-[var(--ink-500)] leading-tight">
          {stats.memberSince ? `Desde ${formatMemberDate(stats.memberSince)}` : "Coleccionista"}
        </p>
      </div>

      {/* Progreso de colección */}
      <Link
        href="/coleccion"
        className="flex flex-col items-center rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-3 py-3 text-center transition hover:border-[var(--surface-300)]"
      >
        <SparklesIcon className="h-5 w-5 text-[#7ab55c]" />
        <p className="mt-1 text-lg font-bold text-[var(--ink-900)]">
          {collectionPercent}%
        </p>
        <p className="text-[10px] text-[var(--ink-500)] leading-tight">
          {stats.totalOwned}/{stats.totalDoflins} figuras
        </p>
      </Link>

      {/* Logros desbloqueados */}
      <Link
        href="/coleccion"
        className="flex flex-col items-center rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-3 py-3 text-center transition hover:border-[var(--surface-300)]"
      >
        <TrophyIcon className="h-5 w-5 text-[#D59A1A]" />
        <p className="mt-1 text-lg font-bold text-[var(--ink-900)]">
          {stats.unlockedAchievements}/{stats.totalAchievements}
        </p>
        <p className="text-[10px] text-[var(--ink-500)] leading-tight">Logros</p>
      </Link>
    </div>
  );
}
