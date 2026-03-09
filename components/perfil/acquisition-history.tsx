"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/solid";

const RARITY_BADGE: Record<string, string> = {
  common: "bg-[#e8edd8] text-[#3d5a2a]",
  rare: "bg-[#dbe4ff] text-[#24336c]",
  epic: "bg-[#f0dbff] text-[#5a1a8a]",
  legendary: "bg-[#ffe9b5] text-[#5e4300]",
  mythic: "bg-[#ffd6f5] text-[#6b006b]",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
  mythic: "Mítico",
};

interface HistoryRow {
  id: number;
  nombre: string;
  rareza: string;
  imagenUrl: string | null;
  serie: string | null;
  obtainedAt: string;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

export function AcquisitionHistory(): React.JSX.Element {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collection/history")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { history: HistoryRow[] };
        setRows(data.history.slice(0, 10));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-[var(--surface-100)]"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--surface-200)] bg-[var(--surface-50)] px-4 py-5 text-center text-sm text-[var(--ink-400)]">
        Aún no has registrado ninguna figura en tu colección.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-3 rounded-xl border border-[var(--surface-200)] bg-[var(--background)] px-3 py-2"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--surface-200)]">
            <Image
              src={row.imagenUrl ?? "/images/placeholders/doflin.webp"}
              alt={row.nombre}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--ink-900)]">{row.nombre}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RARITY_BADGE[row.rareza] ?? "bg-gray-100 text-gray-600"}`}
              >
                {RARITY_LABEL[row.rareza] ?? row.rareza}
              </span>
              {row.serie && (
                <span className="text-[10px] text-[var(--ink-400)]">{row.serie}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--ink-400)]">
            <ClockIcon className="h-3 w-3" />
            {formatRelative(row.obtainedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
