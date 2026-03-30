"use client";

import { useEffect, useState } from "react";
import { FireIcon } from "@heroicons/react/24/solid";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastRevealDate: string | null;
}

export function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    fetch("/api/stats/streak")
      .then((r) => r.ok ? r.json() as Promise<StreakData> : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => null);
  }, []);

  if (!data || data.currentStreak === 0) return null;

  const isHot = data.currentStreak >= 3;
  const isOnFire = data.currentStreak >= 7;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 ${
        isOnFire
          ? "border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/40"
          : isHot
          ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
          : "border-[var(--surface-200)] bg-[var(--surface-100)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isOnFire
              ? "bg-orange-100 text-orange-500 dark:bg-orange-900/50"
              : isHot
              ? "bg-amber-100 text-amber-500 dark:bg-amber-900/50"
              : "bg-[var(--surface-200)] text-[var(--ink-500)]"
          }`}
        >
          <FireIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--ink-900)]">
            Racha de reveals
          </p>
          <p className="text-xs text-[var(--ink-500)]">
            {isOnFire
              ? "🔥 ¡Imparable! Sigue así"
              : isHot
              ? "✨ ¡Buena racha!"
              : "¡Buen comienzo!"}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`font-title text-3xl font-black leading-none ${
            isOnFire ? "text-orange-500" : isHot ? "text-amber-500" : "text-[var(--ink-900)]"
          }`}
        >
          {data.currentStreak}
          <span className="ml-0.5 text-lg">🔥</span>
        </p>
        <p className="text-[10px] text-[var(--ink-400)]">
          Récord: {data.longestStreak} día{data.longestStreak !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
