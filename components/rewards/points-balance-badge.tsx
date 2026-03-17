"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { getLevel } from "@/lib/server/levels";

export function PointsBalanceBadge() {
  const [data, setData] = useState<{ balance: number; totalEarned: number } | null>(null);

  useEffect(() => {
    fetch("/api/points")
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as { balance: number; totalEarned: number };
        setData(json);
      })
      .catch(() => undefined);
  }, []);

  if (data === null) return null;

  const level = getLevel(data.totalEarned);

  return (
    <Link
      href="/recompensas"
      className="flex items-center justify-between rounded-2xl border border-[#b8d493] bg-[#eef5df] px-4 py-3 transition hover:bg-[#e4f0d0] active:scale-[.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4e6f2a]">
          <StarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#4e6f2a]">
            Tus puntos DOFLINS
            <span className="rounded-full bg-[#4e6f2a]/10 px-2 py-0.5 text-xs font-bold text-[#2d4915]">
              {level.emoji} {level.label}
            </span>
          </p>
          <p className="font-title text-xl font-black text-[#2d4915]">
            {data.balance.toLocaleString("es-MX")} pts
          </p>
        </div>
      </div>
      <span className="text-xs font-semibold text-[#4e6f2a]">Ver tienda →</span>
    </Link>
  );
}
