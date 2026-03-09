"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";

const RARITY_COLORS: Record<string, string> = {
  common: "#7F856F",
  rare: "#2E7A4E",
  epic: "#B46A2D",
  legendary: "#e0a845",
  mythic: "#9b5de5",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
  mythic: "Mítico",
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
      <>
        <main className="flex min-h-[80dvh] items-center justify-center pb-28">
          <p className="animate-pulse text-[var(--ink-600)]">Cargando colección…</p>
        </main>
        <BottomNav />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <main className="flex min-h-[80dvh] flex-col items-center justify-center gap-4 pb-28 text-center">
          <p className="text-4xl">😕</p>
          <p className="text-[var(--ink-700)]">{error ?? "Perfil no disponible"}</p>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--brand-primary)] underline underline-offset-2"
          >
            Volver al inicio
          </Link>
        </main>
        <BottomNav />
      </>
    );
  }

  const ownedSet = new Set(data.ownedIds);
  const total = data.doflins.length;
  const owned = ownedSet.size;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  const rarities = ["common", "rare", "epic", "legendary", "mythic"];

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-28">
        {/* Botón volver */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition hover:bg-black/5"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 rounded-2xl border border-[#d8d2b4] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4d9]">
            <span className="text-2xl">🎴</span>
          </div>
          <h1 className="font-title mb-1 text-xl font-bold text-[var(--ink-900)]">
            Colección de {data.maskedEmail}
          </h1>
          <p className="text-sm text-[var(--ink-600)]">
            {owned} de {total} figuras — {pct}% completado
          </p>

          {/* Barra general */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-[#4e6f2a] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Barras por rareza */}
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
                  <div className="mb-1 flex justify-between text-xs text-[var(--ink-600)]">
                    <span>{RARITY_LABEL[r] ?? r}</span>
                    <span>
                      {rarityOwned}/{rarityDoflins.length}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
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

        {/* Grid de figuras */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.doflins.map((d) => {
            const isOwned = ownedSet.has(d.id);
            const imgSrc = isOwned
              ? (d.imagenUrl ?? "/images/placeholders/doflin.webp")
              : (d.siluetaUrl ?? "/images/placeholders/silhouette.webp");

            return (
              <div
                key={d.id}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  isOwned
                    ? "border-[#4e6f2a] shadow-sm"
                    : "border-black/10 opacity-50 grayscale"
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1 pb-1">
                    <p className="truncate text-[10px] font-medium leading-tight text-white">
                      {d.nombre}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
