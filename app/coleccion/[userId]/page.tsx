"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const RARITY_COLORS: Record<string, string> = {
  common: "#7F856F",
  rare: "#2E7A4E",
  epic: "#B46A2D",
  legendary: "#e0a845",
  mythic: "#9b5de5",
};

interface DoflinRow {
  id: number;
  nombre: string;
  rareza: string;
  imagenUrl: string | null;
  siluetaUrl: string | null;
  serie: string | null;
  numeroColeccion: number | null;
}

interface PublicProfileData {
  maskedEmail: string;
  doflins: DoflinRow[];
  ownedIds: number[];
}

export default function PublicCollectionPage({
  params,
}: {
  params: { userId: string };
}) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/collection/public/${params.userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Perfil no encontrado");
        return res.json() as Promise<PublicProfileData>;
      })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Error desconocido"),
      )
      .finally(() => setLoading(false));
  }, [params.userId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink-600 animate-pulse">Cargando colección…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error ?? "Perfil no disponible"}</p>
      </main>
    );
  }

  const ownedSet = new Set(data.ownedIds);
  const total = data.doflins.length;
  const owned = ownedSet.size;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  const rarities = ["common", "rare", "epic", "legendary", "mythic"];

  return (
    <main className="min-h-screen bg-surface-50 px-4 py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-surface-200 rounded-2xl shadow-sm p-6 mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🎴</span>
        </div>
        <h1 className="text-xl font-bold text-ink-900 mb-1">
          Colección de {data.maskedEmail}
        </h1>
        <p className="text-sm text-ink-600">
          {owned} de {total} figuras — {pct}% completado
        </p>

        {/* Overall bar */}
        <div className="mt-4 h-2 rounded-full bg-surface-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Rarity bars */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {rarities.map((r) => {
            const rarityDoflins = data.doflins.filter((d) => d.rareza === r);
            const rarityOwned = rarityDoflins.filter((d) =>
              ownedSet.has(d.id),
            ).length;
            const rarityPct =
              rarityDoflins.length > 0
                ? Math.round((rarityOwned / rarityDoflins.length) * 100)
                : 0;
            const color =
              RARITY_COLORS[r as keyof typeof RARITY_COLORS] ?? "#aaa";
            return (
              <div key={r}>
                <div className="flex justify-between text-xs text-ink-600 mb-1">
                  <span className="capitalize">{r}</span>
                  <span>
                    {rarityOwned}/{rarityDoflins.length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${rarityPct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {data.doflins.map((d) => {
          const isOwned = ownedSet.has(d.id);
          const imgSrc = isOwned
            ? (d.imagenUrl ?? "/images/placeholders/doflin.webp")
            : (d.siluetaUrl ?? "/images/placeholders/silhouette.webp");

          return (
            <div
              key={d.id}
              className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                isOwned
                  ? "border-primary shadow-sm"
                  : "border-surface-200 opacity-50 grayscale"
              }`}
            >
              <Image
                src={imgSrc}
                alt={isOwned ? d.nombre : "???"}
                fill
                className="object-cover"
                sizes="(max-width:640px) 33vw, 25vw"
              />
              {isOwned && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-1">
                  <p className="text-white text-[10px] font-medium leading-tight truncate">
                    {d.nombre}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
