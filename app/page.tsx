import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ShieldCheckIcon,
  SparklesIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { UniverseCards } from "@/components/home/universe-cards";
import { HomeUniverseSync } from "@/components/home/home-universe-sync";
import { Button } from "@/components/ui/button";
import { LazySection } from "@/components/ui/lazy-section";
import { LiveFigureCount } from "@/components/ui/live-figure-count";
import { HowItWorks } from "@/components/home/how-it-works";
import { HeroFloatingFigures } from "@/components/home/hero-floating-figures";
import { ShopifyBuyExperienceWrapper } from "@/components/home/shopify-buy-wrapper";
import { DailyFigureWrapper } from "@/components/home/daily-figure-wrapper";
import { getDb } from "@/lib/db/client";
import { doflins } from "@/lib/db/schema";

const RARITY_RANK: Record<string, number> = {
  MYTHIC: 6, ULTRA: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1,
};
const SERIES_MAP: Record<string, string> = {
  animals: "Animals", mega: "MegaAnimals", multiverse: "Multiverse",
};

type FeaturedFigure = { id: number; imagenUrl: string; nombre: string; rareza: string };
type FeaturedData = { animals: FeaturedFigure[]; mega: FeaturedFigure[]; multiverse: FeaturedFigure[] };

async function getFeaturedFigures(): Promise<FeaturedData> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: doflins.id, nombre: doflins.nombre, serie: doflins.serie, rareza: doflins.rareza, imagenUrl: doflins.imagenUrl })
      .from(doflins)
      .where(eq(doflins.activo, true));

    const featured: FeaturedData = { animals: [], mega: [], multiverse: [] };
    for (const [key, serieName] of Object.entries(SERIES_MAP)) {
      featured[key as keyof FeaturedData] = rows
        .filter((r) => r.serie === serieName)
        .sort((a, b) => (RARITY_RANK[b.rareza] ?? 0) - (RARITY_RANK[a.rareza] ?? 0))
        .slice(0, 3);
    }
    return featured;
  } catch {
    return { animals: [], mega: [], multiverse: [] };
  }
}

export const metadata: Metadata = {
  title: "DOFLINS | Figuras Coleccionables con Rareza Oficial",
  description: "Colecciona figuras DOFLINS con rareza oficial. Tres universos, experiencia de reveal única y sistema de colección verificado.",
  openGraph: {
    title: "DOFLINS | Figuras Coleccionables con Rareza Oficial",
    description: "Colecciona figuras DOFLINS con rareza oficial. Tres universos, experiencia de reveal única.",
  },
};

export default async function Home(): Promise<React.JSX.Element> {
  const featured = await getFeaturedFigures();

  // Preparar las figuras del hero: top 4 únicas por rareza
  const heroFigures = Object.values(featured)
    .flat()
    .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
    .sort((a, b) => (RARITY_RANK[b.rareza] ?? 0) - (RARITY_RANK[a.rareza] ?? 0))
    .slice(0, 4);

  return (
    <>
      <HomeUniverseSync />
      <div className="home-page-shell">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-6 pb-28 sm:px-8 sm:py-10 sm:pb-10">
          <div className="relative w-full space-y-14 sm:space-y-20">

            {/* ── Hero ── */}
            <section className="relative flex flex-col items-center gap-6 pt-10 text-center sm:pt-20">
              <HeroFloatingFigures initialFigures={heroFigures} />
              <div className="stagger-fade-in space-y-4">
                <h1 className="font-title text-[2.75rem] leading-[1.05] tracking-tight text-[var(--ink-900)] sm:text-6xl md:text-7xl">
                  Colecciona<br />DOFLINS
                </h1>
                <p className="mx-auto max-w-md text-lg text-[var(--ink-600)] sm:text-xl">
                  Figuras coleccionables con rareza oficial.
                </p>
                <p className="mx-auto max-w-md text-sm text-[var(--ink-500)] sm:text-base">
                  Tu próxima figura épica puede estar en el pack de Mega.
                </p>
              </div>

              <div className="stagger-fade-in flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.1s' }}>
                <Button asChild size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base shadow-lg">
                  <Link href="#compras">
                    <SparklesIcon className="h-5 w-5" /> Comprar packs
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base">
                  <Link href="/coleccion">
                    <Squares2X2Icon className="h-5 w-5" /> Ver colección
                  </Link>
                </Button>
              </div>

              <Link
                href="/reveal?universe=animals"
                className="stagger-fade-in text-sm text-[var(--ink-500)] underline-offset-2 transition-colors hover:text-[var(--ink-700)] hover:underline"
                style={{ animationDelay: '0.15s' }}
              >
                Ver catálogo completo →
              </Link>

              {/* Trust — minimal */}
              <div className="stagger-fade-in mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)]/70 px-6 py-3 text-sm text-[var(--ink-500)]" style={{ animationDelay: '0.2s' }}>
                <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Pago seguro</span>
                <span className="h-3 w-px bg-[var(--surface-200)]" aria-hidden />
                <span className="inline-flex items-center gap-1.5">✦ Rareza oficial</span>
                <span className="h-3 w-px bg-[var(--surface-200)]" aria-hidden />
                <LiveFigureCount className="inline-flex items-center gap-1.5" countClassName="" />
                <span className="h-3 w-px bg-[var(--surface-200)]" aria-hidden />
                <span className="inline-flex items-center gap-1.5">🇲🇽 Hecho en México</span>
              </div>
            </section>

            {/* ── Universos ── */}
            <LazySection>
              <UniverseCards initialFeatured={featured} />
            </LazySection>

            {/* ── Figura del Día ── */}
            <LazySection>
              <DailyFigureWrapper />
            </LazySection>

            {/* ── Tienda / Packs ── */}
            <LazySection>
              <ShopifyBuyExperienceWrapper />
            </LazySection>

            {/* ── Cómo funciona ── */}
            <LazySection>
              <HowItWorks />
            </LazySection>


          </div>
        </main>
      </div>
      {/* FAB móvil: visible solo en mobile, por encima del bottom-nav */}
      <Link
        href="#compras"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold text-white shadow-xl transition-transform active:scale-95 sm:hidden"
        aria-label="Comprar packs"
      >
        <ShoppingCartIcon className="h-4 w-4" />
        Comprar packs
      </Link>
      <BottomNav />
    </>
  );
}
