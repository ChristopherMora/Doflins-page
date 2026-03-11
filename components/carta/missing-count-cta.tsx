"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";

interface CollectionData {
  doflins: Array<{ id: number; serie: string }>;
  ownedIds: number[];
}

export function MissingCountCTA({ serie }: { serie: string }): React.JSX.Element | null {
  const [state, setState] = useState<{
    missing: number;
    total: number;
    owned: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/collection/user");
        if (!res.ok) return; // not logged in
        const json = (await res.json()) as CollectionData;
        const serieDoflins = json.doflins.filter((d) => d.serie === serie);
        const ownedInSerie = serieDoflins.filter((d) =>
          json.ownedIds.includes(d.id),
        ).length;
        setState({
          total: serieDoflins.length,
          owned: ownedInSerie,
          missing: serieDoflins.length - ownedInSerie,
        });
      } catch {
        /* not logged in or network error — stay hidden */
      }
    };
    void load();
  }, [serie]);

  if (!state || state.total === 0) return null;

  if (state.missing === 0) {
    return (
      <div className="rounded-2xl bg-[#eaf5d8] px-4 py-3 text-center">
        <p className="text-sm font-bold text-[#4e6f2a]">
          🏆 ¡Completaste toda la serie {serie}!
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d8d2b4] bg-[var(--surface-100)] px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[var(--ink-900)]">
          Solo te faltan{" "}
          <span className="font-black text-[#4e6f2a]">{state.missing}</span>{" "}
          para completar {serie}
        </p>
        <p className="text-xs text-[var(--ink-500)]">
          Tienes {state.owned} de {state.total}
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="shrink-0 bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
      >
        <Link href="/#compras">
          <ShoppingCartIcon className="h-3.5 w-3.5" /> Ver packs
        </Link>
      </Button>
    </div>
  );
}
