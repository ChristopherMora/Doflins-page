import type { Metadata } from "next";
import { TrophyIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { NicknameEditor } from "@/components/collection/nickname-editor";

export const metadata: Metadata = {
  title: "Ranking · DOFLINS",
  description: "Los coleccionistas con más figuras DOFLINS. ¿Estás entre los mejores?",
  robots: { index: true },
};

export const revalidate = 180;

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface RankingRow {
  rank: number;
  supabaseUserId: string;
  displayName: string | null;
  userEmail: string;
  total: number;
}

// ─── Fetch server-side ─────────────────────────────────────────────────────────

async function getRanking(): Promise<RankingRow[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/ranking`, { next: { revalidate: 180 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { ranking: RankingRow[] };
    return data.ranking ?? [];
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayLabel(row: RankingRow) {
  return row.displayName ?? row.userEmail;
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default async function RankingPage(): Promise<React.JSX.Element> {
  const ranking = await getRanking();

  // Reordenamos para el podio olímpico: [2°, 1°, 3°]
  const first = ranking[0];
  const second = ranking[1];
  const third = ranking[2];
  const podioOrdered = [second, first, third].filter(Boolean) as RankingRow[];

  const rest = ranking.slice(3);

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 pb-28 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fffbe6] shadow-inner">
            <TrophyIcon className="h-7 w-7 text-[#f0c020]" />
          </div>
          <h1 className="font-title mt-3 text-2xl font-black text-[var(--ink-900)]">
            Ranking de Coleccionistas
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-400)]">Top 50 · Actualizado cada 3 minutos</p>
        </div>

        {/* Tu nombre en el ranking */}
        <div className="mb-8">
          <NicknameEditor />
        </div>

        {ranking.length === 0 ? (
          <p className="text-center text-sm text-[var(--ink-400)]">Aún no hay datos disponibles.</p>
        ) : null}

        {/* Podio olímpico [2°, 1°, 3°] */}
        {first ? (
          <div className="mb-8 flex items-end justify-center gap-3">
            {podioOrdered.map((row) => {
              const pos = row.rank;
              const isFirst = pos === 1;
              const isSecond = pos === 2;

              const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉";
              const heightClass = isFirst ? "pb-6 pt-5" : isSecond ? "pb-4 pt-4" : "pb-3 pt-3";
              const bgClass = isFirst
                ? "bg-gradient-to-b from-[#fff9e6] to-[#fef0a0] border-[#f0c020]"
                : isSecond
                  ? "bg-gradient-to-b from-[#f4f8fc] to-[#dde8f0] border-[#aabecb]"
                  : "bg-gradient-to-b from-[#fdf4ef] to-[#f0ddd0] border-[#c8977a]";
              const widthClass = isFirst ? "w-[38%]" : "w-[28%]";

              return (
                <div
                  key={row.supabaseUserId}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 text-center shadow-sm ${bgClass} ${heightClass} ${widthClass} px-2`}
                >
                  <span className="text-2xl">{medal}</span>
                  <p className="mt-0.5 w-full truncate text-xs font-bold text-[var(--ink-800)]">
                    {displayLabel(row)}
                  </p>
                  <p className="font-title text-2xl font-black text-[#4e6f2a]">{row.total}</p>
                  <p className="text-[10px] text-[var(--ink-400)]">figuras</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Tabla del puesto 4 en adelante */}
        {rest.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--surface-200)] bg-[var(--background)]">
            {rest.map((row, i) => (
              <div
                key={row.supabaseUserId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--surface-50)]"
                } ${i < rest.length - 1 ? "border-b border-[var(--surface-100)]" : ""}`}
              >
                <span className="w-6 shrink-0 text-center text-xs font-bold text-[var(--ink-300)]">
                  {row.rank}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-[var(--ink-800)]">
                  {displayLabel(row)}
                </span>
                <div className="flex shrink-0 items-baseline gap-1">
                  <span className="font-title font-black text-[#4e6f2a]">{row.total}</span>
                  <span className="text-xs text-[var(--ink-400)]">figs</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {ranking.length > 0 ? (
          <p className="mt-6 text-center text-xs text-[var(--ink-300)]">
            ¿No apareces? Escanea más bolsas y guarda tu progreso.
          </p>
        ) : null}
      </main>
      <BottomNav />
    </>
  );
}
