"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeAchievements, type AchievementInput } from "@/lib/achievements";
import { TrophyIcon } from "@heroicons/react/24/solid";

interface CollectionData {
  doflins: { id: number; rareza: string; serie: string }[];
  ownedIds: number[];
}

export function AchievementsPerfilSection() {
  const [input, setInput] = useState<AchievementInput | null>(null);

  useEffect(() => {
    fetch("/api/collection/user")
      .then((r) => (r.ok ? (r.json() as Promise<CollectionData>) : null))
      .then((data) => {
        if (!data) return;
        const ownedSet = new Set(data.ownedIds);
        const byRarity: Record<string, { total: number; owned: number }> = {};
        for (const d of data.doflins) {
          if (!byRarity[d.rareza]) byRarity[d.rareza] = { total: 0, owned: 0 };
          byRarity[d.rareza].total++;
          if (ownedSet.has(d.id)) byRarity[d.rareza].owned++;
        }
        setInput({
          totalOwned: data.ownedIds.length,
          totalDoflins: data.doflins.length,
          ownedByRarity: Object.fromEntries(
            Object.entries(byRarity).map(([r, v]) => [r.toLowerCase(), v.owned]),
          ),
          totalByRarity: Object.fromEntries(
            Object.entries(byRarity).map(([r, v]) => [r.toLowerCase(), v.total]),
          ),
          series: [
            ...new Set(
              data.doflins.filter((d) => ownedSet.has(d.id)).map((d) => d.serie),
            ),
          ],
        });
      })
      .catch(() => null);
  }, []);

  if (!input) return null;

  const achievements = computeAchievements(input);
  const unlocked = achievements.filter((a) => a.unlocked);
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-100)] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-bold text-[var(--ink-900)]">Mis logros</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-200)]">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[var(--ink-500)]">
            {unlocked.length}/{total}
          </span>
        </div>
      </div>

      {/* Unlocked achievements scroll */}
      {unlocked.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {unlocked.map((ach) => (
            <div
              key={ach.id}
              title={`${ach.title}: ${ach.description}`}
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-[var(--surface-200)] bg-white px-3 py-2 text-center"
              style={{
                borderColor: `color-mix(in srgb, ${ach.color} 30%, transparent)`,
                background: `color-mix(in srgb, ${ach.color} 8%, white)`,
              }}
            >
              <span className="text-xl leading-none">{ach.emoji}</span>
              <p className="max-w-[72px] text-[10px] font-semibold leading-tight text-[var(--ink-800)]">
                {ach.title}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--ink-400)]">
          Marca tus primeras figuras para desbloquear logros.
        </p>
      )}

      <Link
        href="/coleccion"
        className="mt-3 block text-center text-xs font-semibold text-[var(--brand-primary)] hover:underline"
      >
        Ver todos los logros →
      </Link>
    </div>
  );
}
