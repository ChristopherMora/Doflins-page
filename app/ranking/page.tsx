import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { TrophyIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { NicknameEditor } from "@/components/collection/nickname-editor";
import { MyRankBanner } from "@/components/ranking/my-rank-banner";
import { RankingPodium, RankingTable } from "@/components/ranking/ranking-board";
import { getDb } from "@/lib/db/client";
import { userCollectionProgress, userProfiles } from "@/lib/db/schema";

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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "Coleccionista";
  return `${local.slice(0, 3)}***@${domain}`;
}

async function getRanking(): Promise<RankingRow[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        supabaseUserId: userCollectionProgress.supabaseUserId,
        userEmail: userCollectionProgress.userEmail,
        displayName: userProfiles.displayName,
        total: sql<number>`CAST(COUNT(*) AS UNSIGNED)`,
      })
      .from(userCollectionProgress)
      .leftJoin(userProfiles, eq(userProfiles.supabaseUserId, userCollectionProgress.supabaseUserId))
      .where(eq(userCollectionProgress.owned, true))
      .groupBy(
        userCollectionProgress.supabaseUserId,
        userCollectionProgress.userEmail,
        userProfiles.displayName,
      )
      .orderBy(desc(sql`COUNT(*)`))
      .limit(50);

    return rows.map((r, i) => ({
      rank: i + 1,
      supabaseUserId: r.supabaseUserId,
      displayName: r.displayName ?? null,
      userEmail: maskEmail(r.userEmail),
      total: r.total,
    }));
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
        <div className="mb-6">
          <NicknameEditor />
        </div>

        {/* Tu posición si estás en el top 50 */}
        <MyRankBanner ranking={ranking} />

        {ranking.length === 0 ? (
          <p className="text-center text-sm text-[var(--ink-400)]">Aún no hay datos disponibles.</p>
        ) : null}

        {/* Podio olímpico [2°, 1°, 3°] */}
        {first ? (
          <RankingPodium rows={podioOrdered} />
        ) : null}

        {/* Tabla del puesto 4 en adelante */}
        {rest.length > 0 ? (
          <RankingTable rows={rest} />
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
