import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  const purchaseUrl = process.env.NEXT_PUBLIC_WOO_PRODUCT_URL ?? "https://dofer.mx";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-12 sm:px-8">
      <div className="w-full space-y-6">
        <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#f3f7e4,#e4efd0,#d3e3b0)] shadow-[0_25px_55px_rgba(85,108,50,0.2)]">
          <CardContent className="space-y-4 p-8 text-center sm:p-12">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--ink-600)]">DOFLINS UNIVERSE</p>
            <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">Acceso rápido DOFLINS</h1>
            <p className="mx-auto max-w-2xl text-lg text-[var(--ink-700)]">
              Elige un universo y empieza tu colección.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="relative border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] shadow-[0_14px_30px_rgba(85,108,50,0.15)]">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="w-fit bg-[#e6f2d0] text-[var(--ink-900)]">
                  <SparklesIcon className="h-4 w-4" /> Modo Usuario
                </Badge>
                <span className="inline-flex items-center rounded-full bg-[#f4e8be] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-800)]">
                  Recomendado
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="font-title text-3xl text-[var(--ink-900)]">Explorar colección</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  Descubre Animals, revisa rarezas y guarda tu progreso en el catálogo oficial.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-700)]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Catálogo completo
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 ring-1 ring-[#dfd5ad]">
                  <CheckCircleIcon className="h-4 w-4 text-[var(--brand-primary)]" /> Rarezas y progreso
                </span>
              </div>

              <div className="space-y-2">
                <Button asChild size="lg" className="w-full bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] sm:w-auto">
                  <Link href="/reveal?universe=animals">
                    <SparklesIcon className="h-5 w-5" /> Explorar Animals <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href={purchaseUrl} target="_blank" rel="noreferrer">
                    <GlobeAltIcon className="h-5 w-5" /> Comprar packs
                  </a>
                </Button>
                <p className="text-xs text-[var(--ink-600)]">Acceso directo al catálogo oficial de DOFLINS.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#c8d3f4] bg-[linear-gradient(180deg,#eef2ff,#e3eaff)] shadow-[0_14px_30px_rgba(72,87,152,0.16)]">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="w-fit bg-[#dbe4ff] text-[#1f2c67]">
                  <BoltIcon className="h-4 w-4" /> Universo Multiverse
                </Badge>
                <span className="inline-flex items-center rounded-full bg-[#d9e3ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#2d3f83]">
                  Futurista
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="font-title text-3xl text-[var(--ink-900)]">Doflins Multiverse</h2>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  Entra al universo de variantes más intensas con estética sci-fi y rarezas de alto impacto.
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

              <div className="space-y-2">
                <Button asChild size="lg" className="w-full bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] sm:w-auto">
                  <Link href="/reveal?universe=multiverse">
                    <BoltIcon className="h-5 w-5" /> Explorar Multiverse <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-[var(--ink-600)]">Cambia entre universos dentro del catálogo cuando quieras.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
