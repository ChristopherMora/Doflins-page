"use client";

import { useEffect, useState } from "react";

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};

const RARITY_EMOJI: Record<string, string> = {
  COMMON: "🟢",
  RARE: "🔵",
  EPIC: "🟠",
  LEGENDARY: "⭐",
  ULTRA: "🔴",
  MYTHIC: "💜",
};

interface ActivityItem {
  nombre: string;
  rareza: string;
  serie: string;
  timeAgo: string;
}

export function ActivityFeed(): React.JSX.Element | null {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/events/activity");
        if (res.ok) setItems((await res.json()) as ActivityItem[]);
      } catch {
        /* silent */
      }
    };
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through items every 4s
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      4_000,
    );
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[idx % items.length]!;

  return (
    <div
      key={idx}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2b4] bg-[var(--surface-100)] px-3 py-1 text-[11px] text-[var(--ink-600)] animate-catalog-fadein"
    >
      <span>{RARITY_EMOJI[item.rareza] ?? "📦"}</span>
      <span>
        <span className="font-semibold text-[var(--ink-800)]">{item.nombre}</span>
        {" · "}
        <span className="opacity-75">{RARITY_LABELS[item.rareza] ?? item.rareza}</span>
        {" · "}
        <span className="opacity-60">{item.timeAgo}</span>
      </span>
    </div>
  );
}
