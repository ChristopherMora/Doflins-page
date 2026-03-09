"use client";

import { useEffect, useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface RankingEntry {
  rank: number;
  supabaseUserId: string;
  total: number;
}

export function MyRankBanner({
  ranking,
}: {
  ranking: RankingEntry[];
}): React.JSX.Element | null {
  const [myEntry, setMyEntry] = useState<RankingEntry | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setMyEntry(null);
        return;
      }
      const found = ranking.find((r) => r.supabaseUserId === session.user.id) ?? null;
      setMyEntry(found);
    });
  }, [ranking]);

  // undefined = cargando (no renderizar nada), null = no autenticado o fuera del top 50
  if (myEntry === undefined || myEntry === null) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-[#4e6f2a] bg-[#eef5df] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4e6f2a]">
        <TrophyIcon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#4e6f2a]">
          Tu posición en el ranking
        </p>
        <p className="font-title text-xl font-black text-[var(--ink-900)]">
          #{myEntry.rank}{" "}
          <span className="text-base font-semibold text-[var(--ink-600)]">
            · {myEntry.total} figura{myEntry.total !== 1 ? "s" : ""}
          </span>
        </p>
      </div>
    </div>
  );
}
