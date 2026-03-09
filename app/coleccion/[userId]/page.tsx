import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import type { Metadata } from "next";

import { BottomNav } from "@/components/nav/bottom-nav";
import { getDb } from "@/lib/db/client";
import { doflins, userCollectionProgress } from "@/lib/db/schema";

const RARITY_COLORS: Record<string, string> = {
  COMMON: "#7F856F",
  RARE: "#2E7A4E",
  EPIC: "#B46A2D",
  LEGENDARY: "#e0a845",
  ULTRA: "#8a2020",
  MYTHIC: "#9b5de5",
};

const RARITY_LABEL: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};

const RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY", "ULTRA", "MYTHIC"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Colección pública · DOFLINS`,
    description: `Mira la colección de figuras DOFLINS de este coleccionista.`,
    robots: { index: false },
    openGraph: {
      url: `https://doflins.dofer.mx/coleccion/${userId}`,
    },
  };
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<React.JSX.Element> {
  const { userId } = await params;

  if (!userId || userId.length > 64) notFound();

  const db = getDb();

  const [allDoflins, ownedRows] = await Promise.all([
    db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        rareza: doflins.rareza,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
      })
      .from(doflins)
      .where(eq(doflins.activo, true)),

    db
      .select({
        doflinId: userCollectionProgress.doflinId,
        userEmail: userCollectionProgress.userEmail,
      })
      .from(userCollectionProgress)
      .where(eq(userCollectionProgress.supabaseUserId, userId)),
  ]);

  if (ownedRows.length === 0) notFound();

  const ownedSet = new Set(ownedRows.map((r) => r.doflinId));
  const rawEmail = ownedRows[0]?.userEmail ?? "";
  const [user, domain] = rawEmail.split("@");
  const maskedEmail = user
    ? `${user.slice(0, 2)}${"*".repeat(Math.max(0, user.length - 2))}@${domain ?? ""}`
    : "coleccionista";

  const total = allDoflins.length;
  const owned = ownedSet.size;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-28">
        {/* Volver */}
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
            Colección de {maskedEmail}
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
            {RARITIES.map((r) => {
              const rarityDoflins = allDoflins.filter((d) => d.rareza === r);
              const rarityOwned = rarityDoflins.filter((d) => ownedSet.has(d.id)).length;
              const rarityPct =
                rarityDoflins.length > 0
                  ? Math.round((rarityOwned / rarityDoflins.length) * 100)
                  : 0;
              const color = RARITY_COLORS[r] ?? "#aaa";
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
          {allDoflins.map((d) => {
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
