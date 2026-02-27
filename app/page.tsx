import Link from "next/link";
import { GlobeAltIcon, ShieldCheckIcon, SparklesIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  const purchaseUrl = process.env.NEXT_PUBLIC_WOO_PRODUCT_URL ?? "https://dofer.mx";
  const hasSupabaseAdminAuth = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      process.env.ADMIN_EMAILS?.trim(),
  );
  const hasTokenFallback = Boolean(process.env.ADMIN_FORM_TOKEN?.trim());

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-12 sm:px-8">
      <div className="w-full space-y-6">
        <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#f3f7e4,#e4efd0,#d3e3b0)] shadow-[0_25px_55px_rgba(85,108,50,0.2)]">
          <CardContent className="space-y-4 p-8 text-center sm:p-12">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--ink-600)]">DOFLINS UNIVERSE</p>
            <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">Acceso rápido DOFLINS</h1>
            <p className="mx-auto max-w-2xl text-lg text-[var(--ink-700)]">
              Elige tu entrada: experiencia de usuario o panel administrativo.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-[#d8ca9e] bg-[linear-gradient(180deg,#fff9e8,#f3f6e4)] shadow-[0_14px_30px_rgba(85,108,50,0.15)]">
            <CardContent className="space-y-4 p-6">
              <Badge className="w-fit bg-[#e6f2d0] text-[var(--ink-900)]">
                <SparklesIcon className="h-4 w-4" /> Modo Usuario
              </Badge>
              <h2 className="font-title text-3xl text-[var(--ink-900)]">Explorar colección</h2>
              <p className="text-sm text-[var(--ink-700)]">
                Vista pública para clientes: universos, rareza, catálogo y progreso de colección.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/reveal">
                  <Button size="lg" className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]">
                    <SparklesIcon className="h-5 w-5" /> Entrar como usuario
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

          <Card className="border border-[#c8d3f4] bg-[linear-gradient(180deg,#eef2ff,#e3eaff)] shadow-[0_14px_30px_rgba(72,87,152,0.16)]">
            <CardContent className="space-y-4 p-6">
              <Badge className="w-fit bg-[#dbe4ff] text-[#1f2c67]">
                <ShieldCheckIcon className="h-4 w-4" /> Modo Admin
              </Badge>
              <h2 className="font-title text-3xl text-[var(--ink-900)]">Gestionar Doflins</h2>
              <p className="text-sm text-[var(--ink-700)]">
                Alta masiva, edición, activar/desactivar, eliminar y manejo de variantes por personaje base.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/doflins">
                  <Button size="lg" className="bg-[linear-gradient(135deg,#4b5fc0,#687ff1)]">
                    <WrenchScrewdriverIcon className="h-5 w-5" /> Entrar como admin
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-[var(--ink-600)]">
                {hasSupabaseAdminAuth
                  ? "Acceso por Google (Supabase Auth) con lista blanca de correos."
                  : hasTokenFallback
                    ? "Acceso con token de respaldo activo."
                    : "Configura Supabase Auth o token para proteger el panel."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
