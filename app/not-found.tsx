import Link from "next/link";
import { HomeIcon, SparklesIcon } from "@heroicons/react/24/solid";

import { SiteHeader } from "@/components/nav/site-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 – Doflin extraviado | DOFLINS",
  description: "Esta página no existe en el catálogo DOFLINS.",
};

export default function NotFound(): React.JSX.Element {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-6 pb-28 pt-10 text-center sm:pb-10">
        <div className="space-y-6">
          {/* Ilustración emoji */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#eef4d9,#d5e5b2)] text-4xl shadow-[0_16px_40px_rgba(78,111,42,0.2)]">
            🐾
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <p className="font-title text-sm font-bold uppercase tracking-[0.25em] text-[var(--brand-primary)]">
              Error 404
            </p>
            <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
              Doflin extraviado
            </h1>
            <p className="mx-auto max-w-sm text-[var(--ink-700)]">
              Esta figura no existe en el catálogo. Quizás fue tan rara que se perdió antes de llegar.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
              <Link href="/">
                <HomeIcon className="h-4 w-4" /> Volver al inicio
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/reveal?universe=animals">
                <SparklesIcon className="h-4 w-4" /> Ver catálogo
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
