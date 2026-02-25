import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-16 sm:px-8">
      <Card className="w-full overflow-hidden border-0 bg-[linear-gradient(135deg,#f8fafc,#ecfeff,#fef3c7)]">
        <CardContent className="space-y-6 p-10 text-center sm:p-16">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--ink-600)]">DOFLINS</p>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">Página de verificación de calidad</h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--ink-700)]">
            La experiencia de reveal está lista para producción en <span className="font-semibold">/reveal</span>.
          </p>
          <Link href="/reveal">
            <Button size="lg">
              <SparklesIcon className="h-5 w-5" /> Ir al Reveal
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
