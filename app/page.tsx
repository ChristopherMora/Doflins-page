import Link from "next/link";
import { GlobeAltIcon, SparklesIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  const purchaseUrl = process.env.NEXT_PUBLIC_WOO_PRODUCT_URL ?? "https://dofer.com.mx";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-16 sm:px-8">
      <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#f3f7e4,#e4efd0,#d3e3b0)] shadow-[0_25px_55px_rgba(85,108,50,0.2)]">
        <CardContent className="space-y-6 p-10 text-center sm:p-16">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--ink-600)]">DOFLINS UNIVERSE</p>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">Página oficial de colección y rareza</h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--ink-700)]">
            Experiencia completa con secciones Animals y Multiverse, rarezas y catálogo 3D con filtros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/reveal">
              <Button size="lg" className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
                <SparklesIcon className="h-5 w-5" /> Ir al Reveal completo
              </Button>
            </Link>
            <a href={purchaseUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="lg">
                <GlobeAltIcon className="h-5 w-5" /> Comprar packs
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
