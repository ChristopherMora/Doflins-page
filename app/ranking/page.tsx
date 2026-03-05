import type { Metadata } from "next";
import { TrophyIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";

export const metadata: Metadata = {
  title: "Ranking · DOFLINS",
  description: "Los coleccionistas con más figuras DOFLINS. ¿Estás entre los mejores?",
  robots: { index: true },
};

export const revalidate = 180; // refresca cada 3 minutos

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface RankingRow {
  rank: number;
  supabaseUserId: string;
  displayName: string | null;
  userEmail: string; // ya viene enmascarado del API
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

// ─── Podio ─────────────────────────────────────────────────────────────────────

const MEDAL = ["🥇", "🥈", "🥉"];
const PODIO_COLORS = [
  "from-[#fff7d6] to-[#fef0a0] border-[#f0c020]",   // 1°
  "from-[#f0f4f8] to-[#e0e8ef] border-[#b0bec8]",   // 2°
  "from-[#fdf1eb] to-[#f5e0d0] border-[#d0a080]",   // 3°
];

// ─── Página ────────────────────────────────────────────────────────────────────

export default async function RankingPage(): Promise<React.JSX.Element> {
  const ranking = await getRanking();
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <TrophyIcon className="mx-auto h-10 w-10 text-[#f0c020]" />
          <h1 className="font-title mt-2 text-3xl font-black text-[var(--ink-900)]">
            Ranking de Coleccionistas
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-400)]">
            Top 50 · Actualizado cada 3 minutos
          </p>
        </div>

        {ranking.length === 0 ? (
          <p className="text-center text-[var(--ink-400)]">Aún no hay datos disponibles.</p>
        ) : null}

        {/* Podio top 3 */}
        {top3.length > 0 ? (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {top3.map((row, i) => (
              <div
                key={row.supabaseUserId}
                className={`flex flex-col items-center gap-1 rounded-3xl border bg-gradient-to-b p-4 text-center shadow-sm ${PODIO_COLORS[i]}`}
              >
                <span className="text-3xl">{MEDAL[i]}</span>
                <p className="mt-1 truncate text-sm font-bold text-[var(--ink-900)] max-w-full">
                  {row.displayName ?? row.userEmail}
                </p>
                <p className="font-title text-xl font-black text-[#4e6f2a]">{row.total}</p>
                <p className="text-[10px] text-[var(--ink-400)]">figuras</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Tabla resto */}
        {rest.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-[var(--surface-200)] bg-[var(--background)] shadow-sm">
            {rest.map((row, i) => (
              <div
                key={row.supabaseUserId}
                className={`flex items-center gap-4 px-5 py-3.5 ${
                  i < rest.length - 1 ? "border-b border-[var(--surface-200)]" : ""
                }`}
              >
                {/* Posición */}
                <span className="w-7 shrink-0 text-right text-sm font-bold text-[var(--ink-300)]">
                  {row.rank}
                </span>
                {/* Nombre */}
                <span className="flex-1 truncate text-sm font-semibold text-[var(--ink-800)]">
                  {row.displayName ?? row.userEmail}
                </span>
                {/* Total */}
                <span className="shrink-0 font-title font-black text-[#4e6f2a]">{row.total}</span>
                <span className="shrink-0 text-xs text-[var(--ink-400)]">figs</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* CTA */}
        <p className="mt-8 text-center text-xs text-[var(--ink-300)]">
          ¿No estás aquí? Escanea más bolsas y guarda tu progreso para aparecer en el ranking.
        </p>
      </main>
      <BottomNav />
    </>
  );
}
