import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { ShopifyBuyExperience } from "@/components/shop/shopify-buy-experience";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 py-8 sm:px-8 sm:py-10">
      <div className="w-full space-y-6">
        <Card className="w-full overflow-hidden border border-[#d3debb] bg-[linear-gradient(135deg,#f5f8e8,#e8f1d2,#d5e5b2)] shadow-[0_24px_50px_rgba(85,108,50,0.2)]">
          <CardContent className="space-y-5 p-8 text-center sm:p-12">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-600)] sm:text-sm">DOFLINS UNIVERSE</p>
            <h1 className="font-title text-4xl leading-tight text-[var(--ink-900)] sm:text-6xl">Acceso rápido DOFLINS</h1>
            <p className="mx-auto max-w-2xl text-base text-[var(--ink-700)] sm:text-xl">
              Elige un universo y empieza tu colección.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="lg" className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
                <Link href="#compras">
                  <GlobeAltIcon className="h-5 w-5" /> Ir a packs
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/reveal?universe=animals">
                  <SparklesIcon className="h-5 w-5" /> Abrir catálogo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="relative border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] shadow-[0_14px_30px_rgba(85,108,50,0.15)] transition hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(85,108,50,0.2)]">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="w-fit bg-[#e6f2d0] text-[var(--ink-900)]">
                  <SparklesIcon className="h-4 w-4" /> Universo Animals
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="font-title text-3xl text-[var(--ink-900)] sm:text-4xl">Doflins Animals</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  Explora criaturas del universo Animals, revisa rarezas y avanza tu colección oficial.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Catálogo completo
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Rarezas naturales
                </span>
              </div>

              <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                <Button asChild size="lg" className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] sm:w-auto">
                  <Link href="/reveal?universe=animals">
                    <SparklesIcon className="h-5 w-5" /> Entrar a Animals <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="#compras">
                    <GlobeAltIcon className="h-5 w-5" /> Comprar packs
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-[var(--ink-600)]">Acceso directo al catálogo oficial de DOFLINS.</p>
            </CardContent>
          </Card>

          <Card className="border border-[#c8d3f4] bg-[linear-gradient(180deg,#eef2ff,#e3eaff)] shadow-[0_14px_30px_rgba(72,87,152,0.16)] transition hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(72,87,152,0.22)]">
            <CardContent className="space-y-5 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="w-fit bg-[#dbe4ff] text-[#1f2c67]">
                  <BoltIcon className="h-4 w-4" /> Universo Multiverse
                </Badge>
              </div>

              <div className="space-y-2">
                <h2 className="font-title text-3xl text-[var(--ink-900)] sm:text-4xl">Doflins Multiverse</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  Entra al universo de variantes intensas con estética sci-fi y rarezas de alto impacto.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
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
                    <BoltIcon className="h-5 w-5" /> Entrar a Multiverse <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="#compras">
                    <GlobeAltIcon className="h-5 w-5" /> Comprar packs
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-[var(--ink-600)]">Cambia entre universos dentro del catálogo cuando quieras.</p>
            </CardContent>
          </Card>
        </div>
        <ShopifyBuyExperience />
      </div>
    </main>
  );
}
