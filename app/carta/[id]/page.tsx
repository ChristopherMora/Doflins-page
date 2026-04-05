import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { and, eq } from "drizzle-orm";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { MarkOwnedButton } from "@/components/carta/mark-owned-button";
import { NextMissingButton } from "@/components/carta/next-missing-button";
import { ShareFigureButton } from "@/components/carta/share-figure-button";
import { MissingCountCTA } from "@/components/carta/missing-count-cta";
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

async function getSerieDoflins(serie: string) {
  const db = getDb();
  return db
    .select({
      id: doflins.id,
      nombre: doflins.nombre,
      rareza: doflins.rareza,
      imagenUrl: doflins.imagenUrl,
      numeroColeccion: doflins.numeroColeccion,
    })
    .from(doflins)
    .where(and(eq(doflins.serie, serie), eq(doflins.activo, true)))
    .orderBy(doflins.numeroColeccion);
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
  const serieDoflins = await getSerieDoflins(doflin.serie);

  // 4 figuras más cercanas en número de colección (excluyendo la actual)
  const related = serieDoflins
    .filter((d) => d.id !== numId)
    .sort(
      (a, b) =>
        Math.abs(a.numeroColeccion - doflin.numeroColeccion) -
        Math.abs(b.numeroColeccion - doflin.numeroColeccion),
    )
    .slice(0, 4);

  const serieForButton = serieDoflins.map((d) => ({ id: d.id, nombre: d.nombre }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: doflin.nombre,
    description:
      doflin.datoCurioso ??
      `Figura DOFLINS ${RARITY_LABEL[rareza] ?? rareza} de la serie ${doflin.serie}.`,
    image: doflin.imagenUrl,
    url: `${BASE_URL}/carta/${doflin.id}`,
    brand: { "@type": "Brand", name: "DOFLINS" },
    category: "Collectible Toy",
    additionalProperty: [
      { "@type": "PropertyValue", name: "Rareza", value: RARITY_LABEL[rareza] ?? rareza },
      { "@type": "PropertyValue", name: "Serie", value: doflin.serie },
      { "@type": "PropertyValue", name: "Número", value: String(doflin.numeroColeccion).padStart(2, "0") },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
              { "@type": "ListItem", position: 2, name: `Serie ${doflin.serie}`, item: `${BASE_URL}/reveal?universe=${doflin.serie.toLowerCase()}` },
              { "@type": "ListItem", position: 3, name: doflin.nombre },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
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
            <div className="relative mt-4 h-72 w-full overflow-hidden" style={{ perspective: "1200px" }}>
              <Image
                src={doflin.imagenUrl}
                alt={doflin.nombre}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-contain card-img-flip"
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
                  &ldquo;{doflin.datoCurioso}&rdquo;
                </p>
              </div>
            ) : null}
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <MarkOwnedButton doflinId={doflin.id} />
            <NextMissingButton
              currentId={doflin.id}
              serie={doflin.serie}
              serieDoflins={serieForButton}
            />
            <ShareFigureButton
              nombre={doflin.nombre}
              rareza={RARITY_LABEL[rareza] ?? rareza}
              imagenUrl={doflin.imagenUrl}
              serie={doflin.serie}
              numeroColeccion={doflin.numeroColeccion}
              doflinId={doflin.id}
            />
            <MissingCountCTA serie={doflin.serie} />
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

          {/* Figuras relacionadas de la misma serie */}
          {related.length > 0 ? (
            <div className="pt-2">
              <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-500)]">
                Más de la serie {doflin.serie}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/carta/${r.id}`}
                    className="group flex flex-col items-center gap-1 rounded-2xl border border-[#d8d2b4] bg-white/60 p-2 text-center transition hover:scale-[1.04] hover:bg-[#f0f8e0] hover:border-[#b8d890] active:scale-95"
                  >
                    <div className="relative h-14 w-full overflow-hidden rounded-xl">
                      <Image
                        src={r.imagenUrl}
                        alt={r.nombre}
                        fill
                        className="object-contain"
                        sizes="80px"
                      />
                    </div>
                    <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-[var(--ink-700)]">
                      {r.nombre}
                    </p>
                    <span
                      className="mt-auto rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: (RARITY_COLOR[r.rareza] ?? "#888") + "22",
                        color: RARITY_COLOR[r.rareza] ?? "#888",
                      }}
                    >
                      {RARITY_LABEL[r.rareza] ?? r.rareza}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
