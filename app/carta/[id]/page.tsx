import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, ShareIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { eq } from "drizzle-orm";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { ShareFigureButton } from "@/components/carta/share-figure-button";
import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doflins.dofer.mx";

const RARITY_LABEL: Record<string, string> = {
  COMMON:    "Común",
  RARE:      "Raro",
  EPIC:      "Épico",
  LEGENDARY: "Legendario",
  ULTRA:     "Ultra",
  MYTHIC:    "Mítico",
};
const RARITY_BG: Record<string, string> = {
  COMMON:    "from-[#eef1e8] to-[#dde3d4]",
  RARE:      "from-[#e0f3ea] to-[#c8e8d8]",
  EPIC:      "from-[#fdf0e4] to-[#f5dfc0]",
  LEGENDARY: "from-[#fdf5e0] to-[#f5e5b0]",
  ULTRA:     "from-[#fde8e8] to-[#f5c8c8]",
  MYTHIC:    "from-[#f5e0fd] to-[#e8c0f5]",
};
const RARITY_COLOR: Record<string, string> = {
  COMMON:    "#5a6650",
  RARE:      "#2e6040",
  EPIC:      "#8a4820",
  LEGENDARY: "#7a5010",
  ULTRA:     "#8a2020",
  MYTHIC:    "#6020a0",
};

interface CartaPageProps {
  params: Promise<{ id: string }>;
}

async function getDoflin(id: number) {
  const db = getDb();
  const [row] = await db
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
      datoCurioso: doflins.datoCurioso,
    })
    .from(doflins)
    .where(eq(doflins.id, id))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: CartaPageProps): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!numId || isNaN(numId)) return { title: "Carta DOFLINS" };

  const doflin = await getDoflin(numId);
  if (!doflin) return { title: "Carta no encontrada | DOFLINS" };

  const ogUrl = `${BASE_URL}/api/og/doflin?name=${encodeURIComponent(doflin.nombre)}&rarity=${doflin.rareza}&image=${encodeURIComponent(doflin.imagenUrl)}&series=${encodeURIComponent(doflin.serie)}&number=${doflin.numeroColeccion}`;

  const title = `${doflin.nombre} (${RARITY_LABEL[doflin.rareza] ?? doflin.rareza}) | DOFLINS`;
  const description = doflin.datoCurioso
    ? `Figurita ${RARITY_LABEL[doflin.rareza] ?? doflin.rareza} de la colección DOFLINS. "${doflin.datoCurioso}"`
    : `Figurita ${RARITY_LABEL[doflin.rareza] ?? doflin.rareza} de la serie ${doflin.serie}. ¡Encuéntrala en tu próximo sobre!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: doflin.nombre }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function CartaPage({ params }: CartaPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!numId || isNaN(numId)) notFound();

  const doflin = await getDoflin(numId);
  if (!doflin) notFound();

  const rareza = doflin.rareza;

  return (
    <>
      <main className="flex min-h-dvh flex-col items-center justify-center px-5 pb-28 pt-10">
        <div className="w-full max-w-sm space-y-5">
          {/* Carta */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${RARITY_BG[rareza] ?? "from-[#f5f5f0] to-[#ebebeb]"} shadow-[0_32px_80px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.07]`}>
            {/* Top accent */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: RARITY_COLOR[rareza] ?? "#888" }}
            />
            <div className="p-5 pb-0 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: RARITY_COLOR[rareza] }}>
                Serie {doflin.serie} · #{String(doflin.numeroColeccion).padStart(2, "0")}
              </p>
              <h1 className="font-title mt-1 text-3xl font-black text-[var(--ink-900)]">
                {doflin.nombre}
              </h1>
              {doflin.modeloBase !== doflin.nombre ? (
                <p className="mt-0.5 text-sm text-[var(--ink-500)]">{doflin.modeloBase}</p>
              ) : null}
            </div>

            {/* Imagen */}
            <div className="relative mt-4 h-72 w-full overflow-hidden">
              <Image
                src={doflin.imagenUrl}
                alt={doflin.nombre}
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>

            {/* Rareza badge */}
            <div className="flex justify-center pb-5 pt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-bold shadow-sm"
                style={{
                  backgroundColor: RARITY_COLOR[rareza] + "22",
                  color: RARITY_COLOR[rareza],
                  border: `1.5px solid ${RARITY_COLOR[rareza]}44`,
                }}
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                {RARITY_LABEL[rareza] ?? rareza}
              </span>
            </div>

            {doflin.datoCurioso ? (
              <div className="border-t border-black/[0.07] mx-4 mb-4 mt-0 pt-4">
                <p className="text-center text-xs text-[var(--ink-600)] italic leading-relaxed">
                  "{doflin.datoCurioso}"
                </p>
              </div>
            ) : null}
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <ShareFigureButton
              nombre={doflin.nombre}
              rareza={RARITY_LABEL[rareza] ?? rareza}
            />
            <Button asChild className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
              <Link href="/coleccion">
                ¿Ya la tienes? Guarda tu progreso
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/reveal?universe=${doflin.serie.toLowerCase()}`}>
                <SparklesIcon className="h-4 w-4" /> Ver catálogo completo
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-[var(--ink-400)]">
            Figura de la colección DOFLINS · Animals &amp; Multiverse
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
