import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  FireIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SiteHeader } from "@/components/nav/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LiveFigureCount } from "@/components/ui/live-figure-count";


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

          {/* ── Universo cards ── */}
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="group relative border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] shadow-[0_14px_30px_rgba(85,108,50,0.15)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(85,108,50,0.22)]">
              <CardContent className="space-y-5 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="w-fit bg-[#e6f2d0] text-[#1f2a1a]">
                    <SparklesIcon className="h-4 w-4" /> Universo Animals
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="font-title text-3xl text-[#1f2a1a] sm:text-4xl">Doflins Animals</h2>
                  <p className="text-sm leading-relaxed text-[#3d5230]">
                    Explora criaturas del universo Animals, revisa rarezas y avanza tu colección oficial.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#3d5230]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                    <CheckCircleIcon className="h-4 w-4 text-[#4e6f2a]" /> Catálogo completo
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                    <CheckCircleIcon className="h-4 w-4 text-[#4e6f2a]" /> Rarezas naturales
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  <Button asChild size="lg" className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] sm:w-auto">
                    <Link href="/reveal?universe=animals">
                      <SparklesIcon className="h-5 w-5" /> Entrar a Animals <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="#compras">
                      <GlobeAltIcon className="h-5 w-5" /> Comprar packs
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-[#64785a]">Acceso directo al catálogo oficial de DOFLINS.</p>
              </CardContent>
            </Card>

            <Card className="group border border-[#c8d3f4] bg-[linear-gradient(180deg,#eef2ff,#e3eaff)] shadow-[0_14px_30px_rgba(72,87,152,0.16)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(72,87,152,0.26)]">
              <CardContent className="space-y-5 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="w-fit bg-[#dbe4ff] text-[#1f2c67]">
                    <BoltIcon className="h-4 w-4" /> Universo Multiverse
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="font-title text-3xl text-[#1c2960] sm:text-4xl">Doflins Multiverse</h2>
                  <p className="text-sm leading-relaxed text-[#2d3f7a]">
                    Entra al universo de variantes intensas con estética sci-fi y rarezas de alto impacto.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#2d3f7a]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#ced7fb]">
                    <CheckCircleIcon className="h-4 w-4 text-[#4b5fc0]" /> Variantes especiales
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#ced7fb]">
                    <CheckCircleIcon className="h-4 w-4 text-[#4b5fc0]" /> Rarezas altas
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  <Button asChild size="lg" className="w-full bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] sm:w-auto">
                    <Link href="/reveal?universe=multiverse">
                      <BoltIcon className="h-5 w-5" /> Entrar a Multiverse <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="#compras">
                      <GlobeAltIcon className="h-5 w-5" /> Comprar packs
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-[#3d4f8a]">Cambia entre universos dentro del catálogo cuando quieras.</p>
              </CardContent>
            </Card>
          </div>

          <ShopifyBuyExperience />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
