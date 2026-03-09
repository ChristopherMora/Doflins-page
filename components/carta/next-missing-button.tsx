"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SerieItem {
  id: number;
  nombre: string;
}

interface NextMissingButtonProps {
  currentId: number;
  serie: string;
  serieDoflins: SerieItem[];
}

export function NextMissingButton({
  currentId,
  serie,
  serieDoflins,
}: NextMissingButtonProps): React.JSX.Element | null {
  const [nextId, setNextId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setNextId(null); return; }
      try {
        const res = await fetch("/api/collection/user");
        if (!res.ok) { setNextId(null); return; }
        const { ownedIds } = (await res.json()) as { ownedIds: number[] };
        const ownedSet = new Set(ownedIds);
        const missing = serieDoflins.find((d) => d.id !== currentId && !ownedSet.has(d.id));
        setNextId(missing?.id ?? null);
      } catch {
        setNextId(null);
      }
    });
  }, [currentId, serieDoflins]);

  // undefined = still loading, null = not logged in or none missing
  if (nextId === undefined || nextId === null) return null;

  return (
    <Link
      href={`/carta/${nextId}`}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-[#d8d2b4] bg-white/80 px-5 py-2.5 text-sm font-semibold text-[var(--ink-700)] transition hover:bg-[#f0f8e0] active:scale-95"
    >
      Siguiente que me falta en serie {serie}
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );
}
