import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ShieldCheckIcon,
  SparklesIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { UniverseCards } from "@/components/home/universe-cards";
import { HomeUniverseSync } from "@/components/home/home-universe-sync";
import { Button } from "@/components/ui/button";
import { LazySection } from "@/components/ui/lazy-section";
import { LiveFigureCount } from "@/components/ui/live-figure-count";
import { HowItWorks } from "@/components/home/how-it-works";
import { TikTokSection } from "@/components/home/tiktok-section";
import { HeroFloatingFigures } from "@/components/home/hero-floating-figures";
import { ShopifyBuyExperienceWrapper } from "@/components/home/shopify-buy-wrapper";
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

export const revalidate = 3600;

const getFeaturedFigures = unstable_cache(async (): Promise<FeaturedData> => {
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
}, ["home-featured-figures"], { revalidate: 3600 });

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
              </div>

              {/* Social proof — reseñas verificadas */}
              <a
                href="#compras"
                className="stagger-fade-in inline-flex items-center gap-2 rounded-full border border-[var(--surface-200)] bg-white/80 px-4 py-1.5 text-sm shadow-sm transition hover:bg-white/95"
                style={{ animationDelay: '0.05s' }}
              >
                <span className="flex">
                  {[0,1,2,3,4].map((i) => (
                    <svg key={i} className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </span>
                <span className="font-bold text-[var(--ink-800)]">5.0</span>
                <span className="text-[var(--ink-400)]">·</span>
                <span className="text-[var(--ink-600)]">22 reseñas verificadas</span>
              </a>

              <div className="stagger-fade-in flex flex-col items-center gap-3" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base shadow-lg">
                    <Link href="#compras">
                      <SparklesIcon className="h-5 w-5" /> Comprar packs
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base">
                    <Link href="/shop">
                      <ShoppingCartIcon className="h-5 w-5" /> Ver tienda
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-[var(--ink-500)]">
                  Desde <span className="font-semibold text-[var(--ink-700)]">$120 MXN</span> · Envío a todo México
                </p>
              </div>

              {/* Trust — minimal */}
              <div className="stagger-fade-in mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-50)]/70 px-6 py-3 text-sm text-[var(--ink-500)]" style={{ animationDelay: '0.2s' }}>
                <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Pago seguro</span>
                <span className="h-3 w-px bg-[var(--surface-200)]" aria-hidden />
                <span className="inline-flex items-center gap-1.5">✦ Rareza oficial</span>
                <span className="h-3 w-px bg-[var(--surface-200)]" aria-hidden />
                <span className="inline-flex items-center gap-1.5">🚚 Envío a todo México</span>
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

            {/* ── Tienda / Packs ── */}
            <LazySection>
              <ShopifyBuyExperienceWrapper />
            </LazySection>

            {/* ── TikTok ── */}
            <LazySection>
              <TikTokSection />
            </LazySection>

            {/* ── Cómo funciona ── */}
            <LazySection>
              <HowItWorks />
            </LazySection>


          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
