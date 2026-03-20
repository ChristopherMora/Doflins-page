import type { Metadata } from "next";
import Link from "next/link";
import {
  FireIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { BottomNav } from "@/components/nav/bottom-nav";
import { UniverseCards } from "@/components/home/universe-cards";
import { HomeUniverseSync } from "@/components/home/home-universe-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazySection } from "@/components/ui/lazy-section";
import { LiveFigureCount } from "@/components/ui/live-figure-count";
import { ActivityFeed } from "@/components/home/activity-feed";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";

export const metadata: Metadata = {
  title: "DOFLINS | Colección Oficial Animals + Multiverse",
  description: "Colecciona figuras DOFLINS con rareza oficial. Explora los universos Animals y Multiverse, compra packs exclusivos y completa tu colección con sistema de rareza verificado.",
  openGraph: {
    title: "DOFLINS | Colección Oficial Animals + Multiverse",
    description: "Colecciona figuras DOFLINS con rareza oficial. Explora Animals y Multiverse, compra packs y completa tu colección.",
  },
};

export default function Home(): React.JSX.Element {
  return (
    <>
      <HomeUniverseSync />
      <div className="home-page-shell">
        <main className="home-main mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-4 pb-28 sm:px-8 sm:py-5 sm:pb-10">
          <div className="relative w-full space-y-3">

            {/* Decorative wood corner accents */}
            <span aria-hidden className="home-wood-corner home-wood-corner--tl">🪵</span>
            <span aria-hidden className="home-wood-corner home-wood-corner--tr">🪵</span>

            {/* ── Hero ── */}
            <Card className="home-hero-card w-full overflow-hidden border">
              <CardContent className="relative p-5 text-center sm:p-8">

                {/* Subtle floating leaf decorations */}
                <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
                  <span className="home-deco home-deco--1">🍃</span>
                  <span className="home-deco home-deco--3">🌿</span>
                  <span className="home-deco home-deco--4">✦</span>
                  <span className="home-deco home-deco--6">🌿</span>
                </div>

                {/* Main hero content */}
                <div className="relative z-[1] space-y-5">
                  {/* live badge */}
                  <div className="home-hero-live inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
                    <span
                      className="home-hero-live-dot inline-block h-2 w-2 rounded-full"
                      style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                    />
                    Animals · Mega · Multiverse
                  </div>

                  <div className="space-y-2">
                    <h1 className="home-hero-title font-title text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
                      Colecciona. Explora.<br className="hidden sm:inline" /> Completa.
                    </h1>
                    <p className="home-hero-copy mx-auto max-w-md text-base sm:text-lg">
                      Tres universos, cientos de figuras con rareza oficial.<br className="hidden sm:inline" />
                      Encuentra la tuya y completa tu colección.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="lg" className="home-hero-primary-btn h-12 rounded-2xl px-6 text-base shadow-lg">
                      <Link href="#compras">
                        <ShoppingCartIcon className="h-5 w-5" /> Ver packs disponibles
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg" className="home-hero-secondary-btn h-12 rounded-2xl px-6 text-base">
                      <Link href="/reveal?universe=animals">
                        <Squares2X2Icon className="h-5 w-5" /> Explorar catálogo
                      </Link>
                    </Button>
                  </div>

                  {/* Trust — una sola fila compacta */}
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-[var(--ink-500)]">
                    <span className="inline-flex items-center gap-1.5"><ShieldCheckIcon className="h-3.5 w-3.5" /> Pago seguro</span>
                    <span className="inline-flex items-center gap-1.5"><FireIcon className="h-3.5 w-3.5 text-orange-400" /> 4 rarezas</span>
                    <LiveFigureCount className="inline-flex items-center gap-1.5" countClassName="" />
                  </div>

                  {/* Activity feed — reveals recientes */}
                  <div className="flex justify-center">
                    <ActivityFeed />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ── Wood divider ── */}
            <div aria-hidden className="home-wood-divider" />

            {/* ── Universo cards ── */}
            <LazySection>
              <UniverseCards />
            </LazySection>

            {/* ── Cómo funciona ── */}
            <LazySection>
              <HowItWorks />
            </LazySection>

            {/* ── Wood divider ── */}
            <div aria-hidden className="home-wood-divider" />

            <LazySection>
              <ShopifyBuyExperience />
            </LazySection>

            {/* ── Testimonios ── */}
            <LazySection>
              <Testimonials />
            </LazySection>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
