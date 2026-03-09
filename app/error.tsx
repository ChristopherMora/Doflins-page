"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HomeIcon, ArrowPathIcon } from "@heroicons/react/24/solid";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <>
      <main className="flex min-h-[80dvh] flex-col items-center justify-center gap-6 px-6 pb-28 py-16 text-center">
        {/* Ilustración */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#fef2d9,#fde0a0)] text-4xl shadow-[0_16px_40px_rgba(234,179,8,0.25)]">
          ⚠️
        </div>

        <div className="space-y-2">
          <p className="font-title text-sm font-bold uppercase tracking-[0.25em] text-amber-600">
            Error inesperado
          </p>
          <h1 className="font-title text-4xl text-[var(--ink-900)] sm:text-5xl">
            Algo salió mal
          </h1>
          <p className="mx-auto max-w-sm text-[var(--ink-700)]">
            Ocurrió un error inesperado. Puedes intentarlo de nuevo o regresar al inicio.
          </p>
          {error.digest ? (
            <p className="font-mono text-[10px] text-[var(--ink-400)] mt-2">
              Código: {error.digest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)]"
          >
            <ArrowPathIcon className="h-4 w-4" /> Intentar de nuevo
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <HomeIcon className="h-4 w-4" /> Ir al inicio
            </Link>
          </Button>
        </div>

        <p className="text-xs text-[var(--ink-400)]">
          ¿El problema persiste?{" "}
          <Link
            href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@doflins.com"}`}
            className="underline hover:text-[var(--ink-700)]"
          >
            Contáctanos
          </Link>
        </p>
      </main>
      <BottomNav />
    </>
  );
}
