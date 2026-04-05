import type { Metadata } from "next";
import Link from "next/link";
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
import { Testimonials } from "@/components/home/testimonials";
import { HeroFloatingFigures } from "@/components/home/hero-floating-figures";
import { ShopifyBuyExperienceWrapper } from "@/components/home/shopify-buy-wrapper";
import { DailyFigureWrapper } from "@/components/home/daily-figure-wrapper";
import { RecentFigures } from "@/components/home/recent-figures";

export const metadata: Metadata = {
  title: "DOFLINS | Figuras Coleccionables con Rareza Oficial",
  description: "Colecciona figuras DOFLINS con rareza oficial. Tres universos, experiencia de reveal única y sistema de colección verificado.",
  openGraph: {
    title: "DOFLINS | Figuras Coleccionables con Rareza Oficial",
    description: "Colecciona figuras DOFLINS con rareza oficial. Tres universos, experiencia de reveal única.",
  },
};

export default function Home(): React.JSX.Element {
  return (
    <>
      <HomeUniverseSync />
      <div className="home-page-shell">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-6 pb-28 sm:px-8 sm:py-10 sm:pb-10">
          <div className="relative w-full space-y-14 sm:space-y-20">

            {/* ── Hero ── */}
            <section className="relative flex flex-col items-center gap-6 pt-10 text-center sm:pt-20">
              <HeroFloatingFigures />
              <div className="stagger-fade-in space-y-4">
                <h1 className="font-title text-[2.75rem] leading-[1.05] tracking-tight text-[var(--ink-900)] sm:text-6xl md:text-7xl">
                  Colecciona<br />DOFLINS
                </h1>
                <p className="mx-auto max-w-md text-lg text-[var(--ink-600)] sm:text-xl">
                  Figuras coleccionables con rareza oficial.
                </p>
              </div>

              <div className="stagger-fade-in flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.1s' }}>
                <Button asChild size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base shadow-lg">
                  <Link href="#compras">
                    <SparklesIcon className="h-5 w-5" /> Comprar packs
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-13 min-h-[48px] rounded-full px-8 text-base">
                  <Link href="#compras">
                    <ShoppingCartIcon className="h-5 w-5" /> Abrir pack ahora
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
              <UniverseCards />
            </LazySection>

            {/* ── Lo más probable que consigas ── */}
            <LazySection>
              <RecentFigures title="Lo más probable que consigas" viewAllHref="/reveal?universe=animals" />
            </LazySection>

            {/* ── Cómo funciona ── */}
            <LazySection>
              <HowItWorks />
            </LazySection>

            {/* ── Figura del Día ── */}
            <LazySection>
              <DailyFigureWrapper />
            </LazySection>

            {/* ── Tienda / Packs ── */}
            <LazySection>
              <ShopifyBuyExperienceWrapper />
            </LazySection>

            {/* ── Testimonios ── */}
            <LazySection>
              <Testimonials />
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
