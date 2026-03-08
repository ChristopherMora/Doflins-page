import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShoppingCartIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { BolsaSaveWidget } from "@/components/bolsa/bolsa-save-widget";
import { ShareButton } from "@/components/bolsa/share-button";
import { getDb } from "@/lib/db/client";
import { codigosBolsa, codigosBolsaItems, doflins } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Común",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Legendario",
  ULTRA: "Ultra",
  MYTHIC: "Mítico",
};

const RARITY_GRADIENT: Record<string, string> = {
  COMMON: "from-[#eef1e8] to-[#dde3d4]",
  RARE: "from-[#e0f3ea] to-[#c8e8d8]",
  EPIC: "from-[#fdf0e4] to-[#f5dfc0]",
  LEGENDARY: "from-[#fdf5e0] to-[#f5e5b0]",
  ULTRA: "from-[#fde8e8] to-[#f5c8c8]",
  MYTHIC: "from-[#f5e0fd] to-[#e8c0f5]",
};

const RARITY_TEXT: Record<string, string> = {
  COMMON: "text-[#5a6650]",
  RARE: "text-[#2e6040]",
  EPIC: "text-[#8a4820]",
  LEGENDARY: "text-[#8a6020]",
  ULTRA: "text-[#8a2020]",
  MYTHIC: "text-[#6020a0]",
};

interface BolsaPageProps {
  params: Promise<{ codigo: string }>;
}

interface DoflinItem {
  id: number;
  nombre: string;
  modeloBase: string;
  variante: string;
  serie: string;
  numeroColeccion: number;
  rareza: string;
  probabilidad: number;
  imagenUrl: string;
  siluetaUrl: string;
  datoCurioso: string | null;
}

async function getBolsaData(codigo: string): Promise<{
  packSize: number;
  doflins: DoflinItem[];
} | null> {
  try {
    const db = getDb();

    const [bag] = await db
      .select({ id: codigosBolsa.id, packSize: codigosBolsa.packSize, status: codigosBolsa.status })
      .from(codigosBolsa)
      .where(eq(codigosBolsa.codigo, codigo.toUpperCase()))
      .limit(1);

    if (!bag || bag.status === "blocked") return null;

    const items = await db
      .select({
        id: doflins.id,
        nombre: doflins.nombre,
        modeloBase: doflins.modeloBase,
        variante: doflins.variante,
        serie: doflins.serie,
        numeroColeccion: doflins.numeroColeccion,
        rareza: doflins.rareza,
        probabilidad: doflins.probabilidad,
        imagenUrl: doflins.imagenUrl,
        siluetaUrl: doflins.siluetaUrl,
        datoCurioso: doflins.datoCurioso,
      })
      .from(codigosBolsaItems)
      .innerJoin(doflins, eq(codigosBolsaItems.doflinId, doflins.id))
      .where(eq(codigosBolsaItems.codigoBolsaId, bag.id))
      .orderBy(asc(codigosBolsaItems.posicion));

    // Registrar scan (fire and forget)
    void db
      .update(codigosBolsa)
      .set({ scanCount: bag.id, usado: true, lastScannedAt: new Date(), updatedAt: new Date() })
      .where(eq(codigosBolsa.id, bag.id))
      .catch(console.error);

    return { packSize: bag.packSize, doflins: items };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: BolsaPageProps): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Bolsa ${codigo} | DOFLINS`,
    description: "Escanea el código QR de tu bolsa DOFLINS para ver qué figuras contiene.",
    robots: { index: false },
  };
}

export default async function BolsaPage({ params }: BolsaPageProps): Promise<React.JSX.Element> {
  const { codigo } = await params;

  const data = await getBolsaData(codigo);

  if (!data) notFound();

  const { packSize, doflins: items } = data;

  const rarityOrder = ["MYTHIC", "ULTRA", "LEGENDARY", "EPIC", "RARE", "COMMON"];
  const topRarity = rarityOrder.find((r) => items.some((d) => d.rareza === r)) ?? "COMMON";

  return (
    <>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 pb-32 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf5d8] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#4e6f2a]">
            <SparklesIcon className="h-3.5 w-3.5" />
            Tu bolsa DOFLINS
          </div>
          <h1 className="font-title text-3xl font-bold text-[var(--ink-900)]">
            {items.length} figura{items.length !== 1 ? "s" : ""} en esta bolsa
          </h1>
          <p className="text-sm text-[var(--ink-500)]">
            Pack ×{packSize} · Código <code className="font-mono font-bold text-[#4e6f2a]">{codigo.toUpperCase()}</code>
          </p>
        </div>

        {/* Grid de doflins */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`rounded-2xl bg-gradient-to-b ${RARITY_GRADIENT[item.rareza] ?? "from-[#f5f5f0] to-[#ebebeb]"} overflow-hidden shadow-sm`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={item.imagenUrl || item.siluetaUrl}
                  alt={item.nombre}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span
                    className={`inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold ${RARITY_TEXT[item.rareza] ?? "text-[#666]"}`}
                  >
                    {RARITY_LABELS[item.rareza] ?? item.rareza}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-[var(--ink-900)] leading-tight">{item.nombre}</p>
                <p className="text-[11px] text-[var(--ink-500)] mt-0.5">
                  Serie {item.serie} · <span className="font-mono">#{String(item.numeroColeccion).padStart(2, "0")}</span>
                </p>
                {item.datoCurioso ? (
                  <p className="text-[10px] text-[var(--ink-600)] mt-1.5 italic leading-snug line-clamp-2">
                    "{item.datoCurioso}"
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* CTA guardar progreso */}
        <BolsaSaveWidget codigo={codigo.toUpperCase()} doflinCount={items.length} />

        {/* Compartir bolsa */}
        <ShareButton codigo={codigo.toUpperCase()} itemCount={items.length} />

        {/* CTA comprar más */}
        <div className="mt-4 rounded-2xl bg-[var(--surface-100)] p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--ink-900)]">¿Quieres más figuras?</p>
            <p className="text-xs text-[var(--ink-500)]">Consigue más packs y completa tu colección</p>
          </div>
          <Button asChild size="sm" className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] shrink-0">
            <Link href="/#compras">
              <ShoppingCartIcon className="h-3.5 w-3.5" /> Ver packs
            </Link>
          </Button>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
