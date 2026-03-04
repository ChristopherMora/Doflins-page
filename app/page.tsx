import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircleIcon,
  FireIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SiteHeader } from "@/components/nav/site-header";
import { UniverseCards } from "@/components/home/universe-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-8 pb-28 sm:px-8 sm:py-10 sm:pb-10">
        <div className="w-full space-y-6">

          {/* ── Hero ── */}
          <Card className="w-full overflow-hidden border border-[#d3debb] bg-[linear-gradient(135deg,#f5f8e8,#e8f1d2,#d5e5b2)] shadow-[0_24px_50px_rgba(85,108,50,0.2)]">
            <CardContent className="space-y-5 p-8 text-center sm:p-12">
              {/* live badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c6d99a] bg-white/70 px-4 py-1.5 text-xs font-semibold text-[#3d5230]">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-[#4e6f2a]"
                  style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
                Colección en línea · Animals &amp; Multiverse
              </div>

              <h1 className="font-title text-4xl leading-tight text-[#1f2a1a] sm:text-6xl">
                Colecciona.<br className="hidden sm:block" />{" "}Explora. Completa.
              </h1>
              <p className="mx-auto max-w-2xl text-base text-[#3d5230] sm:text-xl">
                Dos universos, cientos de figuras con rareza oficial. Empieza o completa tu colección DOFLINS.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild size="lg" className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
                  <Link href="#compras">
                    <GlobeAltIcon className="h-5 w-5" /> Ver packs disponibles
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/reveal?universe=animals">
                    <SparklesIcon className="h-5 w-5" /> Explorar catálogo
                  </Link>
                </Button>
              </div>

              {/* mini stats */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-[#3d5230]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 ring-1 ring-[#cad89e]">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-[#4e6f2a]" /> Pago seguro Shopify
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 ring-1 ring-[#cad89e]">
                  <FireIcon className="h-3.5 w-3.5 text-orange-500" /> Rarezas: Común → Legendaria
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 ring-1 ring-[#cad89e]">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-[#4e6f2a]" /> Catálogo oficial QR
                </span>
                <LiveFigureCount />
              </div>
            </CardContent>
          </Card>

          {/* ── Universo cards (client — broadcasts universe on hover/click) ── */}
          <UniverseCards />

          <ShopifyBuyExperience />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
