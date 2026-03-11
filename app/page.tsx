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
import { UniverseCards } from "@/components/home/universe-cards";
import { HomeUniverseSync } from "@/components/home/home-universe-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazySection } from "@/components/ui/lazy-section";
import { LiveFigureCount } from "@/components/ui/live-figure-count";
import { ActivityFeed } from "@/components/home/activity-feed";

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
          <div className="w-full space-y-3">

            {/* ── Hero ── */}
            <Card className="home-hero-card w-full overflow-hidden border">
              <CardContent className="space-y-4 p-4 text-center sm:p-6">
                {/* live badge */}
                <div className="home-hero-live inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <span
                    className="home-hero-live-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                  />
                  Animals &amp; Multiverse
                </div>

                <h1 className="home-hero-title font-title text-4xl leading-tight sm:text-5xl">
                  Colecciona. Explora. Completa.
                </h1>
                <p className="home-hero-copy mx-auto max-w-sm text-sm">
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

                {/* Trust — una sola fila compacta */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[var(--ink-500)]">
                  <span className="inline-flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3" /> Pago seguro</span>
                  <span className="inline-flex items-center gap-1"><FireIcon className="h-3 w-3 text-orange-400" /> 4 rarezas</span>
                  <LiveFigureCount className="inline-flex items-center gap-1" countClassName="" />
                </div>

                {/* Activity feed — reveals recientes */}
                <div className="flex justify-center">
                  <ActivityFeed />
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
