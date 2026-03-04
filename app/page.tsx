import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircleIcon,
  FireIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";

import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SiteHeader } from "@/components/nav/site-header";
import { UniverseCards } from "@/components/home/universe-cards";
import { HomeUniverseSync } from "@/components/home/home-universe-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazySection } from "@/components/ui/lazy-section";
import { LiveFigureCount } from "@/components/ui/live-figure-count";

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
      <SiteHeader />
      <HomeUniverseSync />
      <div className="home-page-shell">
        <main className="home-main mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-4 pb-28 sm:px-8 sm:py-5 sm:pb-10">
          <div className="w-full space-y-3">

            {/* ── Hero ── */}
            <Card className="home-hero-card w-full overflow-hidden border">
              <CardContent className="space-y-2 p-4 text-center sm:p-6">
                {/* live badge */}
                <div className="home-hero-live inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
                  <span
                    className="home-hero-live-dot inline-block h-2 w-2 rounded-full"
                    style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                  />
                  Colección en línea · Animals &amp; Multiverse
                </div>

                <h1 className="home-hero-title font-title text-4xl leading-tight sm:text-5xl">
                  Colecciona. Explora. Completa.
                </h1>
                <p className="home-hero-copy mx-auto max-w-xl text-sm sm:text-base">
                  Dos universos, cientos de figuras con rareza oficial.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild size="lg" className="home-hero-primary-btn">
                    <Link href="#compras">
                      <ShoppingCartIcon className="h-5 w-5" /> Ver packs disponibles
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="home-hero-secondary-btn">
                    <Link href="/reveal?universe=animals">
                      <Squares2X2Icon className="h-5 w-5" /> Explorar catálogo
                    </Link>
                  </Button>
                </div>

                {/* Flujo de pasos */}
                <div className="home-hero-steps flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <span className="home-hero-step-num">①</span> Elige universo
                  </span>
                  <span className="home-hero-step-arrow">→</span>
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <span className="home-hero-step-num">②</span> Agrega tu bolsa
                  </span>
                  <span className="home-hero-step-arrow">→</span>
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <span className="home-hero-step-num">③</span> Finaliza en Shopify
                  </span>
                </div>

                {/* Trust badges */}
                <div className="home-hero-trust flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <ShieldCheckIcon className="home-hero-pill-icon h-3.5 w-3.5" /> Pago seguro Shopify
                  </span>
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <FireIcon className="h-3.5 w-3.5 text-orange-500" /> Rarezas: Común → Legendaria
                  </span>
                  <span className="home-hero-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1">
                    <CheckCircleIcon className="home-hero-pill-icon h-3.5 w-3.5" /> Catálogo oficial QR
                  </span>
                  <LiveFigureCount className="home-hero-pill" countClassName="home-hero-pill-icon" />
                </div>
              </CardContent>
            </Card>

            {/* ── Universo cards ── */}
            <LazySection>
              <UniverseCards />
            </LazySection>

            <LazySection>
              <ShopifyBuyExperience />
            </LazySection>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
